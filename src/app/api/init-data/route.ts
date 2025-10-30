import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10)
    const adminUser = await db.user.upsert({
      where: { email: 'admin@streamhub.com' },
      update: {},
      create: {
        email: 'admin@streamhub.com',
        name: 'Admin',
        password: adminPassword,
        role: 'ADMIN',
        credits: 1000
      }
    })

    // Create test user
    const testPassword = await bcrypt.hash('test123', 10)
    const testUser = await db.user.upsert({
      where: { email: 'test@streamhub.com' },
      update: {},
      create: {
        email: 'test@streamhub.com',
        name: 'Test User',
        password: testPassword,
        role: 'USER',
        credits: 100
      }
    })

    // Create streaming types
    const netflixType = await db.streamingType.upsert({
      where: { name: 'Netflix' },
      update: {},
      create: {
        name: 'Netflix',
        description: 'Netflix streaming service',
        icon: '🎬',
        color: 'bg-red-500'
      }
    })

    const disneyType = await db.streamingType.upsert({
      where: { name: 'Disney+' },
      update: {},
      create: {
        name: 'Disney+',
        description: 'Disney+ streaming service',
        icon: '🏰',
        color: 'bg-blue-500'
      }
    })

    const hboType = await db.streamingType.upsert({
      where: { name: 'HBO Max' },
      update: {},
      create: {
        name: 'HBO Max',
        description: 'HBO Max streaming service',
        icon: '🎭',
        color: 'bg-purple-500'
      }
    })

    const amazonType = await db.streamingType.upsert({
      where: { name: 'Amazon Prime' },
      update: {},
      create: {
        name: 'Amazon Prime',
        description: 'Amazon Prime Video streaming service',
        icon: '📦',
        color: 'bg-orange-500'
      }
    })

    // Create streaming accounts
    const accounts = [
      {
        name: 'Netflix Premium',
        description: 'Acceso completo a todo el catálogo de Netflix con calidad 4K',
        price: 15.99,
        type: 'Netflix',
        duration: '1 mes',
        quality: '4K HDR',
        screens: 4,
        saleType: 'FULL' as const,
        email: 'netflix@example.com',
        password: 'password123'
      },
      {
        name: 'Disney+ Premium',
        description: 'Todo el contenido de Disney, Pixar, Marvel y Star Wars',
        price: 12.99,
        type: 'Disney+',
        duration: '1 mes',
        quality: '4K',
        screens: 4,
        saleType: 'FULL' as const,
        email: 'disney@example.com',
        password: 'password123'
      },
      {
        name: 'HBO Max',
        description: 'Acceso a HBO, Warner Bros y contenido exclusivo',
        price: 14.99,
        type: 'HBO Max',
        duration: '1 mes',
        quality: '4K',
        screens: 3,
        saleType: 'FULL' as const,
        email: 'hbo@example.com',
        password: 'password123'
      },
      {
        name: 'Amazon Prime Video',
        description: 'Miles de películas y series con Prime Originals',
        price: 8.99,
        type: 'Amazon Prime',
        duration: '1 mes',
        quality: '4K',
        screens: 3,
        saleType: 'FULL' as const,
        email: 'prime@example.com',
        password: 'password123'
      },
      {
        name: 'Netflix Perfiles',
        description: 'Vende perfiles individuales de Netflix',
        price: 3.99,
        type: 'Netflix',
        duration: '1 mes',
        quality: 'HD',
        screens: 1,
        saleType: 'PROFILES' as const,
        maxProfiles: 4,
        pricePerProfile: 3.99,
        email: 'netflix-profiles@example.com',
        password: 'password123'
      },
      {
        name: 'Disney+ Perfiles',
        description: 'Vende perfiles individuales de Disney+',
        price: 2.99,
        type: 'Disney+',
        duration: '1 mes',
        quality: 'HD',
        screens: 1,
        saleType: 'PROFILES' as const,
        maxProfiles: 4,
        pricePerProfile: 2.99,
        email: 'disney-profiles@example.com',
        password: 'password123'
      }
    ]

    for (const accountData of accounts) {
      await db.streamingAccount.upsert({
        where: {
          name_type: {
            name: accountData.name,
            type: accountData.type
          }
        },
        update: {},
        create: accountData
      })
    }

    return NextResponse.json({ 
      message: 'Database initialized successfully',
      adminUser: { email: adminUser.email, password: 'admin123' },
      testUser: { email: testUser.email, password: 'test123' }
    })
  } catch (error) {
    console.error('Error initializing data:', error)
    return NextResponse.json(
      { error: 'Error initializing data' },
      { status: 500 }
    )
  }
}