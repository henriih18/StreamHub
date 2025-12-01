import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, type } = body;

    if (!title || !content || !type) {
      return NextResponse.json(
        { error: "Título, contenido y tipo son requeridos" },
        { status: 400 }
      );
    }

    // Consigue todos los usuarios excepto los administradores.
    const users = await db.user.findMany({
      where: {
        role: {
          in: ["USER", "VENDEDOR"],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    //console.log(`Se encontraron ${users.length} usuarios con rol USER y VENDEDOR`)

    if (users.length === 0) {
      const allUsers = await db.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
      //console.log('Todos los usuarios en la base de datos:', allUsers)

      return NextResponse.json(
        {
          error: "No hay usuarios registrados para enviar mensajes",
          debug: {
            totalUsers: allUsers.length,
            userRoles: allUsers.map((u) => ({ email: u.email, role: u.role })),
          },
        },
        { status: 404 }
      );
    }

    // Obtener el primer administrador como remitente
    const adminUser = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, name: true, email: true },
    });

    //console.log('Usuario administrador encontrado:', adminUser)

    if (!adminUser) {
      return NextResponse.json(
        { error: "No hay administradores disponibles para enviar mensajes" },
        { status: 404 }
      );
    }

    // Crear mensajes para todos los usuarios
    const messages = await Promise.all(
      users.map((user) =>
        db.message.create({
          data: {
            senderId: adminUser.id,
            receiverId: user.id,
            title,
            content,
            type: type as "GENERAL" | "WARNING" | "SYSTEM_NOTIFICATION",
            isRead: false,
          },
        })
      )
    );

    //console.log(`Se crearon correctamente ${messages.length} mensajes`)

    return NextResponse.json({
      message: "Mensajes enviados exitosamente",
      messageCount: messages.length,
      usersCount: users.length,
      type,
      title,
      sender: adminUser.name || adminUser.email,
    });
  } catch (error) {
    console.error('Error al enviar el mensaje de difusión.', error)
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    const errorDetails =
      error instanceof Error ? error.stack : "No hay detalles disponibles";
    return NextResponse.json(
      {
        error: "Error al enviar mensajes masivos: " + errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Obtener estadísticas sobre los mensajes de difusión
    const totalUsers = await db.user.count({
      where: { role: "USER" },
    });

    const recentMessages = await db.message.count({
      where: {
        senderId: "system",
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      totalUsers,
      recentBroadcastMessages: recentMessages,
      canSendBroadcast: totalUsers > 0,
    });
  } catch (error) {
    console.error('Error al obtener las estadísticas de la transmisión: ', error)
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
