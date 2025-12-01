import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { broadcastMessageUpdate } from "@/lib/socket";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const {
      receiverId,
      title,
      content,
      type = "GENERAL",
    } = await request.json();

    if (!receiverId || !title || !content) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Get receiver user
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "Receptor no encontrado" },
        { status: 404 }
      );
    }

    // Crear Mensaje
    const message = await db.message.create({
      data: {
        senderId: user.id,
        receiverId,
        title,
        content,
        type,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Obtener recuento no leído actualizado para el receptor
    const newUnreadCount = await db.message.count({
      where: {
        receiverId,
        isRead: false,
      },
    });

    // Transmitir actualización en tiempo real al receptor
    try {
      const { getIO } = await import("@/lib/socket");
      const io = getIO();
      if (io) {
        broadcastMessageUpdate(io, receiverId, newUnreadCount);
      }
    } catch (error) {
      console.error(
        "Error al transimitir actualizacion del mensaje en tiempo real",
        error
      );
      return NextResponse.json({
        error: "Error al enviar la actualización del mensaje",
      });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener mensajes recibidos
    const messages = await db.message.findMany({
      where: {
        receiverId: user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Obtener recuento de no leídos
    const unreadCount = await db.message.count({
      where: {
        receiverId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      messages,
      unreadCount,
    });
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
