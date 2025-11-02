import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toast } from 'sonner'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, type } = body

    if (!title || !content || !type) {
      return NextResponse.json(
        { error: 'Título, contenido y tipo son requeridos' },
        { status: 400 }
      )
    }

    // Get all users except admins
    const users = await db.user.findMany({
      where: {
        role: 'USER' // Only regular users, not admins
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    //console.log(`Found ${users.length} users with role USER`)
    


    if (users.length === 0) {
      // Get all users to debug
      const allUsers = await db.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      })
      //console.log('All users in database:', allUsers)
      
      return NextResponse.json(
        { 
          error: 'No hay usuarios registrados para enviar mensajes',
          debug: {
            totalUsers: allUsers.length,
            userRoles: allUsers.map(u => ({ email: u.email, role: u.role }))
          }
        },
        { status: 404 }
      )
    }

    // Get first admin as sender
    const adminUser = await db.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true }
    })

    //console.log('Found admin user:', adminUser)

    if (!adminUser) {
      return NextResponse.json(
        { error: 'No hay administradores disponibles para enviar mensajes' },
        { status: 404 }
      )
    }

    // Create messages for all users
    const messages = await Promise.all(
      users.map(user =>
        db.message.create({
          data: {
            senderId: adminUser.id,
            receiverId: user.id,
            title,
            content,
            type: type as 'GENERAL' | 'WARNING' | 'SYSTEM_NOTIFICATION',
            isRead: false
          }
        })
      )
    )

    //console.log(`Successfully created ${messages.length} messages`)

    return NextResponse.json({
      message: 'Mensajes enviados exitosamente',
      messageCount: messages.length,
      usersCount: users.length,
      type,
      title,
      sender: adminUser.name || adminUser.email
    })

  } catch (error) {
    //console.error('Error al enviar el mensaje de difusión.', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
  const errorDetails = error instanceof Error ? error.stack : 'No hay detalles disponibles'
    return NextResponse.json(
      { 
        error: 'Error al enviar mensajes masivos: ' + errorMessage,
        details: errorDetails
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get statistics about broadcast messages
    const totalUsers = await db.user.count({
      where: { role: 'USER' }
    })

    const recentMessages = await db.message.count({
      where: {
        senderId: 'system',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    return NextResponse.json({
      totalUsers,
      recentBroadcastMessages: recentMessages,
      canSendBroadcast: totalUsers > 0
    })

  } catch (error) {
    //console.error('Error al obtener las estadísticas de la transmisión: ', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}