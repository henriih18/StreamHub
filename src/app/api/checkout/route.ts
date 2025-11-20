import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SaleType } from "@prisma/client";
import { getIO } from "@/lib/socket";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Se requiere el ID de usuario" },
        { status: 400 }
      );
    }

    // Get user's cart with items
    const cart = await db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            streamingAccount: {
              include: {
                streamingType: true,
                accountStocks: true,
                profileStocks: true,
              },
            },
            exclusiveAccount: {
              include: {
                allowedUsers: true,
                exclusiveStocks: {
                  where: {
                    isAvailable: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 }
      );
    }

    // Get user's current credits
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true, isBlocked: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { error: "El usuario está bloqueado" },
        { status: 403 }
      );
    }

    const totalAmount = cart.totalAmount;

    // Check if user has enough credits
    if (user.credits < totalAmount) {
      return NextResponse.json(
        { error: "Créditos insuficientes" },
        { status: 400 }
      );
    }

    // Process the order using a transaction
    const result = await db.$transaction(async (tx) => {
      // Deduct credits from user
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: {
            decrement: totalAmount,
          },
        },
      });

      //Verificar reservas antes de procesar

      const reservationsToDelete: string[] = [];

      for (const cartItem of cart.items) {
        const { streamingAccount, exclusiveAccount, quantity, saleType } =
          cartItem;

        if (streamingAccount) {
          const reservation = await tx.stockReservation.findFirst({
            where: {
              userId: userId,
              accountId: streamingAccount.id,
              accountType: "STREAMING",
            },
          });

          if (!reservation || reservation.expiresAt < new Date()) {
            throw new Error(
              `Tu reserva para ${streamingAccount.name} expiró. Por favor, agrécala nuevamente al carrito.`
            );
          }

          if (reservation.quantity < quantity) {
            throw new Error(
              `La cantidad reservada para ${streamingAccount.name} es insuficiente.`
            );
          }

          reservationsToDelete.push(reservation.id);
        } else if (exclusiveAccount) {
          const reservation = await tx.stockReservation.findFirst({
            where: {
              userId: userId,
              accountId: exclusiveAccount.id,
              accountType: "EXCLUSIVE",
            },
          });

          if (!reservation || reservation.expiresAt < new Date()) {
            throw new Error(
              `Tu reserva para ${exclusiveAccount.name} expiró. Por favor, agrécala nuevamente al carrito.`
            );
          }

          if (reservation.quantity < quantity) {
            throw new Error(
              `La cantidad reservada para ${exclusiveAccount.name} es insuficiente.`
            );
          }

          reservationsToDelete.push(reservation.id);
        }
      }

      if (reservationsToDelete.length > 0) {
        await tx.stockReservation.deleteMany({
          where: {
            id: { in: reservationsToDelete },
          },
        });
      }

      // Create orders for each cart item
      const orders: any[] = [];
      for (const cartItem of cart.items) {
        const {
          streamingAccount,
          exclusiveAccount,
          quantity,
          saleType,
          priceAtTime,
        } = cartItem;

        if (streamingAccount) {
          // Process streaming account
          // Check stock availability
          let availableStock = 0;
          let stockQuery: any = {};

          if (saleType === "PROFILES") {
            // Handle profile stock
            availableStock =
              streamingAccount.profileStocks?.filter(
                (stock) => stock.isAvailable
              ).length || 0;
            if (availableStock < quantity) {
              throw new Error(
                `Stock insuficiente para ${streamingAccount.name}. Solo hay ${availableStock} perfiles disponibles.`
              );
            }

            // Get available profile stocks
            const profileStocks = await tx.accountProfile.findMany({
              where: {
                streamingAccountId: streamingAccount.id,
                isAvailable: true,
              },
              take: quantity,
            });

            // Create orders for each profile
            for (const stock of profileStocks) {
              const order = await tx.order.create({
                data: {
                  userId,
                  streamingAccountId: streamingAccount.id,
                  accountProfileId: stock.id,
                  accountEmail: stock.email,
                  accountPassword: stock.password,
                  profileName: stock.profileName,
                  profilePin: stock.profilePin,
                  quantity: 1,
                  saleType: "PROFILES",
                  totalPrice: priceAtTime,
                  status: "COMPLETED",
                  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                },
              });

              // Mark stock as unavailable
              await tx.accountProfile.update({
                where: { id: stock.id },
                data: { isAvailable: false },
              });

              orders.push(order);
            }
          } else {
            // Handle full account stock
            availableStock =
              streamingAccount.accountStocks?.filter(
                (stock) => stock.isAvailable
              ).length || 0;
            if (availableStock < quantity) {
              throw new Error(
                `Stock insuficiente para ${streamingAccount.name}. Solo hay ${availableStock} cuentas disponibles.`
              );
            }

            // Get available account stocks
            const accountStocks = await tx.accountStock.findMany({
              where: {
                streamingAccountId: streamingAccount.id,
                isAvailable: true,
              },
              take: quantity,
            });

            // Create orders for each account
            for (const stock of accountStocks) {
              const order = await tx.order.create({
                data: {
                  userId,
                  streamingAccountId: streamingAccount.id,
                  accountStockId: stock.id,
                  accountEmail: stock.email,
                  accountPassword: stock.password,
                  quantity: 1,
                  saleType: "FULL",
                  totalPrice: priceAtTime,
                  status: "COMPLETED",
                  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                },
              });

              // Mark stock as unavailable
              await tx.accountStock.update({
                where: { id: stock.id },
                data: { isAvailable: false },
              });

              orders.push(order);
            }
          }
        } else if (exclusiveAccount) {
          // Process exclusive account
          const availableStock = exclusiveAccount.exclusiveStocks?.length || 0;
          if (availableStock < quantity) {
            throw new Error(
              `Stock insuficiente para ${exclusiveAccount.name}. Solo hay ${availableStock} cuentas disponibles.`
            );
          }

          // Get available exclusive stocks
          const exclusiveStocks = await tx.exclusiveStock.findMany({
            where: {
              exclusiveAccountId: exclusiveAccount.id,
              isAvailable: true,
            },
            take: quantity,
          });

          // Create orders for each exclusive account
          for (const stock of exclusiveStocks) {
            const order = await tx.order.create({
              data: {
                userId,
                exclusiveAccountId: exclusiveAccount.id,
                exclusiveStockId: stock.id,
                accountEmail: stock.email,
                accountPassword: stock.password,
                quantity: 1,
                /* saleType: exclusiveAccount.saleType || 'FULL', */
                saleType:
                  exclusiveAccount.saleType === "PROFILES"
                    ? SaleType.PROFILES
                    : SaleType.FULL,
                totalPrice: priceAtTime,
                status: "COMPLETED",
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              },
            });

            // Mark stock as unavailable
            await tx.exclusiveStock.update({
              where: { id: stock.id },
              data: { isAvailable: false },
            });

            orders.push(order);
          }
        }
      }

      // Clear the cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      await tx.cart.update({
        where: { id: cart.id },
        data: { totalAmount: 0 },
      });

      return orders;
    });

    // Emitir actualizaciones de stock en tiempo real
    const io = getIO();
    console.log("🔍 IO disponible:", !!io);
    if (io) {
      console.log("🚀 Iniciando emisión de stock updates");
      console.log("📊 Items en carrito:", cart.items.length);

      for (const cartItem of cart.items) {
        const { streamingAccount, exclusiveAccount, quantity, saleType } =
          cartItem;

        if (streamingAccount) {
          // Calcular stock restante
          const currentStock =
            saleType === "PROFILES"
              ? streamingAccount.profileStocks?.filter(
                  (stock) => stock.isAvailable
                ).length || 0
              : streamingAccount.accountStocks?.filter(
                  (stock) => stock.isAvailable
                ).length || 0;

          io.emit("stockUpdated", {
            accountId: streamingAccount.id,
            accountType: "regular",
            type: saleType,
            newStock: Math.max(0, currentStock - quantity),
          });
        } else if (exclusiveAccount) {
          const currentStock =
            exclusiveAccount.exclusiveStocks?.filter(
              (stock) => stock.isAvailable
            ).length || 0;

          io.emit("stockUpdated", {
            accountId: exclusiveAccount.id,
            accountType: "exclusive",
            type: exclusiveAccount.saleType,
            newStock: Math.max(0, currentStock - quantity),
          });
        }
      }
    }

    // Get updated user credits
    const updatedUser = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    return NextResponse.json({
      success: true,
      message: "Pago procesado exitosamente",
      orders: result,
      newCredits: updatedUser?.credits || 0,
    });
  } catch (error) {
    console.error("Error processing checkout:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Error al procesar el pago" },
      { status: 500 }
    );
  }
}
