import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { year, month, force = false } = await request.json()
    
    if (!year || !month) {
      return NextResponse.json({ error: 'Year and month are required' }, { status: 400 })
    }

    // Check if record already exists
    const existingRecord = await db.monthlyProfit.findUnique({
      where: {
        year_month: {
          year: parseInt(year),
          month: parseInt(month)
        }
      }
    })

    if (existingRecord && !force) {
      return NextResponse.json({ 
        error: 'Monthly record already exists', 
        existingRecord 
      }, { status: 409 })
    }

    // Calculate profits for the specified month
    const profitsResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/expenses/profits?year=${year}&month=${month}`)
    if (!profitsResponse.ok) {
      throw new Error('Failed to calculate profits')
    }

    const profitData = await profitsResponse.json()

    // Save or update the monthly record
    const monthlyRecord = await db.monthlyProfit.upsert({
      where: {
        year_month: {
          year: parseInt(year),
          month: parseInt(month)
        }
      },
      update: {
        revenue: profitData.revenue,
        expenses: profitData.expenses,
        profits: profitData.profits,
        profitMargin: profitData.profitMargin,
        totalRecharges: profitData.totalRecharges,
        uniqueUsers: profitData.uniqueUsers,
        averageRecharge: profitData.averageRecharge,
        details: profitData.details,
        isClosed: true,
        updatedAt: new Date()
      },
      create: {
        year: parseInt(year),
        month: parseInt(month),
        revenue: profitData.revenue,
        expenses: profitData.expenses,
        profits: profitData.profits,
        profitMargin: profitData.profitMargin,
        totalRecharges: profitData.totalRecharges,
        uniqueUsers: profitData.uniqueUsers,
        averageRecharge: profitData.averageRecharge,
        details: profitData.details,
        isClosed: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Monthly record for ${year}-${month.toString().padStart(2, '0')} saved successfully`,
      record: monthlyRecord
    })

  } catch (error) {
    console.error('Error saving monthly record:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    if (year && month) {
      // Get specific month record
      const record = await db.monthlyProfit.findUnique({
        where: {
          year_month: {
            year: parseInt(year),
            month: parseInt(month)
          }
        }
      })

      if (!record) {
        return NextResponse.json({ error: 'Monthly record not found' }, { status: 404 })
      }

      return NextResponse.json(record)
    } else {
      // Get all monthly records
      const records = await db.monthlyProfit.findMany({
        orderBy: [
          { year: 'desc' },
          { month: 'desc' }
        ]
      })

      return NextResponse.json(records)
    }

  } catch (error) {
    console.error('Error fetching monthly records:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}