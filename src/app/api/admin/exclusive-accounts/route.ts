import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCache } from "@/lib/cache";

// Temporarily disable authentication for development
// TODO: Implement proper authentication with NextAuth

export async function GET() {
  try {
    const cacheKey = "admin:exclusive-accounts:list";
    let accounts = userCache.get(cacheKey);

    if (!accounts) {
      // For development, we'll skip authentication check
      // In production, uncomment the following:
      /*
      const session = await getServerSession(authOptions)
      
      if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
      }
      */

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

export async function POST(request: NextRequest) {
  try {
    // For development, we'll skip authentication check
    // In production, uncomment the following:
    /*
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    */

    const data = await request.json();

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
      expiresAt,
    } = data;

    // Validate and parse numeric fields
    const parsedPrice = parseFloat(price);
    const parsedDuration = parseInt(duration);
    const parsedMaxProfiles = maxProfiles ? parseInt(maxProfiles) : null;
    const parsedPricePerProfile = pricePerProfile
      ? parseFloat(pricePerProfile)
      : null;

    // Validate required fields
    if (
      !name ||
      !description ||
      !type ||
      isNaN(parsedPrice) ||
      parsedPrice < 0 ||
      !parsedDuration ||
      parsedDuration <= 0
    ) {
      /* console.log('Validation failed. Missing/invalid fields:', {
        name: !!name,
        description: !!description,
        type: !!type,
        price: parsedPrice,
        duration: parsedDuration
      }) */
      return NextResponse.json(
        {
          error:
            "Todos los campos requeridos deben ser completados con valores válidos",
        },
        { status: 400 }
      );
    }

    // Create exclusive account
    const account = await db.exclusiveAccount.create({
      data: {
        name,
        description,
        type,
        price: parsedPrice,
        duration: parsedDuration,
        quality,
        screens,
        saleType,
        maxProfiles: parsedMaxProfiles,
        pricePerProfile: parsedPricePerProfile,
        maxSlots: 1, // Default to 1 since we removed this from the form
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

    // Transform the data to match expected interface
    const transformedAccount = {
      ...account,
      allowedUsers: account.allowedUsers.map((user) => ({
        ...user,
        name: user.fullName,
      })),
    };

    // Invalidate cache when new exclusive account is created
    userCache.delete("admin:exclusive-accounts:list");

    return NextResponse.json(transformedAccount);
  } catch (error) {
    //console.error('Error creating exclusive account:', error)
    return NextResponse.json(
      { error: "Error al crear cuenta exclusiva" },
      { status: 500 }
    );
  }
}
