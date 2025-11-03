import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    // Count warnings and 24h blocks for this user
    const warningsCount = await db.userWarning.count({
      where: {
        userId: userId,
      },
    });

    const blocks24hCount = await db.userBlock.count({
      where: {
        userId: userId,
        blockType: "temporary",
        duration: "24",
      },
    });

    const totalCount = warningsCount + blocks24hCount;

    return NextResponse.json({
      count: totalCount,
      warnings: warningsCount,
      blocks24h: blocks24hCount,
    });
  } catch (error) {
    //console.error('Error fetching user action count:', error)
    return NextResponse.json(
      { error: "Error al obtener el recuento de acciones del usuario" },
      { status: 500 }
    );
  }
}
