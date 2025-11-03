import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // For now, return a mock history since we don't have a permission history table
    // In a real implementation, you would query a permission history table
    const mockHistory = [
      {
        id: "1",
        action: "warn",
        reason: "Comportamiento inapropiado en el chat",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        adminName: "Admin User",
      },
      {
        id: "2",
        action: "block",
        reason: "Intento de fraude",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        adminName: "Admin User",
        duration: "24 hours",
      },
    ];

    return NextResponse.json(mockHistory);
  } catch (error) {
    //console.error('Error fetching permission history:', error)
    return NextResponse.json(
      { error: "Error al recuperar el historial de permisos" },
      { status: 500 }
    );
  }
}
