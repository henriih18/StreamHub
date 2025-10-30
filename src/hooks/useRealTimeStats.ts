'use client'

import { useEffect, useState, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

interface RealTimeStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  activeUsers: number
  totalCredits: number
  conversionRate: number
  onlineUsers: {
    current: number
    peakToday: number
    averageToday: number
  }
  pagePerformance: {
    loadTime: number
    responseTime: number
    uptime: number
    performanceScore: number
  }
  totalStock: number
  recentActivity: Array<{
    type: string
    description: string
    time: string
    icon: string
  }>
  timestamp: string
}

export function useRealTimeStats() {
  const [stats, setStats] = useState<RealTimeStats | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    const socket = io('/api/socketio', {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    })

    socketRef.current = socket

    // Connection events
    socket.on('connect', () => {
      // console.log('Connected to WebSocket server')
      setIsConnected(true)
      
      // Request initial stats
      socket.emit('request-stats')
    })

    socket.on('disconnect', () => {
      // console.log('Disconnected from WebSocket server')
      setIsConnected(false)
    })

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      setIsConnected(false)
    })

    // Stats update event
    socket.on('stats-update', (newStats: RealTimeStats) => {
      setStats(newStats)
      setLastUpdate(new Date())
    })

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  // Manual refresh function
  const refreshStats = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('request-stats')
    }
  }

  return {
    stats,
    isConnected,
    lastUpdate,
    refreshStats
  }
}