import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { checkUserBlockStatus, formatBlockMessage } from '@/lib/block-check'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const blockResult = await checkUserBlockStatus()
    
    if (blockResult.isBlocked && blockResult.blockInfo) {
      return NextResponse.json({
        isBlocked: true,
        blockInfo: blockResult.blockInfo,
        message: formatBlockMessage(blockResult.blockInfo)
      })
    }

    return NextResponse.json({
      isBlocked: false
    })

  } catch (error) {
    console.error('Error checking block status:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}