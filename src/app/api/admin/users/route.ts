import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCache } from "@/lib/cache";
import { withAdminAuth } from "@/lib/admin-auth";

export const GET = withAdminAuth(async (request: NextRequest) => {
  try {
    const cacheKey = "admin:users:list";
    let users = userCache.get(cacheKey) as any[] | null;

    if (!users) {
      users = await db.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          credits: true,
          totalSpent: true,
          role: true,
          createdAt: true,
          isBlocked: true,
          blockReason: true,
          blockExpiresAt: true,
          isActive: true,
          _count: {
            select: {
              orders: true,
            },
          },
        },
        orderBy: {
          totalSpent: "desc",
        },
      });

      users = (users || []).map((user) => ({
        ...user,
        name: user.fullName,
        isActive: !user.isBlocked,
      }));

      userCache.set(cacheKey, users, 3 * 60 * 1000);
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error al recuperar usuarios:", error);
    return NextResponse.json(
      { error: "Error al recuperar usuarios" },
      { status: 500 }
    );
  }
});
