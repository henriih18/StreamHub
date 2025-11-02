import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toast } from 'sonner'

// Temporarily disable authentication for development
// TODO: Implement proper authentication with NextAuth

export async function POST(request: NextRequest) {
  try {
    // For development, we'll skip authentication check
    // In production, uncomment the following:
    /*
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    */

    const data = await request.json()
    //console.log('Received data for exclusive stock:', data)
    toast.success('Datos recibidos para stock exclusivo')

    const {
      exclusiveAccountId,
      email,
      password,
      pin,
      profileName,
      notes
    } = data

    // Validate required fields
    if (!exclusiveAccountId || !email || !password) {
      return NextResponse.json(
        { error: 'El email y la contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Check if the exclusive account exists
    const exclusiveAccount = await db.exclusiveAccount.findUnique({
      where: { id: exclusiveAccountId }
    })

    if (!exclusiveAccount) {
      return NextResponse.json(
        { error: 'Cuenta exclusiva no encontrada' },
        { status: 404 }
      )
    }

    // Create exclusive stock
    const stock = await db.exclusiveStock.create({
      data: {
        exclusiveAccountId,
        email,
        password,
        pin: pin || null,
        profileName: profileName || null,
        notes: notes || null
      },
      include: {
        exclusiveAccount: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    return NextResponse.json(stock)
  } catch (error) {
    //console.error('Error creating exclusive stock:', error)
    toast.error('Error al crear stock exclusivo')
    return NextResponse.json(
      { error: 'Error al agregar stock' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // For development, we'll skip authentication check
    // In production, uncomment the following:
    /*
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    */

    const { searchParams } = new URL(request.url)
    const exclusiveAccountId = searchParams.get('exclusiveAccountId')

    if (!exclusiveAccountId) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la cuenta exclusiva' },
        { status: 400 }
      )
    }

    const stocks = await db.exclusiveStock.findMany({
      where: {
        exclusiveAccountId
      },
      include: {
        soldToUser: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match expected interface
    const transformedStocks = stocks.map(stock => ({
      ...stock,
      soldToUser: stock.soldToUser ? {
        ...stock.soldToUser,
        name: stock.soldToUser.fullName
      } : undefined
    }))

    return NextResponse.json(transformedStocks)
  } catch (error) {
    //console.error('Error fetching exclusive stocks:', error)
    toast.error('Error al obtener acciones exclusivas')
    return NextResponse.json(
      { error: 'Error al cargar stock' },
      { status: 500 }
    )
  }
}