import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { userId, amount, method, reference } = await request.json();

    if (!userId || !amount || !method) {
      return NextResponse.json(
        { error: "Se requiere ID de usuario, cantidad y método de pago." },
        { status: 400 }
      );
    }

    // Crear registro de recarga de crédito
    const recharge = await db.creditRecharge.create({
      data: {
        userId,
        amount,
        method,
        reference,
        status: "PENDING",
      },
    });

    await db.creditRecharge.update({
      where: { id: recharge.id },
      data: { status: "COMPLETED" },
    });

    // Update user credits
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (user) {
      await db.user.update({
        where: { id: userId },
        data: {
          credits: user.credits + amount,
        },
      });
    }

    return NextResponse.json({
      success: true,
      recharge: { ...recharge, status: "COMPLETED" },
    });
  } catch (error) {
    console.error("Error al procesar la recarga de crédito:", error);
    return NextResponse.json(
      { error: "No se pudo procesar la recarga de crédito." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Se requiere el ID de usuario" },
        { status: 400 }
      );
    }

    const recharges = await db.creditRecharge.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(recharges);
  } catch (error) {
    console.error("Error al obtener recargas de crédito:", error);
    return NextResponse.json(
      { error: "No se pudieron realizar las recargas de crédito." },
      { status: 500 }
    );
  }
}
