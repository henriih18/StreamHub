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
                vendorPricing: true,
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

    if (!cart) {
      return NextResponse.json({ items: [], totalAmount: 0 });
    }

    return NextResponse.json(cart);
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Error al recuperar el carrito" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, streamingAccountId, quantity, saleType } = body;

    // VALIDACIONES RÁPIDAS
    if (!userId || !streamingAccountId) {
      return NextResponse.json(
        {
          error:
            "Se requieren el ID de usuario y el ID de la cuenta de Streaming.",
        },
        { status: 400 }
      );
    }

    // OBTENER DATOS NECESARIOS (SIN TRANSACCIÓN)
    const [user, streamingAccount, existingReservations, cart] =
      await Promise.all([
        db.user.findUnique({
          where: { id: userId },
          select: { role: true },
        }),
        db.streamingAccount.findUnique({
          where: { id: streamingAccountId },
          include: {
            vendorPricing: true,
            profileStocks: true,
            accountStocks: true,
          },
        }),
        db.stockReservation.aggregate({
          where: {
            accountId: streamingAccountId,
            accountType: "STREAMING",
            expiresAt: { gt: new Date() },
          },
          _sum: { quantity: true },
        }),
        db.cart.findUnique({
          where: { userId },
        }),
      ]);

    if (!user || !streamingAccount) {
      return NextResponse.json(
        { error: "Usuario o cuenta no encontrados" },
        { status: 404 }
      );
    }

    //CÁLCULOS DE STOCK
    const availableStock =
      saleType === "PROFILES"
        ? streamingAccount.profileStocks?.filter((stock) => stock.isAvailable)
            .length || 0
        : streamingAccount.accountStocks?.filter((stock) => stock.isAvailable)
            .length || 0;
    const reservedStock = existingReservations._sum.quantity || 0;
    const realAvailableStock = availableStock - reservedStock;

    if (realAvailableStock < (quantity || 1)) {
      return NextResponse.json(
        {
          error: `Stock insuficiente. Solo hay ${realAvailableStock} unidades disponibles.`,
        },
        { status: 400 }
      );
    }

    // OBTENER OFERTAS ESPECIALES
    const specialOffer = await db.specialOffer.findFirst({
      where: {
        userId: userId,
        streamingAccountId: streamingAccountId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
    });

    // CÁLCULO DE PRECIOS
    let finalPrice = streamingAccount.price;
    let originalPrice: number | undefined = undefined;

    if (user.role === "VENDEDOR" && streamingAccount.vendorPricing?.isActive) {
      originalPrice = streamingAccount.price;
      finalPrice = streamingAccount.vendorPricing.vendorPrice;
    }

    if (specialOffer) {
      originalPrice = originalPrice || streamingAccount.price;
      finalPrice = specialOffer.discountPercentage
        ? streamingAccount.price * (1 - specialOffer.discountPercentage / 100)
        : specialOffer.specialPrice || streamingAccount.price;
    }

    /* console.log(
      `Carrito Add - User: ${userId}, Account: ${streamingAccountId}, Role: ${user.role}, Final Price: ${finalPrice}, Original: ${originalPrice}`
    ); */

    // Operaciones atómicas individuales
    try {
      // Create or get cart
      let cartToUse = cart;
      if (!cartToUse) {
        cartToUse = await db.cart.create({
          data: {
            userId,
            totalAmount: 0,
          },
        });
      }

      // Check if item already exists
      const existingItem = await db.cartItem.findFirst({
        where: {
          cartId: cartToUse.id,
          streamingAccountId,
          saleType,
        },
      });

      if (existingItem) {
        // Update existing item
        const newQuantity = existingItem.quantity + (quantity || 1);

        // VERIFICACIÓN ATÓMICA DEL STOCK
        const currentStock = await db.stockReservation.aggregate({
          where: {
            accountId: streamingAccountId,
            accountType: "STREAMING",
            expiresAt: { gt: new Date() },
          },
          _sum: { quantity: true },
        });

        const currentReserved = currentStock._sum.quantity || 0;

        // Recalcular availableStock considerando reservas
        const totalStock =
          saleType === "PROFILES"
            ? streamingAccount.profileStocks?.filter(
                (stock) => stock.isAvailable
              ).length || 0
            : streamingAccount.accountStocks?.filter(
                (stock) => stock.isAvailable
              ).length || 0;

        const realAvailable = Math.max(0, totalStock - currentReserved);

        if (realAvailable < newQuantity) {
          return NextResponse.json(
            {
              error: `Stock insuficiente. Solo hay ${realAvailable} unidades disponibles.`,
            },
            { status: 400 }
          );
        }

        // ACTUALIZAR RESERVA PRIMERO
        await db.stockReservation.upsert({
          where: {
            userId_accountId_accountType: {
              userId,
              accountId: streamingAccountId,
              accountType: "STREAMING",
            },
          },
          update: {
            quantity: newQuantity,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          },
          create: {
            userId,
            accountId: streamingAccountId,
            accountType: "STREAMING",
            quantity: newQuantity,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          },
        });

        //ACTUALIZAR CART ITEM DESPUÉS
        const updatedItem = await db.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
            reservationExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
          },
        });

        // Update cart total
        await updateCartTotal(cartToUse.id);

        return NextResponse.json(updatedItem);
      } else {
        // Create new reservation first
        await db.stockReservation.upsert({
          where: {
            userId_accountId_accountType: {
              userId,
              accountId: streamingAccountId,
              accountType: "STREAMING",
            },
          },
          update: {
            quantity: quantity || 1,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          },
          create: {
            userId,
            accountId: streamingAccountId,
            accountType: "STREAMING",
            quantity: quantity || 1,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          },
        });

        // Create new cart item
        const priceAtTime =
          saleType === "PROFILES"
            ? streamingAccount.pricePerProfile || finalPrice
            : finalPrice;

        const cartItem = await db.cartItem.create({
          data: {
            cartId: cartToUse.id,
            streamingAccountId,
            quantity: quantity || 1,
            saleType: saleType || "FULL",
            priceAtTime,
            reservationExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
          },
        });

        // Update cart total
        await updateCartTotal(cartToUse.id);

        // Emitir actualización de stock en tiempo real
        const io = getIO();
        if (io) {
          // Calcular stock real considerando reservas existentes
          const totalStock =
            saleType === "PROFILES"
              ? streamingAccount.profileStocks?.filter(
                  (stock) => stock.isAvailable
                ).length || 0
              : streamingAccount.accountStocks?.filter(
                  (stock) => stock.isAvailable
                ).length || 0;

          // Obtener reservas existentes
          const existingReservations = await db.stockReservation.aggregate({
            where: {
              accountId: streamingAccountId,
              accountType: "STREAMING",
              expiresAt: { gt: new Date() },
            },
            _sum: { quantity: true },
          });

          const reservedStock = existingReservations._sum.quantity || 0;
          const realAvailableStock = Math.max(0, totalStock - reservedStock);

          broadcastStockUpdate(io, {
            accountId: streamingAccountId,
            accountType: "regular",
            type: saleType,
            newStock: Math.max(0, realAvailableStock - (quantity || 1)),
          });
        }

        return NextResponse.json(cartItem, { status: 201 });
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Error de base de datos. Por favor, intenta nuevamente." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Error al agregar al carrito" },
      { status: 500 }
    );
  }
}
async function updateCartTotal(cartId: string) {
  const items = await db.cartItem.findMany({
    where: { cartId },
    include: {
      streamingAccount: true,
      exclusiveAccount: true,
    },
  });

  const totalAmount = items.reduce((total, item) => {
    return total + item.priceAtTime * item.quantity;
  }, 0);

  await db.cart.update({
    where: { id: cartId },
    data: { totalAmount },
  });
}
