/* import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de usuario' },
        { status: 400 }
      )
    }

    // Get exclusive accounts the user has access to
    const exclusiveAccounts = await db.exclusiveAccount.findMany({
      where: {
        isActive: true,
        OR: [
          { isPublic: true },
          { 
            allowedUsers: {
              some: {
                id: userId
              }
            }
          }
        ]
      },
      include: {
        allowedUsers: {
          where: {
            id: userId
          }
        },
        exclusiveStocks: {
          where: {
            isAvailable: true
          }
        }
      }
    })

    return NextResponse.json(exclusiveAccounts)
  } catch (error) {
    //console.error('Error fetching exclusive accounts:', error)
    return NextResponse.json(
      { error: 'Error al recuperar cuentas exclusivas' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, exclusiveAccountId, quantity = 1 } = body

    if (!userId || !exclusiveAccountId) {
      return NextResponse.json(
        { error: 'Se requieren el ID de usuario y el ID de cuenta exclusivo.' },
        { status: 400 }
      )
    }

    // Get exclusive account details
    const exclusiveAccount = await db.exclusiveAccount.findUnique({
      where: { id: exclusiveAccountId },
      include: {
        allowedUsers: true,
        exclusiveStocks: {
          where: {
            isAvailable: true
          }
        }
      }
    })

    if (!exclusiveAccount) {
      return NextResponse.json(
        { error: 'Cuenta exclusiva no encontrada' },
        { status: 404 }
      )
    }

    // Check if user has access to this exclusive account
    const hasAccess = exclusiveAccount.isPublic || 
      (exclusiveAccount.allowedUsers && exclusiveAccount.allowedUsers.some(user => user.id === userId))

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Acceso denegado a esta cuenta exclusiva' },
        { status: 403 }
      )
    }

    // Check stock availability
    const availableStock = exclusiveAccount.exclusiveStocks.length
    if (availableStock < quantity) {
      return NextResponse.json(
        { error: `Stock insuficiente. Solo hay ${availableStock} unidades disponibles` },
        { status: 400 }
      )
    }

    // Get or create cart
    let cart = await db.cart.findUnique({
      where: { userId }
    })

    if (!cart) {
      cart = await db.cart.create({
        data: {
          userId,
          totalAmount: 0
        }
      })
    }

    // Check if item already exists in cart
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        exclusiveAccountId: exclusiveAccountId
      }
    })

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity
      
      // Check stock again
      if (availableStock < newQuantity) {
        return NextResponse.json(
          { error: `Stock insuficiente. Solo hay ${availableStock} unidades disponibles` },
          { status: 400 }
        )
      }

      const updatedItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity
        }
      })

      // Update cart total
      await updateCartTotal(cart.id)
      
      return NextResponse.json(updatedItem)
    } else {
      // Create new cart item with exclusive account ID
      const cartItem = await db.cartItem.create({
        data: {
          cartId: cart.id,
          exclusiveAccountId: exclusiveAccountId,
          quantity: quantity,
          saleType: exclusiveAccount.saleType as 'FULL' | 'PROFILES',
          priceAtTime: exclusiveAccount.price
        }
      })

      // Update cart total
      await updateCartTotal(cart.id)

      return NextResponse.json(cartItem, { status: 201 })
    }
  } catch (error) {
    //console.error('Error adding exclusive account to cart:', error)
    return NextResponse.json(
      { error: 'Error al agregar al carrito' },
      { status: 500 }
    )
  }
}

async function updateCartTotal(cartId: string) {
  const items = await db.cartItem.findMany({
    where: { cartId }
  })

  const totalAmount = items.reduce((total, item) => {
    return total + (item.priceAtTime * item.quantity)
  }, 0)

  await db.cart.update({
    where: { id: cartId },
    data: { totalAmount }
  })
} */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIO, broadcastStockUpdate } from "@/lib/socket";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Se requiere el ID de usuario" },
        { status: 400 }
      );
    }

    // Get exclusive accounts user has access to
    const exclusiveAccounts = await db.exclusiveAccount.findMany({
      where: {
        isActive: true,
        OR: [
          { isPublic: true },
          {
            allowedUsers: {
              some: {
                id: userId,
              },
            },
          },
        ],
      },
      include: {
        allowedUsers: {
          where: {
            id: userId,
          },
        },
        exclusiveStocks: {
          where: {
            isAvailable: true,
          },
        },
      },
    });

    return NextResponse.json(exclusiveAccounts);
  } catch (error) {
    //console.error('Error fetching exclusive accounts:', error)
    return NextResponse.json(
      { error: "Error al recuperar cuentas exclusivas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, exclusiveAccountId, quantity = 1 } = body;

    if (!userId || !exclusiveAccountId) {
      return NextResponse.json(
        { error: "Se requieren el ID de usuario y el ID de cuenta exclusivo." },
        { status: 400 }
      );
    }

    // Get exclusive account details
    const exclusiveAccount = await db.exclusiveAccount.findUnique({
      where: { id: exclusiveAccountId },
      include: {
        allowedUsers: true,
        exclusiveStocks: {
          where: {
            isAvailable: true,
          },
        },
      },
    });

    if (!exclusiveAccount) {
      return NextResponse.json(
        { error: "Cuenta exclusiva no encontrada" },
        { status: 404 }
      );
    }

    // Check if user has access to this exclusive account
    const hasAccess =
      exclusiveAccount.isPublic ||
      (exclusiveAccount.allowedUsers &&
        exclusiveAccount.allowedUsers.some((user) => user.id === userId));

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Acceso denegado a esta cuenta exclusiva" },
        { status: 403 }
      );
    }

    //Verificar reservas existentes
    const existingReservations = await db.stockReservation.aggregate({
      where: {
        accountId: exclusiveAccountId,
        accountType: "EXCLUSIVE",
        expiresAt: { gt: new Date() },
      },
      _sum: { quantity: true },
    });

    const availableStock = exclusiveAccount.exclusiveStocks.length;
    const reservedStock = existingReservations._sum.quantity || 0;
    const realAvailableStock = availableStock - reservedStock;

    if (realAvailableStock < quantity) {
      return NextResponse.json(
        {
          error: `Stock insuficiente. Solo hay ${realAvailableStock} unidades disponibles`,
        },
        { status: 400 }
      );
    }

    // Get or create cart
    let cart = await db.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await db.cart.create({
        data: {
          userId,
          totalAmount: 0,
        },
      });
    }

    // Check if item already exists in cart
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        exclusiveAccountId: exclusiveAccountId,
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      //Verificar stock con reservas
      const currentReservations = await db.stockReservation.aggregate({
        where: {
          accountId: exclusiveAccountId,
          accountType: "EXCLUSIVE",
          expiresAt: { gt: new Date() },
        },
        _sum: { quantity: true },
      });

      const currentReserved = currentReservations._sum.quantity || 0;
      const availableStock = exclusiveAccount.exclusiveStocks.length;
      const realAvailable =
        availableStock - currentReserved + existingItem.quantity; // Devolver la cantidad actual del carrito

      if (realAvailable < newQuantity) {
        return NextResponse.json(
          {
            error: `Stock insuficiente. Solo hay ${realAvailable} unidades disponibles`,
          },
          { status: 400 }
        );
      }

      // Actualizar reserva
      /* await db.stockReservation.upsert({
        where: {
          userId_accountId_accountType: {
            userId,
            accountId: exclusiveAccountId,
            accountType: "EXCLUSIVE",
          },
        },
        update: {
          quantity: newQuantity,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
        },
        create: {
          userId,
          accountId: exclusiveAccountId,
          accountType: "EXCLUSIVE",
          quantity: newQuantity,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
        },
      }); */

      const reservationResult = await db.stockReservation.upsert({
  where: {
    userId_accountId_accountType: {
      userId,
      accountId: exclusiveAccountId,
      accountType: "EXCLUSIVE",
    },
  },
  update: {
    quantity: newQuantity,
    saleType: exclusiveAccount.saleType, // AGREGAR ESTA LÍNEA
    stockIds: [],
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
  },
  create: {
    userId,
    accountId: exclusiveAccountId,
    accountType: "EXCLUSIVE",
    saleType: exclusiveAccount.saleType, // AGREGAR ESTA LÍNEA
    stockIds: [],
    quantity: newQuantity,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
  },
});

      const io = getIO();
