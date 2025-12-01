import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    const blocks = await db.userBlock.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(blocks);
  } catch (error) {
    console.error("Error al obtener bloqueos: ", error);
    return NextResponse.json(
      { error: "Error al obtener bloqueos" },
      { status: 500 }
    );
  }
}
