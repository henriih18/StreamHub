import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      isBlocked?: boolean
      blockInfo?: {
        id: string
        reason: string
        blockType: 'temporary' | 'permanent'
        duration?: number
        expiresAt?: Date
      } | null
    } & DefaultSession['user']
  }

  interface User {
    id: string
    email: string
    name?: string | null
    role: string
    isBlocked?: boolean
    blockInfo?: {
      id: string
      reason: string
      blockType: 'temporary' | 'permanent'
      duration?: number
      expiresAt?: Date
    } | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    isBlocked?: boolean
    blockInfo?: {
      id: string
      reason: string
      blockType: 'temporary' | 'permanent'
      duration?: number
      expiresAt?: Date
    } | null
  }
}