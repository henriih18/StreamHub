import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCache } from "@/lib/cache";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { blockType, duration, reason, notifyUser } = await request.json();
    const { userId } = await params;

    if (!userId || !blockType || !reason) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Calcular la fecha de vencimiento de los bloqueos temporales
    const expiresAt =
      blockType === "temporary"
        ? new Date(Date.now() + (parseInt(duration) || 24) * 60 * 60 * 1000)
        : null;

    // Actualizar el estado del bloqueo de usuario
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        isBlocked: true,
        blockReason: reason,
        blockExpiresAt: expiresAt,
      },
    });

    // Invalidar caché para este usuario y la lista de usuarios
    userCache.delete(`user:id:${userId}`);
    userCache.delete("admin:users:list");
    if (updatedUser.email) {
      userCache.delete(`user:${updatedUser.email}`);
    }

    // Crear registro de bloqueo
    const block = await db.userBlock.create({
      data: {
        userId,
        blockType,
        duration: blockType === "temporary" ? duration : null,
        reason,
        isActive: true,
        expiresAt,
      },
    });

    // Obtener el primer administrador como remitente
    const adminUser = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, name: true, email: true },
    });

    if (!adminUser) {
      console.warn(
        "No se encontró ningún usuario administrador para enviar notificaciones de bloqueo"
      );
    }

    // Enviar mensaje interno si se solicita y existe el usuario administrador
    if (notifyUser && adminUser) {
      let messageContent = `Tu cuenta ha sido bloqueada. Motivo: ${reason}`;

      if (blockType === "temporary") {
        const unblockDate = new Date(expiresAt!);
        messageContent += `\n\nDesbloqueo automático: ${unblockDate.toLocaleDateString(
          "es-CO"
        )}`;
      } else {
        messageContent +=
          "\n\nEste es un bloqueo permanente. Contacta soporte para más información.";
      }

      await db.message.create({
        data: {
          senderId: adminUser.id,
          receiverId: userId,
          title: "Cuenta Bloqueada",
          content: messageContent,
          type: "BLOCK_NOTICE",
        },
      });
    }

    return NextResponse.json({ user: updatedUser, block });
  } catch (error) {
    console.error("Error al bloquear usuario: ", error);
    return NextResponse.json(
      { error: "Error al bloquear usuario" },
      { status: 500 }
    );
  }
}
