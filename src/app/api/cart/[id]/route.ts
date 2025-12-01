import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { quantity } = body;

    if (quantity < 0) {
      return NextResponse.json(
        { error: "La cantidad no puede ser negativa." },
        { status: 400 }
      );
    }

    // Obtener el artículo del carrito con los detalles de la cuenta para verificar el stock
    const cartItem = await db.cartItem.findUnique({
      where: { id: resolvedParams.id },
      include: {
        streamingAccount: {
          include: {
            accountStocks: true,
            profileStocks: true,
          },
        },
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Artículo del carrito no encontrado" },
        { status: 404 }
      );
    }

    // Consultar disponibilidad de stock
    if (cartItem.streamingAccount) {
      const availableStock =
        cartItem.saleType === "PROFILES"
          ? cartItem.streamingAccount.profileStocks?.filter(
              (stock) => stock.isAvailable
            ).length || 0
          : cartItem.streamingAccount.accountStocks?.filter(
              (stock) => stock.isAvailable
            ).length || 0;

      if (availableStock < quantity) {
        return NextResponse.json(
          {
            error: `Stock insuficiente. Solo hay ${availableStock} unidad${
              availableStock !== 1 ? "es" : ""
            } disponible${availableStock !== 1 ? "s" : ""}.`,
          },
          { status: 400 }
        );
      }
    }

    // Actualizar el artículo del carrito
    const updatedCartItem = await db.cartItem.update({
      where: { id: resolvedParams.id },
      data: { quantity },
    });

    // Actualizar el total del carrito
    const cart = await db.cart.findUnique({
      where: { id: cartItem.cartId },
    });

    if (cart) {
      await updateCartTotal(cart.id);
    }

    return NextResponse.json(updatedCartItem);
  } catch (error) {
    console.error("Error al actualizar el artículo del carrito:", error);
    return NextResponse.json(
      { error: "Error al actualizar el artículo del carrito" },
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
    const cartItem = await db.cartItem.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: "Artículo del carrito no encontrado" },
        { status: 404 }
      );
    }

    await db.cartItem.delete({
      where: { id: resolvedParams.id },
    });

    // Actualizar el total del carrito
    await updateCartTotal(cartItem.cartId);

    return NextResponse.json({ message: "Artículo eliminado del carrito" });
  } catch (error) {
    console.error("Error al eliminar el artículo del carrito:", error);
    return NextResponse.json(
      { error: "Error al eliminar el artículo del carrito" },
      { status: 500 }
    );
  }
}

async function updateCartTotal(cartId: string) {
  const items = await db.cartItem.findMany({
    where: { cartId },
    include: {
      streamingAccount: true,
    },
  });

  const totalAmount = items.reduce((total, item) => {
    return total + item.priceAtTime * item.quantity;
  }, 0);

  await db.cart.update({
    where: { id: cartId },
    data: { totalAmount },
  });
}
