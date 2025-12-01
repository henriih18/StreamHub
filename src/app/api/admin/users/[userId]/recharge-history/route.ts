import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Obtener el historial de recargas del usuario con información del administrador
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

    // Transformar los datos para incluir información administrativa
    const transformedRecharges = recharges.map((recharge) => ({
      ...recharge,
      adminName: "Administrador",
      user: {
        ...recharge.user,
        name: recharge.user.fullName,
      },
    }));

    // Calcular estadísticas
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
    console.error("Error al recuperar el historial de recargas: ", error);
    return NextResponse.json(
      { error: "Error al recuperar el historial de recargas" },
      { status: 500 }
    );
  }
}
