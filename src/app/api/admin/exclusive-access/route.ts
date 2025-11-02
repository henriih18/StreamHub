/* import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { exclusiveAccountId, userId } = await request.json()

    // Validate required fields
    if (!exclusiveAccountId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user already has access
    const existingAccess = await db.exclusiveAccess.findUnique({
      where: {
        exclusiveAccountId_userId: {
          exclusiveAccountId,
          userId
        }
      }
    })

    if (existingAccess) {
      return NextResponse.json({ error: 'User already has access to this exclusive account' }, { status: 400 })
    }

    // Grant access to exclusive account
    const exclusiveAccess = await db.exclusiveAccess.create({
      data: {
        exclusiveAccountId,
        userId
      }
    })

    return NextResponse.json(exclusiveAccess)
  } catch (error) {
    console.error('Error granting exclusive access:', error)
    return NextResponse.json({ error: 'Error granting exclusive access' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { exclusiveAccountId, userId } = await request.json()

    // Validate required fields
    if (!exclusiveAccountId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Remove access to exclusive account
    await db.exclusiveAccess.delete({
      where: {
        exclusiveAccountId_userId: {
          exclusiveAccountId,
          userId
        }
      }
    })

    return NextResponse.json({ message: 'Access removed successfully' })
  } catch (error) {
    console.error('Error removing exclusive access:', error)
    return NextResponse.json({ error: 'Error removing exclusive access' }, { status: 500 })
  }
} */

  import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toast } from 'sonner'

export async function POST(request: NextRequest) {
  try {
    const { exclusiveAccountId, userId } = await request.json()

    // Validate required fields
    if (!exclusiveAccountId || !userId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Check if user already has access
    const exclusiveAccount = await db.exclusiveAccount.findUnique({
      where: { id: exclusiveAccountId },
      include: {
        allowedUsers: {
          where: { id: userId }
        }
      }
    })

    if (!exclusiveAccount) {
      return NextResponse.json({ error: 'Cuenta exclusiva no encontrada' }, { status: 404 })
    }

    if (exclusiveAccount.allowedUsers.length > 0) {
      return NextResponse.json({ error: 'El usuario ya tiene acceso a esta cuenta exclusiva.' }, { status: 400 })
    }

    // Grant access to exclusive account
    const updatedAccount = await db.exclusiveAccount.update({
      where: { id: exclusiveAccountId },
      data: {
        allowedUsers: {
          connect: { id: userId }
        }
      },
      include: {
        allowedUsers: true
      }
    })

    return NextResponse.json({
      message: 'Access granted successfully',
      exclusiveAccount: updatedAccount
    })
  } catch (error) {
    //console.error('Error granting exclusive access:', error)
    
    return NextResponse.json({ error: 'Error al conceder acceso exclusivo' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { exclusiveAccountId, userId } = await request.json()

    // Validate required fields
    if (!exclusiveAccountId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Remove access to exclusive account
    const updatedAccount = await db.exclusiveAccount.update({
      where: { id: exclusiveAccountId },
      data: {
        allowedUsers: {
          disconnect: { id: userId }
        }
      },
      include: {
        allowedUsers: true
      }
    })

    return NextResponse.json({ 
      message: 'Access removed successfully',
      exclusiveAccount: updatedAccount
    })
  } catch (error) {
    //console.error('Error removing exclusive access:', error)
    
    return NextResponse.json({ error: 'Error al eliminar el acceso exclusivo' }, { status: 500 })
  }
}