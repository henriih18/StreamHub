import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCache } from "@/lib/cache";
import { withAdminAuth } from "@/lib/admin-auth";

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const cacheKey = "admin:streaming-accounts:list";
    let cachedData = userCache.get(cacheKey);

    if (!cachedData) {
      // Obtenercuentas con stock real disponible
      const rawAccounts = await db.streamingAccount.findMany({
        where: {
          isActive: true,
        },
        include: {
          streamingType: {
            select: {
              icon: true,
              color: true,
              imageUrl: true,
            },
          },
          accountStocks: {
            where: {
              isAvailable: true,
            },
          },
          profileStocks: {
            where: {
              isAvailable: true,
            },
          },
          orders: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transformar para que coincida con las expectativas del frontend
      const accounts = rawAccounts.map((account) => ({
        ...account,
        _count: {
          accountStocks: account.accountStocks.length,
          profileStocks: account.profileStocks.length,
          orders: account.orders.length,
        },
      }));

      userCache.set(cacheKey, accounts, 7 * 60 * 1000);
      cachedData = accounts;
    }

    return NextResponse.json(cachedData);
  } catch (error) {
    console.error("Error al obtener las cuentas de streaming:", error);
    return NextResponse.json(
      { error: "Error al obtener las cuentas de streaming" },
      { status: 500 }
    );
  }
});

export const POST = withAdminAuth(async (request: NextRequest) => {
  try {
    const {
      name,
      description,
      type,
      price,
      duration,
      quality,
      screens,
      saleType,
      maxProfiles,
      pricePerProfile,
    } = await request.json();

    // Validar campos obligatorios
    if (
      !name ||
      !description ||
      !type ||
      !price ||
      !duration ||
      !quality ||
      !screens
    ) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const streamingAccount = await db.streamingAccount.create({
      data: {
        name,
        description,
        type,
        price: parseFloat(price),
        duration,
        quality,
        screens: parseInt(screens),
        saleType: saleType || "FULL",
        maxProfiles: maxProfiles ? parseInt(maxProfiles) : null,
        pricePerProfile: pricePerProfile ? parseFloat(pricePerProfile) : null,
      },
    });

    // Invalidar caché al crear una nueva cuenta
    userCache.delete("admin:streaming-accounts:list");

    return NextResponse.json(streamingAccount);
  } catch (error) {
    console.error("Error al crear una cuenta de streaming:", error);
    return NextResponse.json(
      { error: "Error al crear una cuenta de streaming" },
      { status: 500 }
    );
  }
});
