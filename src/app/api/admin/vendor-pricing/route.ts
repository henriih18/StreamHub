import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export async function PUT(request: NextRequest) {
  try {
    const { pricing } = await request.json();
    
    for (const [accountId, config] of Object.entries(pricing)) {
      const { vendorPrice } = config as { vendorPrice: number };
      
      await db.vendorPricing.upsert({
        where: { streamingAccountId: accountId },
        update: {
          vendorPrice: vendorPrice || 0,
          updatedAt: new Date()
        },
        create: {
          streamingAccountId: accountId,
          vendorPrice: vendorPrice || 0
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Precios de vendedor actualizados correctamente" 
    });
  } catch (error) {
    console.error("Error al guardar precios de vendedor:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}