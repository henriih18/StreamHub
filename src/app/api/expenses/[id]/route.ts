import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const {
      name,
      description,
      amount,
      category,
      frequency,
      dueDate,
      isActive,
    } = await request.json();

    const expense = await db.expense.update({
      where: { id: resolvedParams.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(category && { category }),
        ...(frequency && { frequency }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error al actualizar el gasto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;

    // Eliminación temporal estableciendo isActive como falso
    const expense = await db.expense.update({
      where: { id: resolvedParams.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar gasto:", error);
    return NextResponse.json(
      { error: "Error Interno del Servidor" },
      { status: 500 }
    );
  }
}
