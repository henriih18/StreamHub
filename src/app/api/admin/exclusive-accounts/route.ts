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

      // Transform the data to include usedSlots count and match expected interface
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

      // Cache for 6 minutes - exclusive accounts change moderately
      userCache.set(cacheKey, accounts, 6 * 60 * 1000);
    }

    return NextResponse.json(accounts);
  } catch (error) {
    //console.error('Error fetching exclusive accounts:', error)
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

    // Validate required fields
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

    // Create exclusive account (NOT streaming account)
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

    // Transform data to match expected interface
    const transformedAccount = {
      ...exclusiveAccount,
      allowedUsers: exclusiveAccount.allowedUsers.map((user) => ({
        ...user,
        name: user.fullName,
      })),
    };

    // Invalidate cache when new exclusive account is created
    userCache.delete("admin:exclusive-accounts:list");

    return NextResponse.json(transformedAccount);
  } catch (error) {
    console.error("Error creating exclusive account:", error);
    return NextResponse.json(
      { error: "Error al crear cuenta exclusiva" },
      { status: 500 }
    );
  }
});
