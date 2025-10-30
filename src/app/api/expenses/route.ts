import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const expenses = await db.expense.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate total monthly expenses
    const currentMonth = new Date()
    currentMonth.setDate(1) // First day of current month
    currentMonth.setHours(0, 0, 0, 0)

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

    const uniqueExpenses = await db.expense.findMany({
      where: {
        isActive: true,
        frequency: 'UNICO',
        createdAt: {
          gte: currentMonth
        }
      }
    })

    // Calculate totals
    const totalMonthly = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    const totalAnnualMonthly = annualExpenses.reduce((sum, expense) => sum + (expense.amount / 12), 0)
    const totalUnique = uniqueExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    const totalMonthlyExpenses = totalMonthly + totalAnnualMonthly + totalUnique

    return NextResponse.json({
      expenses,
      totals: {
        monthly: totalMonthlyExpenses,
        annual: annualExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        unique: uniqueExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      }
    })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, amount, category, frequency, dueDate } = await request.json()

    if (!name || !amount || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const expense = await db.expense.create({
      data: {
        name,
        description,
        amount: parseFloat(amount),
        category,
        frequency: frequency || 'MENSUAL',
        dueDate: dueDate ? new Date(dueDate) : null
      }
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}