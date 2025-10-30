import { NextRequest, NextResponse } from 'next/server'
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
}