import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.userId;

    const orders = await db.order.findMany({
      where: {
        userId: userId,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        streamingAccount: {
          select: {
            name: true,
            type: true,
            duration: true,
            quality: true,
            screens: true,
            price: true,
          },
        },
        accountProfile: true,
        accountStock: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    //console.error('Error fetching user orders:', error)
    return NextResponse.json(
      { error: "Error al recuperar los pedidos de usuario" },
      { status: 500 }
    );
  }
}
