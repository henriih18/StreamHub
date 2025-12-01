import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { userId, amount } = await request.json();

    // Validar campos obligatorios
    if (!userId || !amount) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Actualizar créditos de usuario
    const user = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        credits: {
          increment: parseFloat(amount),
        },
      },
    });

    // Crear registro de recarga de crédito
    const creditRecharge = await db.creditRecharge.create({
      data: {
        userId: userId,
        amount: parseFloat(amount),
        method: "Admin Manual",
        status: "COMPLETED",
      },
    });

    return NextResponse.json({ user, creditRecharge });
  } catch (error) {
    console.error('Error al recargar créditos:', error)

    return NextResponse.json(
      { error: "Error al recargar creditos" },
      { status: 500 }
    );
  }
}
