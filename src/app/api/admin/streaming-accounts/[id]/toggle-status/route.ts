import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = params.id

    // Verificar si la cuenta existe
    const account = await db.streamingAccount.findUnique({
      where: { id: accountId }
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Cuenta no encontrada' },
        { status: 404 }
      )
    }

    // Cambiar el estado de la cuenta
    const updatedAccount = await db.streamingAccount.update({
      where: { id: accountId },
      data: {
        isActive: !account.isActive
      }
    })

    return NextResponse.json({
      ...updatedAccount,
      message: `Cuenta ${updatedAccount.isActive ? 'activada' : 'desactivada'} exitosamente`
    })
  } catch (error) {
    console.error('Error toggling account status:', error)
    return NextResponse.json(
      { error: 'Error al cambiar estado de la cuenta' },
      { status: 500 }
    )
  }
}