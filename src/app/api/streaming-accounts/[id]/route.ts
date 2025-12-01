import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    const account = await db.streamingAccount.update({
      where: { id },
      data: {
        name: body.name,
        price: body.price ? parseFloat(body.price) : undefined,

        isActive: body.isActive,
      },
      include: {
        streamingType: true,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error al actualizar la cuenta de streaming", error);
    return NextResponse.json(
      { error: "Error al actualizar la cuenta de streaming" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    await db.streamingAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar la cuenta de streaming", error);
    return NextResponse.json(
      { error: "Error al eliminar la cuenta de streaming" },
      { status: 500 }
    );
  }
}
