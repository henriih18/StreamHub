import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdminAuth } from "@/lib/admin-auth";

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const orders = await db.order.findMany({
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
        streamingAccount: {
          select: {
            id: true,
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

    // Transform the data to match the expected interface
    const transformedOrders = orders.map((order) => ({
      ...order,
      user: {
        ...order.user,
        name: order.user.fullName,
      },
    }));

    return NextResponse.json(transformedOrders);
  } catch (error) {
    //console.error('Error al recuperar los pedidos: {error}')

    return NextResponse.json(
      { error: "Error al recuperar los pedidos" },
      { status: 500 }
    );
  }
});
