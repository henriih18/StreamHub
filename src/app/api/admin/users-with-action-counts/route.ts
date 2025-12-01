import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Obtener todos los usuarios con sus recuentos de acciones en una sola consulta
    const usersWithActionCounts = await db.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        totalSpent: true,
        role: true,
        createdAt: true,
        isActive: true,
        isBlocked: true,
        blockExpiresAt: true,
        blockReason: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    // Calcular el número de acciones para todos los usuarios de una manera más eficiente
    const actionCounts: Record<string, number> = {};

    // Obtener todos los pedidos, renovaciones y otras acciones para calcular los recuentos
    const [totalOrders, totalRenewals, totalRecharges] = await Promise.all([
      db.order.groupBy({
        by: ["userId"],
        _count: true,
      }),
      db.order.groupBy({
        by: ["userId"],
        where: {
          renewalCount: {
            gt: 0,
          },
        },
        _count: true,
        _sum: {
          renewalCount: true,
        },
      }),
      db.creditRecharge.groupBy({
        by: ["userId"],
        _count: true,
      }),
    ]);

    // Calcular el número de acciones para cada usuario
    usersWithActionCounts.forEach((user) => {
      const orderCount =
        totalOrders.find((o) => o.userId === user.id)?._count || 0;
      const renewalData = totalRenewals.find((r) => r.userId === user.id);
      const renewalCount = renewalData?._sum?.renewalCount || 0;
      const rechargeCount =
        totalRecharges.find((r) => r.userId === user.id)?._count || 0;

      // Total de acciones = pedidos + renovaciones + recargas
      actionCounts[user.id] = orderCount + renewalCount + rechargeCount;
    });

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithActionCounts,
        actionCounts,
      },
    });
  } catch (error) {
    console.error(
      "Error al obtener los usuarios con recuentos de acciones:",
      error
    );
    return NextResponse.json(
      { error: "Error al obtener los usuarios con recuentos de acciones" },
      { status: 500 }
    );
  }
}
