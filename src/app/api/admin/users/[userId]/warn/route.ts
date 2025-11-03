import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { message, reason, severity, notifyUser } = await request.json();
    const { userId } = await params;

    if (!userId || !message || !reason) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Create warning record
    const warning = await db.userWarning.create({
      data: {
        userId,
        message,
        reason,
        severity: severity || "MEDIUM",
        isActive: true,
      },
    });

    // Get first admin as sender
    const adminUser = await db.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, name: true, email: true },
    });

    if (!adminUser) {
      //console.warn('No admin user found for sending warning notification')
    }

    // Send internal message if requested and admin user exists
    if (notifyUser && adminUser) {
      await db.message.create({
        data: {
          senderId: adminUser.id,
          receiverId: userId,
          title: "Advertencia del Sistema",
          content: message,
          type: "WARNING",
        },
      });
    }

    // Log the action
    /* console.log(`Warning created for user ${userId}:`, {
      warningId: warning.id,
      reason,
      severity,
      timestamp: new Date()
    }) */

    return NextResponse.json(warning);
  } catch (error) {
    //console.error('Error creating warning:', error)
    return NextResponse.json(
      { error: "Error al crear advertencia" },
      { status: 500 }
    );
  }
}