if (io && reservationResult) {
  setTimeout(async () => {
    try {
      // Verificar si la reserva todavía existe
      const stillExists = await db.stockReservation.findFirst({
        where: {
          userId,
          accountId: exclusiveAccountId,
          accountType: "EXCLUSIVE",
        },
      });
      
      if (stillExists) {
        // Eliminar reserva
        await db.stockReservation.deleteMany({
          where: {
            userId,
            accountId: exclusiveAccountId,
            accountType: "EXCLUSIVE",
          },
        });
        
        // Notificar al usuario
        io.to(`user:${userId}`).emit("reservationExpired", {
          accountId: exclusiveAccountId,
          accountType: "EXCLUSIVE",
          message: "Tu reserva ha expirado",
        });
        
        // Emitir actualización de stock
        broadcastStockUpdate(io, {
          accountId: exclusiveAccountId,
          accountType: "exclusive",
          type: exclusiveAccount.saleType,
          newStock: exclusiveAccount.exclusiveStocks?.length || 0, // Stock completo disponible
          expired: true,
        });
        
        console.log(`Reserva exclusiva ${exclusiveAccountId} expirada y eliminada para usuario ${userId}`);
      }
    } catch (error) {
      console.error("Error en notificación de expiración exclusiva:", error);
    }
  }, 5 * 60 * 1000); // 5 minutos
}

      const updatedItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          reservationExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      // Update cart total
      await updateCartTotal(cart.id);

      // Emitir actualización de stock en tiempo real
      /* const io = getIO();
      if (io) {
        const currentStock = exclusiveAccount.exclusiveStocks?.length || 0;

        broadcastStockUpdate(io, {
          accountId: exclusiveAccountId,
          accountType: "exclusive",
          type: exclusiveAccount.saleType,
          newStock: Math.max(0, currentStock - newQuantity),
        });
      } */

      return NextResponse.json(updatedItem);
    } else {
      // Crear reserva para nueva cuenta exclusiva
      /* await db.stockReservation.create({
        data: {
          userId,
          accountId: exclusiveAccountId,
          accountType: "EXCLUSIVE",
          quantity: quantity,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
        },
      }); */

      // REEMPLAZAR el bloque existente:
// Crear reserva para nueva cuenta exclusiva
const reservationResult = await db.stockReservation.create({
  data: {
    userId,
    accountId: exclusiveAccountId,
    accountType: "EXCLUSIVE",
    saleType: exclusiveAccount.saleType, // AGREGAR ESTA LÍNEA
    stockIds: [],
    quantity: quantity,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutos
  },
});

// AGREGAR DESPUÉS de este bloque (línea ~423):
// Programar notificación de expiración
const io = getIO();
if (io && reservationResult) {
  setTimeout(async () => {
    try {
      // Verificar si la reserva todavía existe
      const stillExists = await db.stockReservation.findFirst({
        where: {
          userId,
          accountId: exclusiveAccountId,
          accountType: "EXCLUSIVE",
        },
      });
      
      if (stillExists) {
        // Eliminar reserva
        await db.stockReservation.delete({
          where: { id: reservationResult.id },
        });
        
        // Notificar al usuario
        io.to(`user:${userId}`).emit("reservationExpired", {
          accountId: exclusiveAccountId,
          accountType: "EXCLUSIVE",
          message: "Tu reserva ha expirado",
        });
        
        // Emitir actualización de stock
        broadcastStockUpdate(io, {
          accountId: exclusiveAccountId,
          accountType: "exclusive",
          type: exclusiveAccount.saleType,
          newStock: exclusiveAccount.exclusiveStocks?.length || 0, // Stock completo disponible
          expired: true,
        });
        
        console.log(`Reserva exclusiva ${reservationResult.id} expirada y eliminada para usuario ${userId}`);
      }
    } catch (error) {
      console.error("Error en notificación de expiración exclusiva:", error);
    }
  }, 5 * 60 * 1000); // 5 minutos
}

      // Create new cart item with exclusive account ID
      const cartItem = await db.cartItem.create({
        data: {
          cartId: cart.id,
          exclusiveAccountId: exclusiveAccountId,
          quantity: quantity,
          saleType: exclusiveAccount.saleType as "FULL" | "PROFILES",
          priceAtTime: exclusiveAccount.price,
          reservationExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      // Update cart total
      await updateCartTotal(cart.id);

      // Emitir actualización de stock en tiempo real
      /* const io = getIO();
      if (io) {
        const currentStock = exclusiveAccount.exclusiveStocks?.length || 0;

        broadcastStockUpdate(io, {
          accountId: exclusiveAccountId,
          accountType: "exclusive",
          type: exclusiveAccount.saleType,
          newStock: Math.max(0, currentStock - quantity),
        });
      } */

      return NextResponse.json(cartItem, { status: 201 });
    }
  } catch (error) {
    console.error("Error adding exclusive account to cart:", error);
    return NextResponse.json(
      { error: "Error al agregar al carrito" },
      { status: 500 }
    );
  }
}

async function updateCartTotal(cartId: string) {
  const items = await db.cartItem.findMany({
    where: { cartId },
  });

  const totalAmount = items.reduce((total, item) => {
    return total + item.priceAtTime * item.quantity;
  }, 0);

  await db.cart.update({
    where: { id: cartId },
    data: { totalAmount },
  });
}
