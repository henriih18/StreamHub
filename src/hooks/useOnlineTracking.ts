'use client'

import { useEffect, useRef } from 'react'

interface OnlineTrackingOptions {
  userId?: string
  enabled?: boolean
  updateInterval?: number
}

export function useOnlineTracking(options: OnlineTrackingOptions = {}) {
  const {
    userId,
    enabled = true,
    updateInterval = 30000 // 30 segundos
  } = options

  const sessionIdRef = useRef<string>('')
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!enabled) return

    // Generar o recuperar ID de sesión
    sessionIdRef.current = sessionStorage.getItem('onlineSessionId') || 
                         `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    sessionStorage.setItem('onlineSessionId', sessionIdRef.current)

    // Función para actualizar estado en línea
    const updateOnlineStatus = async () => {
      try {
        await fetch('/api/admin/online-users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId || 'anonymous',
            sessionId: sessionIdRef.current,
            page: window.location.pathname,
            userAgent: navigator.userAgent
          }),
        })
      } catch (error) {
        console.error('Error updating online status:', error)
      }
    }

    // Registrar usuario como en línea inmediatamente
    updateOnlineStatus()

    // Configurar actualizaciones periódicas
    intervalRef.current = setInterval(updateOnlineStatus, updateInterval)

    // Limpiar cuando el usuario se va
    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        navigator.sendBeacon('/api/admin/online-users', JSON.stringify({
          sessionId: sessionIdRef.current
        }))
      }
    }

    // Detectar cuando la pestaña se vuelve visible/invisible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateOnlineStatus()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      // Eliminar usuario de la lista de en línea
      if (sessionIdRef.current) {
        fetch('/api/admin/online-users', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sessionIdRef.current
          }),
        }).catch(() => {
          // Ignorar errores en cleanup
        })
      }

      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, userId, updateInterval])

  return {
    sessionId: sessionIdRef.current
  }
}