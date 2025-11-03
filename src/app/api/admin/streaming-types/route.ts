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

      // Cache for 10 minutes - static data changes rarely
      userCache.set(cacheKey, types, 10 * 60 * 1000);
    }

    return createStaticJsonResponse(types);
  } catch (error) {
    //console.error('Error fetching streaming types:', error)
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

    // Invalidate cache when new type is added
    userCache.delete("admin:streaming-types:list");

    return NextResponse.json(newType);
  } catch (error) {
    //console.error('Error creating streaming type:', error)
    return NextResponse.json(
      { error: "Error al crear el tipo de streaming" },
      { status: 500 }
    );
  }
});
