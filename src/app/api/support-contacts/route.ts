import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Schema para validación
const supportContactSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  number: z.string().min(1, 'El número es requerido'),
  type: z.enum(['whatsapp', 'phone', 'telegram', 'sms']),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().default(0)
})

// GET - Obtener todos los contactos de soporte
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const contacts = await db.supportContact.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        name: true,
        number: true,
        type: true,
        description: true,
        isActive: true,
        order: true,
        createdAt: true,
        updatedAt: true
      }
    })

    const filteredContacts = activeOnly 
      ? contacts.filter(contact => contact.isActive)
      : contacts

    return NextResponse.json({
      success: true,
      contacts: filteredContacts,
      total: contacts.length,
      active: contacts.filter(c => c.isActive).length
    })

  } catch (error) {
    console.error('Error fetching support contacts:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo contacto de soporte
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar datos
    const validation = supportContactSchema.safeParse(body)
    if (!validation.success) {
      const fieldErrors = validation.error.errors[0]
      return NextResponse.json(
        { 
          error: fieldErrors.message,
          field: fieldErrors.path[0]
        },
        { status: 400 }
      )
    }

    const { name, number, type, description, isActive, order } = validation.data

    // Crear contacto
    const newContact = await db.supportContact.create({
      data: {
        name,
        number,
        type,
        description,
        isActive,
        order
      },
      select: {
        id: true,
        name: true,
        number: true,
        type: true,
        description: true,
        isActive: true,
        order: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Contacto de soporte creado exitosamente',
      contact: newContact
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating support contact:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar contacto de soporte existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID del contacto es requerido' },
        { status: 400 }
      )
    }

    // Validar datos (parcial)
    const validation = supportContactSchema.partial().safeParse(updateData)
    if (!validation.success) {
      const fieldErrors = validation.error.errors[0]
      return NextResponse.json(
        { 
          error: fieldErrors.message,
          field: fieldErrors.path[0]
        },
        { status: 400 }
      )
    }

    // Verificar si el contacto existe
    const existingContact = await db.supportContact.findUnique({
      where: { id }
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contacto de soporte no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar contacto
    const updatedContact = await db.supportContact.update({
      where: { id },
      data: validation.data,
      select: {
        id: true,
        name: true,
        number: true,
        type: true,
        description: true,
        isActive: true,
        order: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Contacto de soporte actualizado exitosamente',
      contact: updatedContact
    })

  } catch (error) {
    console.error('Error updating support contact:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar contacto de soporte
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID del contacto es requerido' },
        { status: 400 }
      )
    }

    // Verificar si el contacto existe
    const existingContact = await db.supportContact.findUnique({
      where: { id }
    })

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contacto de soporte no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar contacto
    await db.supportContact.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Contacto de soporte eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting support contact:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}