import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

// Schema de validación para el registro
const registerSchema = z.object({
  fullName: z
    .string()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  email: z
    .string()
    .email("Email no válido")
    .max(255, "El email no puede exceder 255 caracteres"),
  phone: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(20, "El teléfono no puede exceder 20 caracteres"),
  username: z
    .string()
    .min(3, "El usuario debe tener al menos 3 caracteres")
    .max(20, "El usuario no puede exceder 20 caracteres")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Solo se permiten letras, números y guiones bajos"
    ),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe incluir mayúsculas, minúsculas y números"
    ),

  acceptMarketing: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar los datos de entrada
    const validation = registerSchema.safeParse(body);

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

    const {
      fullName,
      email,
      phone,
      username,
      password,
      /* country, language, */ acceptMarketing,
    } = validation.data;

    // Verificar si el email ya existe
    const existingUserByEmail = await db.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "Este email ya está registrado", field: "email" },
        { status: 409 }
      );
    }

    // Verificar si el username ya existe
    const existingUserByUsername = await db.user.findUnique({
      where: { username },
    });

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: "Este nombre de usuario ya está en uso", field: "username" },
        { status: 409 }
      );
    }

    // Verificar si el teléfono ya existe
    const existingUserByPhone = await db.user.findUnique({
      where: { phone },
    });

    if (existingUserByPhone) {
      return NextResponse.json(
        { error: "Este teléfono ya está registrado", field: "phone" },
        { status: 409 }
      );
    }

    // Hashear la contraseña
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el usuario
    const newUser = await db.user.create({
      data: {
        fullName,
        email,
        phone,
        username,
        password: hashedPassword,
        /* country,
        language, */
        acceptMarketing,
        emailVerified: true, // Auto-verificado para acceso inmediato
        isActive: true,
        role: "USER",
        credits: 0,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        country: true,
        language: true,
        createdAt: true,
      },
    });

    // Crear registro de actividad
    await db.userActivity.create({
      data: {
        userId: newUser.id,
        action: "USER_REGISTERED",
        details: JSON.stringify({
          ip: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          /* country,
          language */
        }),
        timestamp: new Date(),
      },
    });

    // Respuesta exitosa
    return NextResponse.json(
      {
        message: "Usuario creado exitosamente",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error en registro:", error);

    // Manejar errores específicos de la base de datos
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "Error: Uno de los campos ya está en uso" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Endpoint para verificar email
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email y código son requeridos" },
        { status: 400 }
      );
    }

    // Buscar usuario con el código de verificación
    const user = await db.user.findFirst({
      where: {
        email,
        emailVerificationCode: code,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Código inválido o expirado" },
        { status: 400 }
      );
    }

    // Marcar email como verificado
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
        updatedAt: new Date(),
      },
    });

    // Crear registro de actividad
    await db.userActivity.create({
      data: {
        userId: user.id,
        action: "EMAIL_VERIFIED",

        details: JSON.stringify({
          ip: request.headers.get("x-forwarded-for") || "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
        }),
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      message: "Email verificado exitosamente",
    });
  } catch (error) {
    console.error("Error en verificación de email:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Endpoint para reenviar código de verificación
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email ya verificado" },
        { status: 400 }
      );
    }

    // Generar nuevo código
    const verificationCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    // Actualizar usuario con nuevo código
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Código de verificación reenviado",
    });
  } catch (error) {
    console.error("Error al reenviar código:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
