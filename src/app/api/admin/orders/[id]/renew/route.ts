import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";
import { calculateExpirationDate } from "@/lib/date-utils";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    // Obtener el pedido con los detalles del usuario y la cuenta de streaming
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        streamingAccount: true,
        exclusiveAccount: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (order.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Solo se pueden renovar pedidos completados" },
        { status: 400 }
      );
    }

    // Verificar si el usuarios tiene creditos suficientes
    const renewalPrice =
      order.streamingAccount?.price || order.exclusiveAccount?.price || 0;

    if (order.user.credits < renewalPrice) {
      return NextResponse.json(
        {
          error: `El usuario no tiene suficientes créditos. Necesita: $${renewalPrice.toLocaleString()}, Tiene: $${order.user.credits.toLocaleString()}`,
        },
        { status: 400 }
      );
    }

    // Calcular nueva fecha de vencimiento en función de la duración de la cuenta de streaming
    const duration = order.streamingAccount?.duration || "1 mes";
    const newExpiresAt = calculateExpirationDate(duration);

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      // Deducir créditos del usuario
      await tx.user.update({
        where: { id: order.userId },
        data: {
          credits: {
            decrement: renewalPrice,
          },
          totalSpent: {
            increment: renewalPrice,
          },
        },
      });

      // Actualizar pedido con nuevo recuento de vencimientos y renovaciones
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          expiresAt: newExpiresAt,
          renewalCount: {
            increment: 1,
          },
          lastRenewedAt: new Date(),
        },
      });

      return updatedOrder;
    });

    try {
      const zai = await ZAI.create();

      const notificationMessage = `
        ¡Tu cuenta ha sido renovada exitosamente!
        
        Detalles de la renovación:
        - Servicio: ${
          order.streamingAccount?.name ||
          order.exclusiveAccount?.name ||
          "Cuenta Exclusive"
        }
        - Nueva fecha de vencimiento: ${newExpiresAt.toLocaleDateString(
          "es-CO"
        )}
        - Costo de renovación: $${renewalPrice.toLocaleString("es-CO")}
        - Número de renovaciones: ${result.renewalCount}
        
        Gracias por continuar con nuestro servicio!
      `;
    } catch (notificationError) {
      console.error("Error al enviar notificación:", notificationError);
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta renovada exitosamente",
      order: {
        id: result.id,
        newExpiresAt: result.expiresAt,
        renewalCount: result.renewalCount,
        lastRenewedAt: result.lastRenewedAt,
        renewalPrice,
      },
    });
  } catch (error) {
    console.error("Error al renovar el pedido:", error);
    return NextResponse.json(
      { error: "Error al renovar la cuenta" },
      { status: 500 }
    );
  }
}
