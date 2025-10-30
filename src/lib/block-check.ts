import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export interface BlockCheckResult {
  isBlocked: boolean
  blockInfo?: {
    id: string
    reason: string
    blockType: 'temporary' | 'permanent'
    duration?: number
    expiresAt?: Date
  }
}

export async function checkUserBlockStatus(): Promise<BlockCheckResult> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return { isBlocked: false }
    }

    // Check session data first
    if (session.user.isBlocked && session.user.blockInfo) {
      // Verify block is still active in database
      const currentBlock = await db.userBlock.findFirst({
        where: {
          id: session.user.blockInfo.id,
          isActive: true,
          OR: [
            { expiresAt: null }, // Permanent blocks
            { expiresAt: { gt: new Date() } } // Temporary blocks not expired
          ]
        }
      })

      if (currentBlock) {
        return {
          isBlocked: true,
          blockInfo: session.user.blockInfo
        }
      } else {
        // Block is no longer active, update session data would require re-login
        // For now, just return not blocked
        return { isBlocked: false }
      }
    }

    // Fallback: check database directly
    const activeBlock = await db.userBlock.findFirst({
      where: {
        userId: session.user.id,
        isActive: true,
        OR: [
          { expiresAt: null }, // Permanent blocks
          { expiresAt: { gt: new Date() } } // Temporary blocks not expired
        ]
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (activeBlock) {
      return {
        isBlocked: true,
        blockInfo: {
          id: activeBlock.id,
          reason: activeBlock.reason,
          blockType: activeBlock.blockType as 'temporary' | 'permanent',
          duration: activeBlock.duration ? Number(activeBlock.duration) : undefined,
          expiresAt: activeBlock.expiresAt || undefined
        }
      }
    }

    return { isBlocked: false }
  } catch (error) {
    console.error('Error checking block status:', error)
    return { isBlocked: false }
  }
}

export function formatBlockMessage(blockInfo: BlockCheckResult['blockInfo']): string {
  if (!blockInfo) return ''

  const { blockType, duration, expiresAt, reason } = blockInfo
  
  let message = `Tu cuenta está bloqueada. Motivo: ${reason}`
  
  if (blockType === 'permanent') {
    message += ' Este bloqueo es permanente.'
  } else if (duration && expiresAt) {
    const expiryDate = new Date(expiresAt)
    message += ` Este bloqueo expirará el ${expiryDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}.`
  }
  
  message += ' No podrás realizar compras hasta que el bloqueo sea levantado.'
  
  return message
}