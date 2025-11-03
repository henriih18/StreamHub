import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Temporarily disable authentication for development
// TODO: Implement proper authentication with NextAuth

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // For development, we'll skip authentication check
    // In production, uncomment the following:
    /*
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    */

    const { id } = await params;
    const data = await request.json();

    // Update exclusive account
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

    // Transform the data to include usedSlots count
    const transformedAccount = {
      ...account,
      usedSlots: account.orders.length,
    };

    return NextResponse.json(transformedAccount);
  } catch (error) {
    //console.error('Error updating exclusive account:', error)

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
    // For development, we'll skip authentication check
    // In production, uncomment the following:
    /*
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    */

    const { id } = await params;

    // Check if account has active orders
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

    // Delete exclusive account with cascading deletes
    await db.$transaction(async (tx) => {
      // Delete related exclusive stocks first
      await tx.exclusiveStock.deleteMany({
        where: { exclusiveAccountId: id },
      });

      // Then delete the account
      await tx.exclusiveAccount.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: "Cuenta eliminada exitosamente" });
  } catch (error) {
    //console.error('Error deleting exclusive account:', error)

    return NextResponse.json(
      { error: "Error al eliminar cuenta exclusiva" },
      { status: 500 }
    );
  }
}
