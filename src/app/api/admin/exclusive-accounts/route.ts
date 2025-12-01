import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCache } from "@/lib/cache";
import { getIO, broadcastAccountUpdate } from "@/lib/socket";
import { withAdminAuth } from "@/lib/admin-auth";

export async function GET() {
  try {
    const cacheKey = "admin:exclusive-accounts:list";
    let accounts = userCache.get(cacheKey);

    if (!accounts) {
      const dbAccounts = await db.exclusiveAccount.findMany({
        include: {
          allowedUsers: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          exclusiveStocks: {
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
          },
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transforme los datos para incluir el recuento de usedSlots y que coincida con la interfaz esperada
      accounts = dbAccounts.map((account) => ({
        ...account,
        allowedUsers: account.allowedUsers.map((user) => ({
          ...user,
          name: user.fullName,
        })),
        exclusiveStocks: account.exclusiveStocks.map((stock) => ({
          ...stock,
          soldToUser: stock.soldToUser
            ? {
                ...stock.soldToUser,
                name: stock.soldToUser.fullName,
              }
            : undefined,
        })),
      }));

      // Caché durante 6 minutos: las cuentas exclusivas cambian moderadamente
      userCache.set(cacheKey, accounts, 6 * 60 * 1000);
    }

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error al obtener cuentas exclusivas:', error)
    return NextResponse.json(
      { error: "Error al cargar cuentas exclusivas" },
      { status: 500 }
    );
  }
}

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
      isPublic,
      allowedUsers,
      maxSlots,
      expiresAt,
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

    // Crear cuenta exclusiva (NO cuenta de streaming)
    const exclusiveAccount = await db.exclusiveAccount.create({
      data: {
        name,
        description,
        type,
        price: parseFloat(price),
        duration: duration,
        quality,
        screens,
        saleType: saleType || "FULL",
        maxProfiles: maxProfiles ? parseInt(maxProfiles) : null,
        pricePerProfile: pricePerProfile ? parseFloat(pricePerProfile) : null,
        maxSlots: maxSlots || allowedUsers?.length || 1,
        isPublic: Boolean(isPublic),
        expiresAt: expiresAt ? new Date(expiresAt + "T23:59:59.999Z") : null,
        allowedUsers:
          allowedUsers && allowedUsers.length > 0
            ? {
                connect: allowedUsers.map((userId: string) => ({ id: userId })),
              }
            : undefined,
      },
      include: {
        allowedUsers: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Transformar los datos para que coincidan con la interfaz esperada
    const transformedAccount = {
      ...exclusiveAccount,
      allowedUsers: exclusiveAccount.allowedUsers.map((user) => ({
        ...user,
        name: user.fullName,
      })),
    };

    //  Invalidar caché cuando se crea una nueva cuenta exclusiva
    userCache.delete("admin:exclusive-accounts:list");

    return NextResponse.json(transformedAccount);
  } catch (error) {
    console.error("Error al crear cuenta exclusiva:", error);
    return NextResponse.json(
      { error: "Error al crear cuenta exclusiva" },
      { status: 500 }
    );
  }
});
