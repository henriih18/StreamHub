import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCache } from "@/lib/cache";
import { createStaticJsonResponse } from "@/lib/compression";
import { withAdminAuth } from "@/lib/admin-auth";

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const cacheKey = "admin:streaming-types:list";
    let types = userCache.get(cacheKey);

    if (!types) {
      types = await db.streamingType.findMany({
        orderBy: { name: "asc" },
      });

      userCache.set(cacheKey, types, 10 * 60 * 1000);
    }

    return NextResponse.json(types);
  } catch (error) {
    console.error("Error al recuperar tipos de Streaming", error);
    return NextResponse.json(
      { error: "Error al recuperar tipos de Streaming" },
      { status: 500 }
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const { name, description, color, imageUrl } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    const existingType = await db.streamingType.findUnique({
      where: { name },
    });

    if (existingType) {
      return NextResponse.json(
        { error: "El tipo de Streaming ya existe" },
        { status: 400 }
      );
    }

    const newType = await db.streamingType.create({
      data: {
        name,
        description,
        color,
        imageUrl,
      },
    });

    userCache.delete("admin:streaming-types:list");
    userCache.delete("admin:streaming-accounts:list");

    return NextResponse.json(newType);
  } catch (error) {
    console.error("Error al crear el tipo de streaming:", error);
    return NextResponse.json(
      { error: "Error al crear el tipo de streaming" },
      { status: 500 }
    );
  }
});
