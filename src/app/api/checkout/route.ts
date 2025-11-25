import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SaleType } from "@prisma/client";
import { getIO } from "@/lib/socket";
import { calculateExpirationDate } from "@/lib/date-utils";

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

            // Atomic update: Find and mark profiles as unavailable in one operation
            const profileUpdateResult = await tx.accountProfile.updateMany({
              where: {
                streamingAccountId: streamingAccount.id,
                isAvailable: true,
              },
              data: {
                isAvailable: false,
                soldToUserId: userId,
                soldAt: new Date(),
              },
            });

            if (profileUpdateResult.count < quantity) {
              throw new Error(
                `Stock insuficiente para ${streamingAccount.name}. Solo se pudieron asignar ${profileUpdateResult.count} de ${quantity} perfiles.`
              );
            }

            // Get the assigned profiles for order creation
            const assignedProfiles = await tx.accountProfile.findMany({
              where: {
                streamingAccountId: streamingAccount.id,
                soldToUserId: userId,
                isAvailable: false,
              },
              take: quantity,
              orderBy: { soldAt: "desc" },
            });

            // Create orders for each assigned profile
            for (const profile of assignedProfiles) {
              const order = await tx.order.create({
                data: {
                  userId,
                  streamingAccountId: streamingAccount.id,
                  accountProfileId: profile.id,
                  accountEmail: profile.email,
                  accountPassword: profile.password,
                  profileName: profile.profileName,
                  profilePin: profile.profilePin,
                  quantity: 1,
                  saleType: "PROFILES",
                  totalPrice: priceAtTime,
                  status: "COMPLETED",
                  expiresAt: calculateExpirationDate(streamingAccount.duration),
                },
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

            // Atomic update: Find and mark accounts as unavailable in one operation
            const accountUpdateResult = await tx.accountStock.updateMany({
              where: {
                streamingAccountId: streamingAccount.id,
                isAvailable: true,
              },
              data: {
                isAvailable: false,
                soldToUserId: userId,
                soldAt: new Date(),
              },
            });

            if (accountUpdateResult.count < quantity) {
              throw new Error(
                `Stock insuficiente para ${streamingAccount.name}. Solo se pudieron asignar ${accountUpdateResult.count} de ${quantity} cuentas.`
              );
            }

            // Get the assigned accounts for order creation
            const assignedAccounts = await tx.accountStock.findMany({
              where: {
                streamingAccountId: streamingAccount.id,
                soldToUserId: userId,
                isAvailable: false,
              },
              take: quantity,
              orderBy: { soldAt: "desc" },
            });

            // Create orders for each assigned account
            for (const account of assignedAccounts) {
              const order = await tx.order.create({
                data: {
                  userId,
                  streamingAccountId: streamingAccount.id,
                  accountStockId: account.id,
                  accountEmail: account.email,
                  accountPassword: account.password,
                  quantity: 1,
                  saleType: "FULL",
                  totalPrice: priceAtTime,
                  status: "COMPLETED",
                  expiresAt: calculateExpirationDate(streamingAccount.duration),
                },
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

          // Atomic update: Find and mark exclusive stocks as unavailable in one operation
          const exclusiveUpdateResult = await tx.exclusiveStock.updateMany({
            where: {
              exclusiveAccountId: exclusiveAccount.id,
              isAvailable: true,
            },
            data: {
              isAvailable: false,
              soldToUserId: userId,
              soldAt: new Date(),
            },
          });

          if (exclusiveUpdateResult.count < quantity) {
            throw new Error(
              `Stock insuficiente para ${exclusiveAccount.name}. Solo se pudieron asignar ${exclusiveUpdateResult.count} de ${quantity} cuentas.`
            );
          }

          // Get the assigned exclusive stocks for order creation
          const assignedExclusiveStocks = await tx.exclusiveStock.findMany({
            where: {
              exclusiveAccountId: exclusiveAccount.id,
              soldToUserId: userId,
              isAvailable: false,
            },
            take: quantity,
            orderBy: { soldAt: "desc" },
          });

          // Create orders for each assigned exclusive stock
          for (const stock of assignedExclusiveStocks) {
            const order = await tx.order.create({
              data: {
                userId,
                exclusiveAccountId: exclusiveAccount.id,
                exclusiveStockId: stock.id,
                accountEmail: stock.email,
                accountPassword: stock.password,
                quantity: 1,
                saleType:
                  exclusiveAccount.saleType === "PROFILES"
                    ? SaleType.PROFILES
                    : SaleType.FULL,
                totalPrice: priceAtTime,
                status: "COMPLETED",
                expiresAt: calculateExpirationDate(exclusiveAccount.duration),
              },
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
    console.log(" IO disponible:", !!io);
    if (io) {
      console.log("Iniciando emisión de stock updates");
      console.log("Items en carrito:", cart.items.length);

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
