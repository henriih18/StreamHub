import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getIO, broadcastStockUpdate } from "@/lib/socket";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { exclusiveAccountId, email, password, pin, profileName, notes } =
      data;

    // Validar campos obligatorios
    if (!exclusiveAccountId || !email || !password) {
      return NextResponse.json(
        { error: "El email y la contraseña son requeridos" },
        { status: 400 }
      );
    }

    // Comprobar si existe una cuenta exclusiva
    const exclusiveAccount = await db.exclusiveAccount.findUnique({
      where: { id: exclusiveAccountId },
    });

    if (!exclusiveAccount) {
      return NextResponse.json(
        { error: "Cuenta exclusiva no encontrada" },
        { status: 404 }
      );
    }

    // Crear stock exclusivo
    const stock = await db.exclusiveStock.create({
      data: {
        exclusiveAccountId,
        email,
        password,
        pin: pin || null,
        profileName: profileName || null,
        notes: notes || null,
      },
      include: {
        exclusiveAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Emitir actualización de stock en tiempo real
    const io = getIO();
    if (io) {
      const updatedStocks = await db.exclusiveStock.findMany({
        where: {
          exclusiveAccountId,
          isAvailable: true,
        },
      });

      broadcastStockUpdate(io, {
        accountId: exclusiveAccountId,
        accountType: "exclusive",
        type: exclusiveAccount.saleType,
        newStock: updatedStocks.length,
      });
    }

    return NextResponse.json(stock);
  } catch (error) {
    console.error('Error al crear stock exclusivo:', error)
    return NextResponse.json(
      { error: "Error al agregar stock" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exclusiveAccountId = searchParams.get("exclusiveAccountId");

    if (!exclusiveAccountId) {
      return NextResponse.json(
        { error: "Se requiere el ID de la cuenta exclusiva" },
        { status: 400 }
      );
    }

    const stocks = await db.exclusiveStock.findMany({
      where: {
        exclusiveAccountId,
      },
      include: {
        soldToUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transformar los datos para que coincidan con la interfaz esperada
    const transformedStocks = stocks.map((stock) => ({
      ...stock,
      soldToUser: stock.soldToUser
        ? {
            ...stock.soldToUser,
            name: stock.soldToUser.fullName,
          }
        : undefined,
    }));

    return NextResponse.json(transformedStocks);
  } catch (error) {
    console.error('Error al obtener existencias exclusivas:', error)

    return NextResponse.json(
      { error: "Error al cargar stock" },
      { status: 500 }
    );
  }
}
