import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const {
      accountEmail,
      accountPassword,
      profileName,
      profilePin,
      saleType,
      streamingAccountId,
    } = await request.json();

    // Verificar si el pedido existe
    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Rehabilitar al stock según el tipo de venta
    if (saleType === "FULL") {
      // Para cuentas completas, agregar a AccountStock
      if (accountEmail && accountPassword) {
        await db.accountStock.create({
          data: {
            streamingAccountId: streamingAccountId,
            email: accountEmail,
            password: accountPassword,
            isAvailable: true,
          },
        });
      }
    } else if (saleType === "PROFILES") {
      // Para perfiles individuales, agregar a AccountProfile
      if (accountEmail && accountPassword && profileName) {
        await db.accountProfile.create({
          data: {
            streamingAccountId: streamingAccountId,
            email: accountEmail,
            password: accountPassword,
            profileName: profileName,
            profilePin: profilePin || null,
            isAvailable: true,
          },
        });
      }
    }

    // Marcar el pedido como rehabilitado
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: "REHABILITATED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `${
        saleType === "FULL" ? "Cuenta" : "Perfil"
      } rehabilitado exitosamente`,
      order: updatedOrder,
    });
  } catch (error) {
    //console.error('Error rehabilitating order:', error)

    return NextResponse.json(
      { error: "Error al rehabilitar pedido" },
      { status: 500 }
    );
  }
}
