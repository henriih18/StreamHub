import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCache } from "@/lib/cache";

export async function GET() {
  try {
    const cacheKey = "admin:special-offers:list";
    let cachedOffers = userCache.get(cacheKey);

    if (!cachedOffers) {
      // verificary actualizar las ofertas vencidas
      const now = new Date();
      await db.specialOffer.updateMany({
        where: {
          expiresAt: {
            lt: now,
          },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      const specialOffers = await db.specialOffer.findMany({
        include: {
          user: {
            select: {
              email: true,
              fullName: true,
            },
          },
          streamingAccount: {
            select: {
              name: true,
              type: true,
              price: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Transformar los datos para que coincidan con la interfaz esperada
      cachedOffers = specialOffers.map((offer) => ({
        ...offer,
        user: {
          ...offer.user,
          name: offer.user.fullName,
        },
      }));

      userCache.set(cacheKey, cachedOffers, 5 * 60 * 1000);
    }

    return NextResponse.json(cachedOffers);
  } catch (error) {
    console.error("Error al obtener ofertas especiales:", error);
    return NextResponse.json(
      { error: "Error al cargar las ofertas especiales" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      userIds,
      streamingAccountId,
      discountPercentage,
      expiresAt,
      applyToAllUsers,
    } = await request.json();

    if (!streamingAccountId || !discountPercentage) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // Valida que applyToAllUsers sea verdadero o que se proporcione userIds
    if (
      !applyToAllUsers &&
      (!userIds || !Array.isArray(userIds) || userIds.length === 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Debes seleccionar usuarios o aplicar a todos los usuarios normales",
        },
        { status: 400 }
      );
    }

    let specialOffers;

    if (applyToAllUsers) {
      // Obtener todos los usuarios normales (no proveedores)
      const normalUsers = await db.user.findMany({
        where: { role: "USER" },
        select: { id: true },
      });

      // Crea ofertas especiales para todos los usuarios normales.
      specialOffers = await Promise.all(
        normalUsers.map((user) =>
          db.specialOffer.create({
            data: {
              userId: user.id,
              streamingAccountId,
              discountPercentage: parseFloat(discountPercentage),
              targetSpent: 0,
              expiresAt: expiresAt
                ? new Date(expiresAt + "T23:59:59.999Z")
                : null,
            },
            include: {
              user: {
                select: {
                  email: true,
                  fullName: true,
                },
              },
              streamingAccount: {
                select: {
                  name: true,
                  type: true,
                },
              },
            },
          })
        )
      );
    } else {
      // Crear ofertas especiales para usuarios seleccionados
      specialOffers = await Promise.all(
        userIds.map((userId: string) =>
          db.specialOffer.create({
            data: {
              userId,
              streamingAccountId,
              discountPercentage: parseFloat(discountPercentage),
              targetSpent: 0,
              expiresAt: expiresAt
                ? new Date(expiresAt + "T23:59:59.999Z")
                : null,
            },
            include: {
              user: {
                select: {
                  email: true,
                  fullName: true,
                },
              },
              streamingAccount: {
                select: {
                  name: true,
                  type: true,
                },
              },
            },
          })
        )
      );
    }

    // Transformar los datos para que coincidan con la interfaz esperada
    const transformedOffers = specialOffers.map((offer) => ({
      ...offer,
      user: {
        ...offer.user,
        name: offer.user.fullName,
      },
    }));

    // Invalidar caché cuando se crean nuevas ofertas
    userCache.delete("admin:special-offers:list");

    return NextResponse.json(transformedOffers);
  } catch (error) {
    console.error("Error al crear ofertas especiales:", error);
    return NextResponse.json(
      { error: "Error al crear ofertas especiales" },
      { status: 500 }
    );
  }
}
