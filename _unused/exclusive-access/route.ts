

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { exclusiveAccountId, userId } = await request.json();

    // Validar campos obligatorios
    if (!exclusiveAccountId || !userId) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Compruebe si el usuario ya tiene acceso
    const exclusiveAccount = await db.exclusiveAccount.findUnique({
      where: { id: exclusiveAccountId },
      include: {
        allowedUsers: {
          where: { id: userId },
        },
      },
    });

    if (!exclusiveAccount) {
      return NextResponse.json(
        { error: "Cuenta exclusiva no encontrada" },
        { status: 404 }
      );
    }

    if (exclusiveAccount.allowedUsers.length > 0) {
      return NextResponse.json(
        { error: "El usuario ya tiene acceso a esta cuenta exclusiva." },
        { status: 400 }
      );
    }

    // Otorgar acceso a una cuenta exclusiva
    const updatedAccount = await db.exclusiveAccount.update({
      where: { id: exclusiveAccountId },
      data: {
        allowedUsers: {
          connect: { id: userId },
        },
      },
      include: {
        allowedUsers: true,
      },
    });

    return NextResponse.json({
      message: "Acceso concedido con éxito",
      exclusiveAccount: updatedAccount,
    });
  } catch (error) {
    //console.error('Error al conceder acceso exclusivo:', error)

    return NextResponse.json(
      { error: "Error al conceder acceso exclusivo" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { exclusiveAccountId, userId } = await request.json();

    // Validate required fields
    if (!exclusiveAccountId || !userId) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Eliminar el acceso a una cuenta exclusiva
    const updatedAccount = await db.exclusiveAccount.update({
      where: { id: exclusiveAccountId },
      data: {
        allowedUsers: {
          disconnect: { id: userId },
        },
      },
      include: {
        allowedUsers: true,
      },
    });

    return NextResponse.json({
      message: "Acceso eliminado exitosamente",
      exclusiveAccount: updatedAccount,
    });
  } catch (error) {
    //console.error('Error al eliminar el acceso exclusivo:', error)

    return NextResponse.json(
      { error: "Error al eliminar el acceso exclusivo" },
      { status: 500 }
    );
  }
}
