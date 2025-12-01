import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, number, type, description, isActive, order } =
      await request.json();
    const { id } = params;

    // Validar campos obligatorios
    if (!name || !number || !type) {
      return NextResponse.json(
        { error: "Se requiere nombre, número y tipo" },
        { status: 400 }
      );
    }

    const supportContact = await db.supportContact.update({
      where: { id },
      data: {
        name,
        number,
        type,
        description,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        order: order !== undefined ? parseInt(order) : 0,
      },
    });

    return NextResponse.json(supportContact);
  } catch (error) {
    console.error("Error al actualizar el contacto de soporte:", error);
    return NextResponse.json(
      { error: "Error al actualizar el contacto de soporte" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await db.supportContact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar el contacto de soporte:", error);
    return NextResponse.json(
      { error: "Error al eliminar el contacto de soporte" },
      { status: 500 }
    );
  }
}
