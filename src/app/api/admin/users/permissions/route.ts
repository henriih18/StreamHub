import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    const {
      userId,
      action,
      blockType,
      blockDuration,
      blockReason,
      restrictedFeatures,
      warningMessage,
      notifyUser,
      logAction,
      customPermissions,
    } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    let updatedUser;

    switch (action) {
      case "block":
        // Calcular fecha de expiración
        const blockExpiresAt =
          blockType === "permanent"
            ? null
            : new Date(Date.now() + (blockDuration || 24) * 60 * 60 * 1000);

        updatedUser = await db.user.update({
          where: { id: userId },
          data: {
            isBlocked: true,
            blockReason: blockReason || "Bloqueo por violación de términos",
            blockExpiresAt: blockExpiresAt,
          },
        });
        break;

      case "unblock":
        updatedUser = await db.user.update({
          where: { id: userId },
          data: {
            isBlocked: false,
            blockReason: null,
            blockExpiresAt: null,
          },
        });
        break;

      case "warn":
        // For warning, we don't change user status, just log the action
        updatedUser = await db.user.findUnique({
          where: { id: userId },
        });
        break;

      case "restrict":
        // For restrict, we block the user from making purchases
        updatedUser = await db.user.update({
          where: { id: userId },
          data: {
            isBlocked: true,
            blockReason: blockReason || "Restricción de compras",
            blockExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Acción no válida" },
          { status: 400 }
        );
    }

    // Log the action if needed (you could create a separate table for this)
    if (logAction) {
      /* console.log(`Permission action logged: ${action} for user ${userId}`, {
        reason: blockReason,
        timestamp: new Date(),
        restrictedFeatures,
        customPermissions
      }) */
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    //console.error('Error updating user permissions:', error)
    return NextResponse.json(
      { error: "Error al actualizar permisos del usuario" },
      { status: 500 }
    );
  }
}
