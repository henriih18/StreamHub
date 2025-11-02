import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { userCache } from '@/lib/cache'
import { createDynamicJsonResponse } from '@/lib/compression'

export async function GET(request: NextRequest) {
  try {
    const cacheKey = 'admin:performance:metrics'
    let performanceMetrics = userCache.get(cacheKey)
    
    if (!performanceMetrics) {
      // Obtener métricas básicas del sistema
      const startTime = Date.now()
      
      // Simular métricas de rendimiento
      // En un entorno real, estas métricas vendrían de sistemas de monitoreo
      performanceMetrics = {
        // Tiempo de respuesta del servidor
        responseTime: Date.now() - startTime,
        
        // Métricas simuladas de rendimiento
        loadTime: Math.random() * 500 + 200, // 200-700ms
        uptime: 99.9, // Simulación de uptime
        performanceScore: Math.floor(Math.random() * 10) + 90, // 90-100
        
        // Métricas de base de datos
        dbConnections: 5, // Simulación
        dbQueryTime: Math.random() * 50 + 10, // 10-60ms
        
        // Métricas de memoria (simuladas)
        memoryUsage: Math.random() * 100 + 50, // MB
        memoryTotal: 512, // MB
        
        // Métricas de CPU (simuladas)
        cpuUsage: Math.random() * 30 + 10, // 10-40%
        
        // Timestamp
        timestamp: new Date().toISOString()
      }
      
      // Cache for 2 minutes - performance metrics change frequently
      userCache.set(cacheKey, performanceMetrics, 2 * 60 * 1000)
    }
    
    return createDynamicJsonResponse(performanceMetrics)
    
  } catch (error) {
    //console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { error: 'Error al obtener las métricas de rendimiento' },
      { status: 500 }
    )
  }
}