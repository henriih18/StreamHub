import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AccountProfile, AccountStock } from "@prisma/client";
import { getIO, broadcastStockUpdate } from "@/lib/socket";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { streamingAccountId, saleType, accounts, profiles } = data;

    if (!streamingAccountId) {
      return NextResponse.json(
        { error: "Se requiere el ID de la cuenta de streaming" },
        { status: 400 }
      );
    }

    // Obtener una cuenta de streaming para verificar el tipo de venta
    const streamingAccount = await db.streamingAccount.findUnique({
      where: { id: streamingAccountId },
    });

    if (!streamingAccount) {
      return NextResponse.json(
        { error: "No se encontró la cuenta de streaming" },
        { status: 404 }
      );
    }

    const results: (AccountStock | AccountProfile)[] = [];
    const actualSaleType = saleType || streamingAccount.saleType;

    // Añadir cuentas completas al stock
    if (actualSaleType === "FULL" && accounts && accounts.trim()) {
      const accountLines = accounts.trim().split("\n");

      for (const line of accountLines) {
        const [email, password] = line.split(":").map((s) => s.trim());
        if (email && password) {
          const newAccount = await db.accountStock.create({
            data: {
              streamingAccountId,
              email,
              password,
              isAvailable: true,
            },
          });
          results.push(newAccount);
        }
      }
    }

    // Añadir perfiles al stock
    if (actualSaleType === "PROFILES" && profiles && profiles.trim()) {
      const profileLines = profiles.trim().split("\n");

      for (const line of profileLines) {
        const parts = line.split(":").map((s) => s.trim());
        if (parts.length >= 4) {
          // Format: email:password:profileName:pin
          const [email, password, profileName, profilePin] = parts;
          const newProfile = await db.accountProfile.create({
            data: {
              streamingAccountId,
              email,
              password,
              profileName,
              profilePin: profilePin || null,
              isAvailable: true,
            },
          });
          results.push(newProfile);
        }
      }
    }

    // Emitir actualización de stock en tiempo real
    const io = getIO();
    if (io) {
      const updatedAccount = await db.streamingAccount.findUnique({
        where: { id: streamingAccountId },
        include: {
          accountStocks: {
            where: { isAvailable: true },
          },
          profileStocks: {
            where: { isAvailable: true },
          },
        },
      });

      const newStock =
        actualSaleType === "PROFILES"
          ? updatedAccount?.profileStocks?.length || 0
          : updatedAccount?.accountStocks?.length || 0;

      broadcastStockUpdate(io, {
        accountId: streamingAccountId,
        accountType: "regular",
        type: actualSaleType,
        newStock: newStock,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Se agregaron ${results.length} artículos al inventario`,
      results,
    });
  } catch (error) {
    console.error('Error al agregar stock:', error)
    return NextResponse.json(
      { error: "Error al agregar stock" },
      { status: 500 }
    );
  }
}
