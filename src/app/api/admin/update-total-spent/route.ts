import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Obtener todos los usuarios con sus pedidos.
    const users = await db.user.findMany({
      include: {
        orders: {
          select: {
            totalPrice: true,
          },
        },
      },
    });

    //console.log(`Se encontraron ${users.length} usuarios para actualizar`)

    // Actualizar el gasto total de cada usuario
    const updatePromises = users.map(async (user) => {
      const calculatedTotal = user.orders.reduce(
        (sum, order) => sum + order.totalPrice,
        0
      );

      if (user.totalSpent !== calculatedTotal) {
        //console.log(`Actualizando el usuario ${user.email}: ${user.totalSpent} -> ${calculatedTotal}`)

        return db.user.update({
          where: { id: user.id },
          data: { totalSpent: calculatedTotal },
        });
      }

      return null;
    });

    const results = await Promise.all(updatePromises);
    const updatedCount = results.filter((result) => result !== null).length;

    //console.log(`Se actualizaron ${updatedCount} usuarios correctamente`)

    return NextResponse.json({
      success: true,
      message: `Se actualizó correctamente el total gastado para ${updatedCount} usuarios`,
      totalUsers: users.length,
      updatedUsers: updatedCount,
    });
  } catch (error) {
    //console.error('Error al actualizar totalSpent:', error)
    return NextResponse.json(
      { error: "Error al actualizar el total gastado" },
      { status: 500 }
    );
  }
}
