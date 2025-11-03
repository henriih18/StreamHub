import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Get all users with their action counts in a single query
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

    // Calculate action counts for all users in a more efficient way
    const actionCounts: Record<string, number> = {};

    // Get all orders, renewals, and other actions to calculate counts
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

    // Calculate action counts for each user
    usersWithActionCounts.forEach((user) => {
      const orderCount =
        totalOrders.find((o) => o.userId === user.id)?._count || 0;
      const renewalData = totalRenewals.find((r) => r.userId === user.id);
      const renewalCount = renewalData?._sum?.renewalCount || 0;
      const rechargeCount =
        totalRecharges.find((r) => r.userId === user.id)?._count || 0;

      // Total actions = orders + renewals + recharges
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
    //console.error('Error fetching users with action counts:', error)
    return NextResponse.json(
      { error: "Error al obtener los usuarios con recuentos de acciones" },
      { status: 500 }
    );
  }
}
