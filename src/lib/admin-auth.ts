import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function verifyAdmin(request: NextRequest) {
  try {
    // Obtener el ID de usuario a partir de los encabezados de solicitud o parámetros de consulta
    const userId =
      request.headers.get("x-user-id") ||
      new URL(request.url).searchParams.get("userId");

    if (!userId) {
      return { error: "Se requiere autenticación", status: 401 };
    }

    // Obtener usuario de la base de datos
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isBlocked: true,
      },
    });

    if (!user) {
      return { error: "Usuario no encontrado", status: 401 };
    }

    if (user.isBlocked) {
      return { error: "Usuario bloqueado", status: 403 };
    }

    // Comprobar si el usuario tiene permisos de administrador
    const isAdmin = user.role === "ADMIN";

    if (!isAdmin) {
      return { error: "Acceso no autorizado", status: 403 };
    }

    return { user, success: true };
  } catch (error) {
    //console.error('Error al verificar el administrador:', error)
    return { error: "Error de verificación", status: 500 };
  }
}

export function withAdminAuth(
  handler: (request: NextRequest, context?: any) => Promise<Response>
) {
  return async (request: NextRequest, context?: any) => {
    const verification = await verifyAdmin(request);

    if (!verification.success) {
      return new Response(JSON.stringify({ error: verification.error }), {
        status: verification.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Agregar usuario al contexto para el controlador
    return handler(request, { ...context, user: verification.user });
  };
}
