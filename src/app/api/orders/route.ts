import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateExpirationDate } from "@/lib/date-utils";

/* export async function POST(request: NextRequest) {
  return await db.$transaction(async (tx) => {
    try {
      const body = await request.json();
      const { userId, items } = body;

      if (!userId || !items || items.length === 0) {
        return NextResponse.json(
          { error: "Se requiere ID de usuario y artículos." },
          { status: 400 }
        );
      }

      // Obtener usuario y verificar créditos atómicamente
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Usuario no encontrado" },
          { status: 404 }
        );
      }

      // Calcular precio total
      const totalPrice = items.reduce((total: number, item: any) => {
        return total + item.priceAtTime * item.quantity;
      }, 0);

      // Consultar y deducir créditos atómicamente
      if (user.credits < totalPrice) {
        return NextResponse.json(
          { error: "Créditos insuficientes" },
          { status: 400 }
        );
      }

      // Deducir créditos y actualizar el total gastado inmediatamente
      await tx.user.update({
        where: { id: userId },
        data: {
          credits: user.credits - totalPrice,
          totalSpent: user.totalSpent + totalPrice,
        },
      });

      const orders = [] as any[];

      // Procesar cada artículo con control de inventario atómico
      for (const item of items) {
        // Calcular la fecha de vencimiento según la duración de la cuenta de streaming
        const expiresAt = calculateExpirationDate(
          item.streamingAccount.duration
        );

        if (item.saleType === "PROFILES") {
          // Encuentra y bloquea perfiles disponibles de forma atómica
          const availableProfiles = await tx.accountProfile.findMany({
            where: {
              streamingAccountId: item.streamingAccount.id,
              isAvailable: true,
            },
            take: item.quantity,
          });

          if (availableProfiles.length < item.quantity) {
            throw new Error(
              `Solo hay ${availableProfiles.length} perfiles disponibles para ${item.streamingAccount.name}`
            );
          }

          // Crear pedidos y marcar perfiles como vendidos de forma atómica
          for (const profile of availableProfiles) {
            const order = await tx.order.create({
              data: {
                userId,
                streamingAccountId: item.streamingAccount.id,
                accountProfileId: profile.id,
                accountEmail: profile.email,
                accountPassword: profile.password,
                profileName: profile.profileName,
                profilePin: profile.profilePin,
                saleType: "PROFILES",
                quantity: 1,
                totalPrice: item.priceAtTime,
                expiresAt,
                status: "COMPLETED",
              },
            });

            // Marcar perfil como vendido inmediatamente
            await tx.accountProfile.update({
              where: { id: profile.id },
              data: {
                isAvailable: false,
                soldToUserId: userId,
                soldAt: new Date(),
              },
            });

            orders.push(order);
          }
        } else {
          // Encuentra y bloquea cuentas disponibles de forma atómica
          const availableAccount = await tx.accountStock.findFirst({
            where: {
              streamingAccountId: item.streamingAccount.id,
              isAvailable: true,
            },
          });

          if (!availableAccount) {
            throw new Error(
              `No hay cuentas disponibles para ${item.streamingAccount.name}`
            );
          }

          // Crear pedido y marcar cuenta como vendida de forma atómica
          const order = await tx.order.create({
            data: {
              userId,
              streamingAccountId: item.streamingAccount.id,
              accountStockId: availableAccount.id,
              accountEmail: availableAccount.email,
              accountPassword: availableAccount.password,
              saleType: "FULL",
              quantity: item.quantity,
              totalPrice: item.priceAtTime * item.quantity,
              expiresAt,
              status: "COMPLETED",
            },
          });

          // Marcar la cuenta como vendida inmediatamente
          await tx.accountStock.update({
            where: { id: availableAccount.id },
            data: {
              isAvailable: false,
              soldToUserId: userId,
              soldAt: new Date(),
            },
          });

          orders.push(order);
        }
      }

      // Limpiar el carrito atómicamente
      const cart = await tx.cart.findUnique({
        where: { userId },
      });

      if (cart) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        await tx.cart.update({
          where: { id: cart.id },
          data: { totalAmount: 0 },
        });
      }

      return NextResponse.json(
        {
          message: "Pedidos creados exitosamente",
          orders,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error al crear pedidos:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Error al crear pedidos";

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
  });
} */

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

    const orders = await db.order.findMany({
      where: { userId },
      include: {
        streamingAccount: {
          include: {
            streamingType: true,
          },
        },
        accountProfile: true,
        accountStock: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    return NextResponse.json(
      { error: "Error al recuperar pedidos" },
      { status: 500 }
    );
  }
}
