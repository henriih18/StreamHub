import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Temporarily disable authentication for development
// TODO: Implement proper authentication with NextAuth

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { userId, action } = data
    const { id: accountId } = params

    if (!userId || !action || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      )
    }

    // Get the exclusive account
    const account = await db.exclusiveAccount.findUnique({
      where: { id: accountId },
      include: {
        allowedUsers: true
      }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Cuenta exclusiva no encontrada' },
        { status: 404 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Update access based on action
    if (action === 'add') {
      // Add user to allowed users
      await db.exclusiveAccount.update({
        where: { id: accountId },
        data: {
          allowedUsers: {
            connect: { id: userId }
          }
        }
      })
    } else {
      // Remove user from allowed users
      await db.exclusiveAccount.update({
        where: { id: accountId },
        data: {
          allowedUsers: {
            disconnect: { id: userId }
          }
        }
      })
    }

    return NextResponse.json({ 
      message: `Acceso ${action === 'add' ? 'otorgado' : 'revocado'} exitosamente` 
    })
  } catch (error) {
    console.error('Error updating access:', error)
    return NextResponse.json(
      { error: 'Error al actualizar acceso' },
      { status: 500 }
    )
  }
}