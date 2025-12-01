import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { year, month, force = false } = await request.json();

    // Si no se proporciona año/mes, archive el mes anterior
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || new Date().getMonth();

    const archiveYear = targetMonth === 0 ? targetYear - 1 : targetYear;
    const archiveMonth = targetMonth === 0 ? 12 : targetMonth;

    //console.log(`Intentando archivar el mes: ${archiveYear}-${archiveMonth.toString().padStart(2, '0')}`)

    // Comprobar si el mes ya está archivado
    const existingRecord = await db.monthlyProfit.findUnique({
      where: {
        year_month: {
          year: archiveYear,
          month: archiveMonth,
        },
      },
    });

    if (existingRecord && !force) {
      return NextResponse.json(
        {
          success: false,
          message: `Month ${archiveYear}-${archiveMonth
            .toString()
            .padStart(2, "0")} is already archived`,
          existingRecord,
        },
        { status: 409 }
      );
    }

    // Calcular y guardar el registro mensual
    const saveResponse = await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/expenses/monthly/save`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: archiveYear,
          month: archiveMonth,
          force: force,
        }),
      }
    );

    if (!saveResponse.ok) {
      const errorData = await saveResponse.json();
      throw new Error(errorData.error || "No se pudo archivar el mes");
    }

    const saveResult = await saveResponse.json();

    return NextResponse.json({
      success: true,
      message: `Mes ${archiveYear}-${archiveMonth
        .toString()
        .padStart(2, "0")} archivado exitosamente`,
      archivedMonth: {
        year: archiveYear,
        month: archiveMonth,
        monthName: getMonthName(archiveMonth),
      },
      record: saveResult.record,
    });
  } catch (error) {
    console.error("Error al archivar el mes:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Obtener el estado del archivo mensual
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Comprobar si el mes anterior está archivado
    const previousMonthRecord = await db.monthlyProfit.findUnique({
      where: {
        year_month: {
          year: previousYear,
          month: previousMonth,
        },
      },
    });

    // Comprueba si el mes actual tiene alguna actividad
    const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const currentMonthEnd = new Date(
      currentYear,
      currentMonth,
      0,
      23,
      59,
      59,
      999
    );

    const currentMonthRecharges = await db.creditRecharge.count({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    });

    return NextResponse.json({
      currentMonth: {
        year: currentYear,
        month: currentMonth,
        monthName: getMonthName(currentMonth),
        hasActivity: currentMonthRecharges > 0,
        rechargesCount: currentMonthRecharges,
      },
      previousMonth: {
        year: previousYear,
        month: previousMonth,
        monthName: getMonthName(previousMonth),
        isArchived: !!previousMonthRecord,
        record: previousMonthRecord,
      },
      needsArchiving: !previousMonthRecord && currentMonthRecharges > 0,
    });
  } catch (error) {
    console.error("Error al comprobar el estado del archivo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

function getMonthName(month: number) {
  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return months[month - 1] || month.toString();
}
