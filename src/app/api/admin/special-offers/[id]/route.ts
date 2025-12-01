import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCache } from "@/lib/cache";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Verificar que exista la oferta especial
    const existingOffer = await db.specialOffer.findUnique({
      where: { id },
    });

    if (!existingOffer) {
      return NextResponse.json(
        { error: "Oferta especial no encontrada" },
        { status: 404 }
      );
    }

    // Eliminar la oferta especial
    await db.specialOffer.delete({
      where: { id },
    });

    // Invalidar caché cuando se elimina una oferta especial
    userCache.delete("admin:special-offers:list");

    return NextResponse.json({
      message: "Oferta especial eliminada con éxito",
    });
  } catch (error) {
    console.error("Error al eliminar oferta especial:", error);
    return NextResponse.json(
      { error: "Error al eliminar la oferta especial" },
      { status: 500 }
    );
  }
}
