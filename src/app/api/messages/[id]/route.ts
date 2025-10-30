import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// Allow both PATCH and POST for marking messages as read
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateMessage(request, await params)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateMessage(request, await params)
}

async function updateMessage(
  request: NextRequest,
  params: { id: string }
) {
  try {
    // For now, skip authentication and use a default user for testing
    // TODO: Add proper authentication back when login system is fully implemented
    const user = await db.user.findFirst({
      where: { email: 'hernandezhenry58@gmail.com' }
    })

    if (!user) {
      console.error('❌ User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { isRead } = await request.json()
    const messageId = params.id

    console.log(`🔧 ${request.method} request for message ${messageId}, isRead: ${isRead}`)
    console.log(`👤 User ID: ${user.id}, Email: ${user.email}`)

    // Find the message and verify it belongs to the user
    const message = await db.message.findFirst({
      where: {
        id: messageId,
        receiverId: user.id
      }
    })

    if (!message) {
      console.error(`❌ Message ${messageId} not found for user ${user.id}`)
      
      // Let's check if the message exists at all
      const anyMessage = await db.message.findUnique({
        where: { id: messageId }
      })
      
      if (anyMessage) {
        console.error(`❌ Message exists but belongs to different user. Message receiverId: ${anyMessage.receiverId}`)
      } else {
        console.error(`❌ Message does not exist at all`)
      }
      
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Update the message
    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: { isRead },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    console.log(`✅ Message ${messageId} marked as ${isRead ? 'read' : 'unread'} by user ${user.email}`)

    return NextResponse.json(updatedMessage)
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    
    // For now, skip authentication and use a default user for testing
    // TODO: Add proper authentication back when login system is fully implemented
    const user = await db.user.findFirst({
      where: { email: 'hernandezhenry58@gmail.com' }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const messageId = resolvedParams.id

    console.log(`🗑️ DELETE request for message ${messageId}`)

    // Find the message and verify it belongs to the user
    const message = await db.message.findFirst({
      where: {
        id: messageId,
        receiverId: user.id
      }
    })

    if (!message) {
      console.error(`❌ Message ${messageId} not found for user ${user.id}`)
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Delete the message
    await db.message.delete({
      where: { id: messageId }
    })

    console.log(`✅ Message ${messageId} deleted by user ${user.email}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}