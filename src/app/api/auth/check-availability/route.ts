import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const checkAvailabilitySchema = z.object({
  type: z.enum(['email', 'username']),
  value: z.string().min(1, 'El valor es requerido')
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const value = searchParams.get('value')

    // Validar parámetros
    const validation = checkAvailabilitySchema.safeParse({ type, value })
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos' },
        { status: 400 }
      )
    }

    const { type: fieldType, value: fieldValue } = validation.data

    // Verificar disponibilidad según el tipo
    let existingUser: { id: string; email: string; username: string | null; name: string | null } | null = null
    let fieldName = ''

    if (fieldType === 'email') {
      existingUser = await db.user.findUnique({
        where: { email: fieldValue.toLowerCase() }
      })
      fieldName = 'email'
    } else if (fieldType === 'username') {
      existingUser = await db.user.findUnique({
        where: { username: fieldValue }
      })
      fieldName = 'username'
    }

    // Responder según disponibilidad
    if (existingUser) {
      return NextResponse.json({
        available: false,
        message: fieldType === 'email' 
          ? 'Este email ya está registrado' 
          : 'Este nombre de usuario ya está en uso',
        field: fieldName
      })
    } else {
      return NextResponse.json({
        available: true,
        message: fieldType === 'email' 
          ? 'Email disponible' 
          : 'Nombre de usuario disponible',
        field: fieldName
      })
    }

  } catch (error) {
    //console.error('Error verificando disponibilidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}