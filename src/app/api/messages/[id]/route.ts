import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Función para verificar autenticación
async function authenticateUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { error: "Token no proporcionado", status: 401 };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET!) as any;

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isBlocked: true,
      },
    });

    if (!user) {
      return { error: "Usuario no encontrado", status: 404 };
    }

    if (!user.isActive) {
      return { error: "Cuenta desactivada", status: 403 };
    }

    if (user.isBlocked) {
      return { error: "Cuenta bloqueada", status: 403 };
    }

    return { user };
  } catch (jwtError) {
    return { error: "Token inválido o expirado", status: 401 };
  }
}

// Allow both PATCH and POST for marking messages as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateMessage(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateMessage(request, await params);
}

async function updateMessage(request: NextRequest, params: { id: string }) {
  try {
    // Autenticar usuario
    const auth = await authenticateUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const user = auth.user!;

    const { isRead } = await request.json();
    const messageId = params.id;

    // Validar que isRead sea booleano
    if (typeof isRead !== "boolean") {
      return NextResponse.json(
        { error: "isRead debe ser un valor booleano" },
        { status: 400 }
      );
    }

    // Find the message and verify it belongs to the user
    const message = await db.message.findFirst({
      where: {
        id: messageId,
        receiverId: user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Mensaje no encontrado o no tienes permiso para modificarlo" },
        { status: 404 }
      );
    }

    // Update the message
    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: { isRead },
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
    });

    return NextResponse.json({
      success: true,
      message: `Mensaje marcado como ${isRead ? "leído" : "no leído"}`,
      data: updatedMessage,
    });
  } catch (error) {
    //console.error('Error updating message:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    // Autenticar usuario
    const auth = await authenticateUser(request);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const user = auth.user!;

    const messageId = resolvedParams.id;

    // Find the message and verify it belongs to the user
    const message = await db.message.findFirst({
      where: {
        id: messageId,
        receiverId: user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Mensaje no encontrado o no tienes permiso para eliminarlo" },
        { status: 404 }
      );
    }

    // Delete the message
    await db.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({
      success: true,
      message: "Mensaje eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
