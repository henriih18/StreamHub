import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCache } from "@/lib/cache";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, description, color, imageUrl, isActive } =
      await request.json();

    const updatedType = await db.streamingType.update({
      where: { id },
      data: {
        name,
        description,
        color,
        imageUrl,
        isActive,
      },
    });

    // Invalidar caché cuando se actualiza el tipo
    userCache.delete("admin:streaming-types:list");
    // También invalida el caché de las cuentas de streaming, ya que dependen de tipos
    userCache.delete("admin:streaming-accounts:list");

    return NextResponse.json(updatedType);
  } catch (error) {
    console.error("Error al actualizar el tipo de transmisión:", error);
    return NextResponse.json(
      { error: "Error al actualizar el tipo Streaming" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    //  obtener el tipo para conocer su nombre
    const streamingType = await db.streamingType.findUnique({
      where: { id },
    });

    if (!streamingType) {
      return NextResponse.json(
        { error: "No se encontró el tipo de Streaming" },
        { status: 404 }
      );
    }

    // Verificar si hay cuentas asociadas a este tipo (por nombre)
    const associatedAccounts = await db.streamingAccount.findMany({
      where: { type: streamingType.name },
    });

    if (associatedAccounts.length > 0) {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar este tipo porque tiene cuentas asociadas",
          count: associatedAccounts.length,
          accounts: associatedAccounts.map((acc) => acc.name),
        },
        { status: 400 }
      );
    }

    await db.streamingType.delete({
      where: { id },
    });

    // Invalidar caché cuando se elimina el tipo
    userCache.delete("admin:streaming-types:list");
    // También invalida el caché de las cuentas de streaming, ya que dependen de tipos
    userCache.delete("admin:streaming-accounts:list");

    return NextResponse.json({
      message: "Tipo de Streaming eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar el tipo de Streaming:", error);
    return NextResponse.json(
      { error: "Error al eliminar el tipo de Streaming" },
      { status: 500 }
    );
  }
}
