import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCache } from "@/lib/cache";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Actualizar cuenta exclusiva
    const account = await db.exclusiveAccount.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.price !== undefined && { price: parseFloat(data.price) }),
        ...(data.duration !== undefined && {
          duration: parseInt(data.duration),
        }),
        ...(data.maxSlots !== undefined && {
          maxSlots: parseInt(data.maxSlots),
        }),
        ...(data.credentials && { credentials: data.credentials }),
        ...(data.isPublic !== undefined && {
          isPublic: Boolean(data.isPublic),
        }),
        ...(data.expiresAt !== undefined && {
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        }),
        ...(data.isActive !== undefined && {
          isActive: Boolean(data.isActive),
        }),
        ...(data.allowedUsers !== undefined && {
          allowedUsers: {
            set: [],
            connect: data.allowedUsers.map((userId: string) => ({
              id: userId,
            })),
          },
        }),
      },
      include: {
        allowedUsers: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        orders: {
          select: {
            id: true,
          },
        },
      },
    });

    // Transformar los datos para incluir el recuento de usedSlots
    const transformedAccount = {
      ...account,
      usedSlots: account.orders.length,
    };

    // Invalidar caché cuando se actualiza cuenta exclusiva
    userCache.delete("admin:exclusive-accounts:list");

    return NextResponse.json(transformedAccount);
  } catch (error) {
    console.error('Error al actualizar la cuenta exclusiva:', error)

    return NextResponse.json(
      { error: "Error al actualizar cuenta exclusiva" },
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

    // Comprobar si la cuenta tiene pedidos activos
    const activeOrders = await db.order.findMany({
      where: {
        exclusiveAccountId: id,
        status: "COMPLETED",
      },
    });

    if (activeOrders.length > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una cuenta con órdenes activas" },
        { status: 400 }
      );
    }

    // Eliminar cuenta exclusiva con eliminaciones en cascada
    await db.$transaction(async (tx) => {
     
      await tx.exclusiveStock.deleteMany({
        where: { exclusiveAccountId: id },
      });

      await tx.exclusiveAccount.delete({
        where: { id },
      });
    });

    // Invalidar caché cuando se elimina una cuenta exclusiva
    userCache.delete("admin:exclusive-accounts:list");

    return NextResponse.json({ message: "Cuenta eliminada exitosamente" });
  } catch (error) {
    console.error('Error al eliminar cuenta exclusiva:', error)

    return NextResponse.json(
      { error: "Error al eliminar cuenta exclusiva" },
      { status: 500 }
    );
  }
}
