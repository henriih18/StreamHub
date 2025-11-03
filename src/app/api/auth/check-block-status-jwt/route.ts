import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or header
    const token =
      request.cookies.get("authToken")?.value ||
      request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        isBlocked: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Check block status directly (JWT version)
    const activeBlock = await db.userBlock.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        OR: [
          { expiresAt: null }, // Permanent blocks
          { expiresAt: { gt: new Date() } }, // Temporary blocks not expired
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (activeBlock) {
      const blockInfo = {
        id: activeBlock.id,
        reason: activeBlock.reason,
        blockType: activeBlock.blockType as "temporary" | "permanent",
        duration: activeBlock.duration || undefined,
        expiresAt: activeBlock.expiresAt || undefined,
      };

      // Format message
      let message = `Tu cuenta está bloqueada. Motivo: ${blockInfo.reason}`;

      if (blockInfo.blockType === "permanent") {
        message += " Este bloqueo es permanente.";
      } else if (blockInfo.duration && blockInfo.expiresAt) {
        const expiryDate = new Date(blockInfo.expiresAt);
        message += ` Este bloqueo expirará el ${expiryDate.toLocaleDateString(
          "es-ES",
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        )}.`;
      }

      message +=
        " No podrás realizar compras hasta que el bloqueo sea levantado.";

      return NextResponse.json({
        isBlocked: true,
        blockInfo: blockInfo,
        message: message,
      });
    }

    return NextResponse.json({
      isBlocked: false,
    });
  } catch (error) {
    //console.error('Error checking block status:', error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
