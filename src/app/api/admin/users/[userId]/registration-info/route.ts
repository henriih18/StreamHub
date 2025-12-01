import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    // Obtener información de registro de usuario
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phone: true,
        credits: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener información de registro (sin contraseña)
    const registrationInfo = {
      fullName: user.fullName || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      credits: user.credits || 0,
      role: user.role || "USER",
      password: "",
      confirmPassword: "",
    };

    return NextResponse.json({
      registrationInfo,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        phone: user.phone,
        credits: user.credits,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Error al obtener la información de registro del usuario:",
      error
    );
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();

    const {
      fullName,
      username,
      email,
      phone,
      credits,
      role,
      password,
      confirmPassword,
    } = body;

    // Validar campos obligatorios
    if (!fullName?.trim()) {
      return NextResponse.json(
        { error: "El nombre completo es requerido", field: "fullName" },
        { status: 400 }
      );
    }

    if (!username?.trim()) {
      return NextResponse.json(
        { error: "El nombre de usuario es requerido", field: "username" },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "El email es requerido", field: "email" },
        { status: 400 }
      );
    }

    if (!role?.trim()) {
      return NextResponse.json(
        { error: "El rol es requerido", field: "role" },
        { status: 400 }
      );
    }

    // Validar valor de rol
    if (!["USER", "ADMIN", "VENDEDOR"].includes(role)) {
      return NextResponse.json(
        { error: "El rol debe ser USER, VENDEDOR o ADMIN", field: "role" },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      // El teléfono es opcional, solo valide si se proporciona
      if (phone && phone.trim()) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(phone)) {
          return NextResponse.json(
            { error: "El teléfono no es válido", field: "phone" },
            { status: 400 }
          );
        }
      }
    }

    // Validar formato de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "El email no es válido", field: "email" },
        { status: 400 }
      );
    }

    // Validar formato de nombre de usuario
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          error:
            "El nombre de usuario solo puede contener letras, números y guiones bajos (3-20 caracteres)",
          field: "username",
        },
        { status: 400 }
      );
    }

    // Validar el formato del teléfono (solo si se proporciona)
    if (phone && phone.trim()) {
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: "El teléfono no es válido", field: "phone" },
          { status: 400 }
        );
      }
    }

    // Validar la contraseña si se proporciona
    if (password || confirmPassword) {
      if (!password || !confirmPassword) {
        return NextResponse.json(
          {
            error: "Debes proporcionar contraseña y confirmación",
            field: "password",
          },
          { status: 400 }
        );
      }

      if (password.length < 8) {
        return NextResponse.json(
          {
            error: "La contraseña debe tener al menos 8 caracteres",
            field: "password",
          },
          { status: 400 }
        );
      }

      if (password !== confirmPassword) {
        return NextResponse.json(
          { error: "Las contraseñas no coinciden", field: "confirmPassword" },
          { status: 400 }
        );
      }

      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return NextResponse.json(
          {
            error:
              "La contraseña debe incluir mayúsculas, minúsculas y números",
            field: "password",
          },
          { status: 400 }
        );
      }
    }

    // Compruebe si el usuario existe
    const existingUser = await db.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Comprobar si el correo electrónico ya está en uso por otro usuario
    const emailExists = await db.user.findFirst({
      where: {
        email: email,
        id: { not: userId },
      },
    });

    if (emailExists) {
      return NextResponse.json(
        { error: "El email ya está en uso por otro usuario", field: "email" },
        { status: 400 }
      );
    }

    // Comprobar si el nombre de usuario ya está en uso por otro usuario
    const usernameExists = await db.user.findFirst({
      where: {
        username: username,
        id: { not: userId },
      },
    });

    if (usernameExists) {
      return NextResponse.json(
        {
          error: "El nombre de usuario ya está en uso por otro usuario",
          field: "username",
        },
        { status: 400 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      fullName: fullName.trim(),
      username: username.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      credits: credits !== undefined ? Number(credits) : existingUser.credits,
      role: role.trim(),
      updatedAt: new Date(),
    };

    // Agregue una contraseña para actualizar si se proporciona
    if (password) {
      updateData.password = password;
    }

    // Actualizar usuario
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phone: true,
        credits: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Crear registro de actividad
    await db.userActivity.create({
      data: {
        userId: userId,
        action: "PROFILE_UPDATED",
        details: JSON.stringify({
          updatedFields: Object.keys(updateData),
          updatedAt: new Date().toISOString(),
        }),
        timestamp: new Date(),
      },
    });

    return NextResponse.json({
      message: "Información de registro actualizada exitosamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error(
      "Error al actualizar la información de registro del usuario:",
      error
    );

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint")) {
        return NextResponse.json(
          { error: "El email o nombre de usuario ya está en uso" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
