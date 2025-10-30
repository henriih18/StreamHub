import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Test data for 15 concurrent users
const testUsers = [
  { id: 'test-user-1', email: 'user1@test.com', name: 'Test User 1', credits: 50000 },
  { id: 'test-user-2', email: 'user2@test.com', name: 'Test User 2', credits: 50000 },
  { id: 'test-user-3', email: 'user3@test.com', name: 'Test User 3', credits: 50000 },
  { id: 'test-user-4', email: 'user4@test.com', name: 'Test User 4', credits: 50000 },
  { id: 'test-user-5', email: 'user5@test.com', name: 'Test User 5', credits: 50000 },
  { id: 'test-user-6', email: 'user6@test.com', name: 'Test User 6', credits: 50000 },
  { id: 'test-user-7', email: 'user7@test.com', name: 'Test User 7', credits: 50000 },
  { id: 'test-user-8', email: 'user8@test.com', name: 'Test User 8', credits: 50000 },
  { id: 'test-user-9', email: 'user9@test.com', name: 'Test User 9', credits: 50000 },
  { id: 'test-user-10', email: 'user10@test.com', name: 'Test User 10', credits: 50000 },
  { id: 'test-user-11', email: 'user11@test.com', name: 'Test User 11', credits: 50000 },
  { id: 'test-user-12', email: 'user12@test.com', name: 'Test User 12', credits: 50000 },
  { id: 'test-user-13', email: 'user13@test.com', name: 'Test User 13', credits: 50000 },
  { id: 'test-user-14', email: 'user14@test.com', name: 'Test User 14', credits: 50000 },
  { id: 'test-user-15', email: 'user15@test.com', name: 'Test User 15', credits: 50000 }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'setup') {
      // Setup test environment
      console.log('🔧 Setting up test environment...')
      
      // Create test users
      for (const user of testUsers) {
        await db.user.upsert({
          where: { id: user.id },
          update: { credits: user.credits },
          create: user
        })
      }

      // Get available streaming accounts for testing
      const availableAccounts = await db.streamingAccount.findMany({
        where: { isActive: true },
        include: {
          accountStocks: {
            where: { isAvailable: true }
          },
          profileStocks: {
            where: { isAvailable: true }
          }
        }
      })

      // Create test stock if needed
      for (const account of availableAccounts) {
        // Ensure we have enough stock for testing
        const currentAccountStock = account.accountStocks.length
        const currentProfileStock = account.profileStocks.length
        
        if (currentAccountStock < 10) {
          for (let i = currentAccountStock; i < 10; i++) {
            await db.accountStock.create({
              data: {
                streamingAccountId: account.id,
                email: `test${i}@${account.name.toLowerCase().replace(/\s+/g, '')}.com`,
                password: `TestPass123!${i}`,
                isAvailable: true
              }
            })
          }
        }
        
        if (currentProfileStock < 20) {
          for (let i = currentProfileStock; i < 20; i++) {
            await db.accountProfile.create({
              data: {
                streamingAccountId: account.id,
                email: `test${i}@${account.name.toLowerCase().replace(/\s+/g, '')}.com`,
                password: `TestPass123!${i}`,
                profileName: `TestProfile${i}`,
                profilePin: `${Math.floor(1000 + Math.random() * 9000)}`,
                isAvailable: true
              }
            })
          }
        }
      }

      return NextResponse.json({
        message: 'Test environment setup complete',
        usersCreated: testUsers.length,
        availableAccounts: availableAccounts.length
      })
    }

    if (action === 'run') {
      // Run concurrent purchase test
      console.log('🚀 Starting concurrent purchase test with 15 users...')
      
      const startTime = Date.now()
      const results = []
      
      // Get a specific account for all users to compete for
      const targetAccount = await db.streamingAccount.findFirst({
        where: { isActive: true },
        include: {
          accountStocks: {
            where: { isAvailable: true }
          },
          profileStocks: {
            where: { isAvailable: true }
          }
        }
      })

      if (!targetAccount) {
        return NextResponse.json({ error: 'No available accounts for testing' }, { status: 400 })
      }

      // Create purchase promises for all 15 users simultaneously
      const purchasePromises = testUsers.map(async (user, index) => {
        try {
          // Simulate realistic purchase delay
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
          
          const purchaseData = {
            userId: user.id,
            items: [{
              streamingAccount: {
                id: targetAccount.id,
                name: targetAccount.name
              },
              quantity: 1,
              saleType: targetAccount.saleType,
              priceAtTime: targetAccount.price
            }]
          }

          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(purchaseData)
          })

          const result = await response.json()
          
          return {
            userId: user.id,
            userName: user.name,
            success: response.ok,
            status: response.status,
            result: result,
            timestamp: Date.now()
          }
        } catch (error) {
          return {
            userId: user.id,
            userName: user.name,
            success: false,
            error: error.message,
            timestamp: Date.now()
          }
        }
      })

      // Execute all purchases simultaneously
      const allResults = await Promise.all(purchasePromises)
      const endTime = Date.now()
      
      // Analyze results
      const successful = allResults.filter(r => r.success)
      const failed = allResults.filter(r => !r.success)
      
      // Check database state after test
      const finalAccountStock = await db.accountStock.count({
        where: { 
          streamingAccountId: targetAccount.id,
          isAvailable: true 
        }
      })
      
      const finalProfileStock = await db.accountProfile.count({
        where: { 
          streamingAccountId: targetAccount.id,
          isAvailable: true 
        }
      })

      const ordersCreated = await db.order.count({
        where: { 
          userId: { in: testUsers.map(u => u.id) },
          createdAt: { gte: new Date(startTime) }
        }
      })

      return NextResponse.json({
        testResults: {
          totalUsers: testUsers.length,
          executionTime: `${endTime - startTime}ms`,
          successful: successful.length,
          failed: failed.length,
          details: allResults,
          databaseState: {
            targetAccount: targetAccount.name,
            saleType: targetAccount.saleType,
            finalAccountStock,
            finalProfileStock,
            ordersCreated
          }
        },
        summary: {
          noDuplicateSales: ordersCreated === successful.length,
          allUsersProcessed: successful.length + failed.length === testUsers.length,
          dataIntegrity: ordersCreated === successful.length ? '✅ PASSED' : '❌ FAILED'
        }
      })
    }

    if (action === 'cleanup') {
      // Clean up test data
      console.log('🧹 Cleaning up test environment...')
      
      // Delete test orders
      await db.order.deleteMany({
        where: { 
          userId: { in: testUsers.map(u => u.id) }
        }
      })

      // Delete test users
      await db.user.deleteMany({
        where: { 
          id: { in: testUsers.map(u => u.id) }
        }
      })

      return NextResponse.json({
        message: 'Test environment cleaned up'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'status') {
    // Get current test status
    const testUsersCount = await db.user.count({
      where: { 
        id: { in: testUsers.map(u => u.id) }
      }
    })

    const availableAccounts = await db.accountStock.count({
      where: { isAvailable: true }
    })

    const availableProfiles = await db.accountProfile.count({
      where: { isAvailable: true }
    })

    return NextResponse.json({
      testUsersExist: testUsersCount,
      availableAccounts,
      availableProfiles,
      readyForTest: testUsersCount > 0 && (availableAccounts > 0 || availableProfiles > 0)
    })
  }

  return NextResponse.json({
    message: 'Concurrent Purchase Test API',
    endpoints: {
      'POST /api/test-concurrent': {
        actions: ['setup', 'run', 'cleanup'],
        description: 'Test concurrent purchases with 15 users'
      },
      'GET /api/test-concurrent?action=status': {
        description: 'Get current test status'
      }
    }
  })
}