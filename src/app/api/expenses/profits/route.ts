import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const yearParam = searchParams.get('year')
    const monthParam = searchParams.get('month')
    
    // Get current date or use provided parameters
    const now = new Date()
    const year = yearParam ? parseInt(yearParam) : now.getFullYear()
    const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1 // JavaScript months are 0-11
    
    // Set date range for the specified month
    const monthStart = new Date(year, month - 1, 1) // month-1 because JS months are 0-11
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999) // Last day of the month
    
    //console.log(`Calculating profits for ${year}-${month.toString().padStart(2, '0')}`)
    //console.log(`Date range: ${monthStart.toISOString()} to ${monthEnd.toISOString()}`)

    // Get credit recharges for the specified month
    const creditRecharges = await db.creditRecharge.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    const totalCreditsRecharged = creditRecharges.reduce((sum, recharge) => sum + recharge.amount, 0)
    const uniqueUsers = new Set(creditRecharges.map(r => r.userId)).size
    const averageRecharge = creditRecharges.length > 0 ? totalCreditsRecharged / creditRecharges.length : 0

    // Get total monthly expenses
    const monthlyExpenses = await db.expense.findMany({
      where: {
        isActive: true,
        frequency: 'MENSUAL'
      }
    })

    const annualExpenses = await db.expense.findMany({
      where: {
        isActive: true,
        frequency: 'ANUAL'
      }
    })

    // Get unique expenses from the specified month
    const uniqueExpenses = await db.expense.findMany({
      where: {
        isActive: true,
        frequency: 'UNICO',
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })

    // Calculate total monthly expenses
    const totalMonthlyExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalAnnualMonthly = annualExpenses.reduce((sum, expense) => sum + (expense.amount / 12), 0)
    const totalUniqueExpenses = uniqueExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    const totalExpenses = totalMonthlyExpenses + totalAnnualMonthly + totalUniqueExpenses

    // Calculate profits (credits recharged - expenses)
    const profits = totalCreditsRecharged - totalExpenses
    const profitMargin = totalCreditsRecharged > 0 ? (profits / totalCreditsRecharged) * 100 : 0

    // Prepare details for storage
    const details = {
      creditRecharges: creditRecharges.map(r => ({
        id: r.id,
        amount: r.amount,
        method: r.method,
        userId: r.userId,
        userEmail: r.user.email,
        userName: r.user.name,
        createdAt: r.createdAt
      })),
      expenses: {
        monthly: monthlyExpenses.map(e => ({ id: e.id, name: e.name, amount: e.amount, category: e.category })),
        annual: annualExpenses.map(e => ({ id: e.id, name: e.name, amount: e.amount, category: e.category })),
        unique: uniqueExpenses.map(e => ({ id: e.id, name: e.name, amount: e.amount, category: e.category }))
      }
    }

    return NextResponse.json({
      year,
      month,
      revenue: totalCreditsRecharged,
      expenses: totalExpenses,
      profits: profits,
      profitMargin: profitMargin,
      totalRecharges: creditRecharges.length,
      uniqueUsers: uniqueUsers,
      averageRecharge: averageRecharge,
      breakdown: {
        monthlyExpenses: totalMonthlyExpenses,
        annualExpensesMonthly: totalAnnualMonthly,
        uniqueExpenses: totalUniqueExpenses
      },
      dateRange: {
        start: monthStart,
        end: monthEnd
      },
      details: details
    })
  } catch (error) {
    //console.error('Error calculating profits:', error)
    return NextResponse.json({ error: 'Error interno sel servidor' }, { status: 500 })
  }
}