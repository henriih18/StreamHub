import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AccountProfile, AccountStock } from "@prisma/client";
import { toast } from "sonner";

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

    // Get the streaming account to check the sale type
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

    // Add full accounts to stock
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

    // Add profiles to stock
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

    return NextResponse.json({
      success: true,
      message: `Se agregaron ${results.length} artículos al inventario`,
      results,
    });
  } catch (error) {
    //console.error('Error adding stock:', error)

    return NextResponse.json(
      { error: "Error al agregar stock" },
      { status: 500 }
    );
  }
}
