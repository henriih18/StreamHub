import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const { accountEmail, accountPassword, profileName, profilePin } = await request.json()

    // Verificar si el pedido existe
    const order = await db.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar credenciales del pedido
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        accountEmail: accountEmail || order.accountEmail,
        accountPassword: accountPassword || order.accountPassword,
        profileName: profileName || order.profileName,
        profilePin: profilePin || order.profilePin
      }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order credentials:', error)
    return NextResponse.json(
      { error: 'Error al actualizar credenciales del pedido' },
      { status: 500 }
    )
  }
}