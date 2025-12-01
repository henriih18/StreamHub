import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { userId, action } = data;
    const { id: accountId } = params;

    if (!userId || !action || !["add", "remove"].includes(action)) {
      return NextResponse.json(
        { error: "Parámetros inválidos" },
        { status: 400 }
      );
    }

    // obtener cuenta exclusiva
    const account = await db.exclusiveAccount.findUnique({
      where: { id: accountId },
      include: {
        allowedUsers: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Cuenta exclusiva no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si el usuario existe
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar el acceso según la acción
    if (action === "add") {
      // Agregar usuario a usuarios permitidos
      await db.exclusiveAccount.update({
        where: { id: accountId },
        data: {
          allowedUsers: {
            connect: { id: userId },
          },
        },
      });
    } else {
      // Eliminar usuario de los usuarios permitidos
      await db.exclusiveAccount.update({
        where: { id: accountId },
        data: {
          allowedUsers: {
            disconnect: { id: userId },
          },
        },
      });
    }

    return NextResponse.json({
      message: `Acceso ${
        action === "add" ? "otorgado" : "revocado"
      } exitosamente`,
    });
  } catch (error) {
    console.error('Error al actualizar el acceso:', error)
    return NextResponse.json(
      { error: "Error al actualizar acceso" },
      { status: 500 }
    );
  }
}
