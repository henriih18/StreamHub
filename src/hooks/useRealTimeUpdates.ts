'use client'

import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface UseRealTimeUpdatesProps {
  userId?: string
  isAdmin?: boolean
  onUserUpdate?: (userData: any) => void
  onStockUpdate?: (stockData: any) => void
  onAccountUpdate?: (accountData: any) => void
  onOrderUpdate?: (orderData: any) => void
  onMessageUpdate?: (messageData: { unreadCount: number }) => void
}

export function useRealTimeUpdates({
  userId,
  isAdmin = false,
  onUserUpdate,
  onStockUpdate,
  onAccountUpdate,
  onOrderUpdate,
  onMessageUpdate
}: UseRealTimeUpdatesProps) {
  const socketRef = useRef<Socket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    try {
      const socket = io('/api/socketio', {
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: true
      })

      socketRef.current = socket

      socket.on('connect', () => {
        // console.log('WebSocket connected')
        reconnectAttempts.current = 0

        // Register for updates
        if (userId) {
          socket.emit('registerUser', userId)
        }
        if (isAdmin) {
          socket.emit('registerAdmin')
        }
      })

      socket.on('disconnect', (reason) => {
        // console.log('WebSocket disconnected:', reason)
        
        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          setTimeout(() => {
            // console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`)
            connect()
          }, 1000 * reconnectAttempts.current)
        }
      })

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
      })

      // Listen for real-time updates
      socket.on('userUpdated', (userData: any) => {
        // console.log('User updated:', userData)
        onUserUpdate?.(userData)
      })

      socket.on('stockUpdated', (stockData: any) => {
        // console.log('Stock updated:', stockData)
        onStockUpdate?.(stockData)
      })

      socket.on('accountUpdated', (accountData: any) => {
        // console.log('Account updated:', accountData)
        onAccountUpdate?.(accountData)
      })

      socket.on('orderUpdated', (orderData: any) => {
        // console.log('Order updated:', orderData)
        onOrderUpdate?.(orderData)
      })

      socket.on('messageUpdate', (messageData: { unreadCount: number }) => {
        // console.log('Message count updated:', messageData)
        onMessageUpdate?.(messageData)
      })

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }, [userId, isAdmin, onUserUpdate, onStockUpdate, onAccountUpdate, onOrderUpdate, onMessageUpdate])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Reconnect when userId or isAdmin changes
  useEffect(() => {
    if (socketRef.current?.connected) {
      disconnect()
      setTimeout(connect, 100)
    }
  }, [userId, isAdmin, connect, disconnect])

  return {
    isConnected: socketRef.current?.connected || false,
    reconnect: connect,
    disconnect
  }
}