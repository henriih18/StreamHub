import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIO, broadcastStockUpdate } from "@/lib/socket";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return await db.$transaction(
    async (tx) => {
      try {
        const resolvedParams = await params;
        const body = await request.json();
        const { quantity } = body;

        if (quantity < 0) {
          return NextResponse.json(
            { error: "La cantidad no puede ser negativa." },
            { status: 400 }
          );
        }

        //OBTENER CART ITEM CON EL CART PARA TENER EL USER ID
        const cartItem = await tx.cartItem.findUnique({
          where: { id: resolvedParams.id },
          include: {
            streamingAccount: {
              include: {
                accountStocks: true,
                profileStocks: true,
              },
            },
            cart: {
              //INCLUIR EL CART PARA OBTENER USER ID
              select: {
                userId: true,
              },
            },
          },
        });

        // VERIFICACIONES DE SEGURIDAD
        if (!cartItem) {
          return NextResponse.json(
            { error: "Artículo del carrito no encontrado" },
            { status: 404 }
          );
        }

        if (!cartItem.cart || !cartItem.cart.userId) {
          return NextResponse.json(
            { error: "Carrito no encontrado o sin usuario asociado" },
            { status: 404 }
          );
        }

        if (!cartItem.streamingAccountId) {
          return NextResponse.json(
            {
              error:
                "El artículo del carrito no tiene una cuenta de streaming asociada",
            },
            { status: 400 }
          );
        }

        //VERIFICAR STOCK CONSIDERANDO RESERVAS
        if (cartItem.streamingAccount) {
          // Contar stock disponible
          const availableStock =
            cartItem.saleType === "PROFILES"
              ? await tx.accountProfile.count({
                  where: {
                    streamingAccountId: cartItem.streamingAccountId,
                    isAvailable: true,
                  },
                })
              : await tx.accountStock.count({
                  where: {
                    streamingAccountId: cartItem.streamingAccountId,
                    isAvailable: true,
                  },
                });

          // Verificar reservas existentes (excluyendo la reserva actual)
          const existingReservations = await tx.stockReservation.aggregate({
            where: {
              accountId: cartItem.streamingAccountId,
              accountType: "STREAMING",
              expiresAt: { gt: new Date() },
            },
            _sum: { quantity: true },
          });

          // BUSCAR LA RESERVA ACTUAL DEL USUARIO
          const currentReservation = await tx.stockReservation.findFirst({
            where: {
              userId: cartItem.cart.userId, //AHORA SÍ EXISTE
              accountId: cartItem.streamingAccountId,
              accountType: "STREAMING",
            },
          });

          // Calcular stock real disponible
          const reservedStock =
            (existingReservations._sum.quantity || 0) -
            (currentReservation?.quantity || 0);
          const realAvailableStock = availableStock - reservedStock;

          if (realAvailableStock < quantity) {
            return NextResponse.json(
              {
                error: `Stock insuficiente. Solo hay ${realAvailableStock} unidad${
                  realAvailableStock !== 1 ? "es" : ""
                } disponible${realAvailableStock !== 1 ? "s" : ""}.`,
              },
              { status: 400 }
            );
          }

          // ACTUALIZAR O CREAR LA RESERVA
          if (currentReservation) {
            // Actualizar reserva existente
            await tx.stockReservation.update({
              where: { id: currentReservation.id },
              data: {
                quantity: quantity,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
              },
            });
          } else {
            // Crear nueva reserva
            await tx.stockReservation.create({
              data: {
                userId: cartItem.cart.userId, // USAR EL USER ID DEL CART
                accountId: cartItem.streamingAccountId,
                accountType: "STREAMING",
                quantity: quantity,
                expiresAt: new Date(Date.now() + 5 * 60 * 1000),
              },
            });
          }
        }

        // Update cart item
        const updatedCartItem = await tx.cartItem.update({
          where: { id: resolvedParams.id },
          data: { quantity },
        });

        // Update cart total
        await updateCartTotal(cartItem.cartId);

        // Emitir actualización de stock en tiempo real
        const io = getIO();
        if (io && cartItem.streamingAccount) {
          // Calcular stock real considerando reservas
          const totalStock =
            cartItem.saleType === "PROFILES"
              ? await tx.accountProfile.count({
                  where: {
                    streamingAccountId: cartItem.streamingAccountId,
                    isAvailable: true,
                  },
                })
              : await tx.accountStock.count({
                  where: {
                    streamingAccountId: cartItem.streamingAccountId,
                    isAvailable: true,
                  },
                });

          // Obtener reservas existentes
          const existingReservations = await tx.stockReservation.aggregate({
            where: {
              accountId: cartItem.streamingAccountId,
              accountType: "STREAMING",
              expiresAt: { gt: new Date() },
            },
            _sum: { quantity: true },
          });

          //Obtener la reserva actual del usuario DENTRO del contexto del WebSocket
          const currentReservationForWebSocket =
            await tx.stockReservation.findFirst({
              where: {
                userId: cartItem.cart.userId,
                accountId: cartItem.streamingAccountId,
                accountType: "STREAMING",
              },
            });

          const reservedStock =
            (existingReservations._sum.quantity || 0) -
            (currentReservationForWebSocket?.quantity || 0);
          const realAvailableStock = Math.max(0, totalStock - reservedStock);

          broadcastStockUpdate(io, {
            accountId: cartItem.streamingAccountId,
            accountType: "regular",
            type: cartItem.saleType,
            newStock: Math.max(0, realAvailableStock - quantity),
          });
        }

        return NextResponse.json(updatedCartItem);
      } catch (error) {
        console.error("Error updating cart item:", error);
        if (error instanceof Error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json(
          { error: "Error al actualizar el artículo del carrito" },
          { status: 500 }
        );
      }
    },
    {
      timeout: 5000, // Timeout de 5 segundos
    }
  );
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    // VERIFICAR PRIMERO SI EL ITEM EXISTE
    const cartItem = await db.cartItem.findUnique({
      where: { id: resolvedParams.id },
      include: {
        cart: { select: { userId: true } },
      },
    });

    //  Item ya no existe (eliminado por limpieza)
    if (!cartItem) {
      return NextResponse.json({
        success: true,
        message: "El artículo ya expiró y fue eliminado automáticamente",
        alreadyDeleted: true,
        autoCleaned: true,
      });
    }

    //  Item existe, eliminar manualmente
    await db.$transaction(async (tx) => {
      // Eliminar reserva
      if (cartItem.streamingAccountId && cartItem.cart) {
        await tx.stockReservation.deleteMany({
          where: {
            userId: cartItem.cart.userId,
            accountId: cartItem.streamingAccountId,
            accountType: "STREAMING",
          },
        });
      }

      // Eliminar item
      await tx.cartItem.delete({
        where: { id: resolvedParams.id },
      });

      // Actualizar total
      if (cartItem.cartId) {
        await updateCartTotal(cartItem.cartId, tx);
      }

      // Emitir actualización de stock en tiempo real
      const io = getIO();
      if (io && cartItem.streamingAccountId) {
        // Calcular stock real considerando reservas
        const totalStock =
          cartItem.saleType === "PROFILES"
            ? await tx.accountProfile.count({
                where: {
                  streamingAccountId: cartItem.streamingAccountId,
                  isAvailable: true,
                },
              })
            : await tx.accountStock.count({
                where: {
                  streamingAccountId: cartItem.streamingAccountId,
                  isAvailable: true,
                },
              });

        // Obtener reservas existentes
        const existingReservations = await tx.stockReservation.aggregate({
          where: {
            accountId: cartItem.streamingAccountId,
            accountType: "STREAMING",
            expiresAt: { gt: new Date() },
          },
          _sum: { quantity: true },
        });

        const reservedStock = existingReservations._sum.quantity || 0;
        const realAvailableStock = Math.max(0, totalStock - reservedStock);

        broadcastStockUpdate(io, {
          accountId: cartItem.streamingAccountId,
          accountType: "regular",
          type: cartItem.saleType,
          newStock: realAvailableStock,
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: "Artículo eliminado exitosamente",
      itemName: cartItem.streamingAccountId
        ? "Streaming Account"
        : "Exclusive Account",
      alreadyDeleted: false,
      manuallyDeleted: true,
    });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return NextResponse.json(
      { error: "Error al eliminar el artículo del carrito" },
      { status: 500 }
    );
  }
}

async function updateCartTotal(cartId: string, tx: any = db) {
  const items = await tx.cartItem.findMany({
    where: { cartId },
    select: {
      priceAtTime: true,
      quantity: true,
    },
  });

  const totalAmount = items.reduce((total, item) => {
    return total + item.priceAtTime * item.quantity;
  }, 0);

  await tx.cart.update({
    where: { id: cartId },
    data: { totalAmount },
  });
}
