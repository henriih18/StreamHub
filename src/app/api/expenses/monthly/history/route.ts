import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '12')
    const year = searchParams.get('year')
    
    let whereClause = {}
    if (year) {
      whereClause = { year: parseInt(year) }
    }

    // Get monthly profit history
    const monthlyHistory = await db.monthlyProfit.findMany({
      where: whereClause,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ],
      take: limit
    })

    // Calculate totals and statistics
    const totalRevenue = monthlyHistory.reduce((sum, record) => sum + record.revenue, 0)
    const totalExpenses = monthlyHistory.reduce((sum, record) => sum + record.expenses, 0)
    const totalProfits = monthlyHistory.reduce((sum, record) => sum + record.profits, 0)
    const averageProfitMargin = monthlyHistory.length > 0 
      ? monthlyHistory.reduce((sum, record) => sum + record.profitMargin, 0) / monthlyHistory.length 
      : 0

    // Group by year for yearly summaries
    const yearlySummary = monthlyHistory.reduce((acc, record) => {
      const year = record.year
      if (!acc[year]) {
        acc[year] = {
          year,
          totalRevenue: 0,
          totalExpenses: 0,
          totalProfits: 0,
          totalRecharges: 0,
          uniqueUsers: new Set(),
          months: []
        }
      }
      
      acc[year].totalRevenue += record.revenue
      acc[year].totalExpenses += record.expenses
      acc[year].totalProfits += record.profits
      acc[year].totalRecharges += record.totalRecharges
      acc[year].months.push(record)
      
      return acc
    }, {} as Record<string, any>)

    // Convert Sets to counts and calculate averages
    Object.values(yearlySummary).forEach((summary: any) => {
      summary.uniqueUsers = summary.months.reduce((sum: number, month: any) => sum + month.uniqueUsers, 0)
      summary.averageMonthlyProfit = summary.totalProfits / summary.months.length
      summary.averageProfitMargin = summary.months.reduce((sum: number, month: any) => sum + month.profitMargin, 0) / summary.months.length
    })

    // Get available years for filtering
    const availableYears = await db.monthlyProfit.findMany({
      select: {
        year: true
      },
      distinct: ['year'],
      orderBy: {
        year: 'desc'
      }
    })

    return NextResponse.json({
      history: monthlyHistory,
      summary: {
        totalRevenue,
        totalExpenses,
        totalProfits,
        averageProfitMargin,
        totalMonths: monthlyHistory.length
      },
      yearlySummary: Object.values(yearlySummary).sort((a: any, b: any) => b.year - a.year),
      availableYears: availableYears.map(y => y.year),
      currentMonth: {
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
      }
    })

  } catch (error) {
    console.error('Error fetching monthly history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}