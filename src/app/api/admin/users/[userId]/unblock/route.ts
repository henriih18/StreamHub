import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { reason, notifyUser } = await request.json();
    const { userId } = await params;

    if (!userId || !reason) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Actualizar el estado de desbloqueo del usuario
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        isBlocked: false,
        blockReason: null,
        blockExpiresAt: null,
      },
    });

    // Desactivar todos los bloqueos activos para este usuario
    await db.userBlock.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Obtener el primer administrador como remitente
    const adminUser = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, name: true, email: true },
    });

    if (!adminUser) {
      console.warn(
        "No se encontró ningún usuario administrador para enviar la notificación de desbloqueo"
      );
    }

    // Enviar mensaje interno si se solicita y existe el usuario administrador
    if (notifyUser && adminUser) {
      await db.message.create({
        data: {
          senderId: adminUser.id,
          receiverId: userId,
          title: "Cuenta Desbloqueada",
          content: `Tu cuenta ha sido desbloqueada. Motivo: ${reason}\n\nYa puedes acceder normalmente a la plataforma.`,
          type: "UNBLOCK_NOTICE",
        },
      });
    }

    // Registra la acción
    console.log(`User ${userId} unblocked:`, {
      reason,
      timestamp: new Date(),
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error al desbloquear usuario:", error);
    return NextResponse.json(
      { error: "Error al desbloquear usuario" },
      { status: 500 }
    );
  }
}
