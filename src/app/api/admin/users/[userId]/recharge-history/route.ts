import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Fetch user's recharge history with admin information
    const recharges = await db.creditRecharge.findMany({
      where: {
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to include admin information
    const transformedRecharges = recharges.map((recharge) => ({
      ...recharge,
      adminName: "Administrador", // Since we don't have admin tracking in the schema yet
      user: {
        ...recharge.user,
        name: recharge.user.fullName,
      },
    }));

    // Calculate statistics
    const totalRecharges = recharges.length;
    const totalAmount = recharges.reduce(
      (sum, recharge) => sum + recharge.amount,
      0
    );
    const averageAmount = totalRecharges > 0 ? totalAmount / totalRecharges : 0;

    return NextResponse.json({
      recharges: transformedRecharges,
      statistics: {
        totalRecharges,
        totalAmount,
        averageAmount,
      },
    });
  } catch (error) {
    //console.error('Error fetching recharge history:', error)
    return NextResponse.json(
      { error: "Error al recuperar el historial de recargas" },
      { status: 500 }
    );
  }
}
