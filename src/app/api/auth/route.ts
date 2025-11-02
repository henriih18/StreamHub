import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, action, name } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    // If no action specified, default to login
    if (!action || action === 'login') {
      // Login
      if (!password) {
        return NextResponse.json(
          { error: 'La contraseña es requerida' },
          { status: 400 }
        )
      }

      const user = await db.user.findUnique({
        where: { email }
      })

      if (!user || !user.password) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        )
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        )
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json({ user: userWithoutPassword })
    } else if (action === 'register') {
      // Register
      if (!password || !name) {
        return NextResponse.json(
          { error: 'Nombre y contraseña son requeridos' },
          { status: 400 }
        )
      }

      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'El usuario ya existe' },
          { status: 409 }
        )
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Create user
      const user = await db.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          credits: 50 // Give new users 50 credits to start
        }
      })

      // Return user without password
      const { password: _, ...userWithoutPassword } = user
      return NextResponse.json({ user: userWithoutPassword }, { status: 201 })
    } else {
      return NextResponse.json(
        { error: 'Acción inválida' },
        { status: 400 }
      )
    }
  } catch (error) {
    //console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Error de autenticación' },
      { status: 500 }
    )
  }
}