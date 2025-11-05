import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import jwt from "jsonwebtoken";

// Schema de validación para el login
const loginSchema = z.object({
  email: z.string().email("Email no válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

/* const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production' */

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar los datos de entrada
    const validation = loginSchema.safeParse(body);
    /* if (!validation.success) {
      const fieldErrors = validation.error.errors[0]
      return NextResponse.json(
        { 
          error: fieldErrors.message,
          field: fieldErrors.path[0]
        },
        { status: 400 }
      )
    } */

    if (!validation.success) {
      const allErrors = validation.error.issues.map((issue) => ({
        field: issue.path[0],
        message: issue.message,
      }));

      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: allErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Buscar usuario por email
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        password: true,
        role: true,
        isActive: true,
        isBlocked: true,
        blockReason: true,
        blockExpiresAt: true,
        emailVerified: true,
        lastLogin: true,
        language: true,
        country: true,
        credits: true,
        avatar: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos", field: "email" },
        { status: 401 }
      );
    }

    // Verificar bloqueos en UserBlock (sistema nuevo)
    const userBlocks = await db.userBlock.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let isBlocked = false;
    let blockType = "";
    let blockReason = "";
    let blockExpiresAt: Date | null = null;

    // Verificar si hay bloqueos activos
    for (const block of userBlocks) {
      if (block.blockType === "permanent") {
        isBlocked = true;
        blockType = "permanente";
        blockReason = block.reason;
        break;
      } else if (block.blockType === "temporary") {
        if (block.expiresAt && new Date() < block.expiresAt) {
          isBlocked = true;
          blockType = "temporal";
          blockReason = block.reason;
          blockExpiresAt = block.expiresAt;
          break;
        }
      }
    }

    // También verificar el campo isBlocked del usuario (sistema antiguo - compatibilidad)
    if (user.isBlocked) {
      isBlocked = true;
      if (!blockReason) {
        blockReason = user.blockReason || "Restricción de cuenta";
        blockExpiresAt = user.blockExpiresAt;
        blockType = blockExpiresAt ? "temporal" : "permanente";
      }
    }

    // Verificar si el usuario está bloqueado
    if (isBlocked) {
      let message = `Cuenta bloqueada (${blockType}). Motivo: ${blockReason}`;

      if (blockType === "temporal" && blockExpiresAt) {
        const expiryDate = new Date(blockExpiresAt);
        const now = new Date();
        const diffHours = Math.ceil(
          (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)
        );
        const diffDays = Math.ceil(diffHours / 24);

        if (diffDays > 0) {
          message += `. Tiempo restante: ${diffDays} día${
            diffDays > 1 ? "s" : ""
          }`;
        } else if (diffHours > 0) {
          message += `. Tiempo restante: ${diffHours} hora${
            diffHours > 1 ? "s" : ""
          }`;
        } else {
          message += `. Expira en menos de 1 hora`;
        }

        message += ` (${expiryDate.toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })})`;
      } else if (blockType === "permanent") {
        message += ". Este bloqueo es permanente.";
      }

      return NextResponse.json(
        {
          error: message,
          field: "email",
          blockDetails: {
            type: blockType,
            reason: blockReason,
            expiresAt: blockExpiresAt,
          },
        },
        { status: 403 }
      );
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Cuenta desactivada. Contacta con soporte.", field: "email" },
        { status: 403 }
      );
    }

    // Verificar contraseña
    if (!user.password) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos", field: "email" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email o contraseña incorrectos", field: "email" },
        { status: 401 }
      );
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Actualizar último login
    await db.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        updatedAt: new Date(),
      },
    });

    // Crear registro de actividad
    await db.userActivity.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        details: JSON.stringify({
          ip: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        }),
        timestamp: new Date(),
      },
    });

    // Preparar datos del usuario para la respuesta (sin contraseña)
    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      emailVerified: user.emailVerified,
      language: user.language,
      country: user.country,
      credits: user.credits,
      avatar: user.avatar,
      phone: user.phone,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };

    return NextResponse.json({
      message: "Inicio de sesión exitoso",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Endpoint para verificar token
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Buscar usuario actualizado
      const user = await db.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          username: true,
          role: true,
          isActive: true,
          isBlocked: true,
          emailVerified: true,
          language: true,
          country: true,
          credits: true,
          avatar: true,
          phone: true,
          lastLogin: true,
          createdAt: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Usuario no encontrado" },
          { status: 404 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          { error: "Cuenta desactivada" },
          { status: 403 }
        );
      }

      return NextResponse.json({
        valid: true,
        user,
      });
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      );
    }
  } catch (error) {
    //console.error("Error en verificación de token:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
