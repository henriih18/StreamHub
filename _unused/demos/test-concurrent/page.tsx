'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Play, Settings, Trash2, CheckCircle, XCircle, Users } from 'lucide-react'

interface TestResult {
  totalUsers: number
  executionTime: string
  successful: number
  failed: number
  details: Array<{
    userId: string
    userName: string
    success: boolean
    status?: number
    result?: any
    error?: string
    timestamp: number
  }>
  databaseState: {
    targetAccount: string
    saleType: string
    finalAccountStock: number
    finalProfileStock: number
    ordersCreated: number
  }
}

interface TestSummary {
  noDuplicateSales: boolean
  allUsersProcessed: boolean
  dataIntegrity: string
}

export default function ConcurrentTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentAction, setCurrentAction] = useState<'setup' | 'run' | 'cleanup' | null>(null)
  const [testResult, setTestResult] = useState<{ testResults: TestResult; summary: TestSummary } | null>(null)
  const [status, setStatus] = useState<any>(null)

  const executeTest = async (action: 'setup' | 'run' | 'cleanup') => {
    setIsLoading(true)
    setCurrentAction(action)
    
    try {
      const response = await fetch('/api/test-concurrent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      const result = await response.json()

      if (action === 'run') {
        setTestResult(result)
      } else if (action === 'setup') {
        await fetchStatus()
      }

      console.log(`${action} result:`, result)
    } catch (error) {
      console.error('Test error:', error)
    } finally {
      setIsLoading(false)
      setCurrentAction(null)
    }
  }

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/test-concurrent?action=status')
      const statusData = await response.json()
      setStatus(statusData)
    } catch (error) {
      console.error('Status error:', error)
    }
  }

  const getStatusColor = (ready: boolean) => {
    return ready ? 'bg-green-500' : 'bg-red-500'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2 mb-4">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300 text-sm font-medium">Prueba de Concurrencia</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Test de Compras Simultáneas</h1>
          <p className="text-gray-400">Valida el sistema con 15 usuarios comprando al mismo tiempo</p>
        </div>

        {/* Status Card */}
        {status && (
          <Card className="mb-6 bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(status.readyForTest)}`} />
                Estado del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-400">{status.testUsersExist}</div>
                  <div className="text-sm text-gray-400">Usuarios de Prueba</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{status.availableAccounts}</div>
                  <div className="text-sm text-gray-400">Cuentas Disponibles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{status.availableProfiles}</div>
                  <div className="text-sm text-gray-400">Perfiles Disponibles</div>
                </div>
                <div className="text-center">
                  <Badge variant={status.readyForTest ? "default" : "destructive"}>
                    {status.readyForTest ? "Listo para Test" : "Configurar Requerido"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Control Panel */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Panel de Control</CardTitle>
            <CardDescription>Ejecuta la prueba paso a paso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => executeTest('setup')}
                disabled={isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isLoading && currentAction === 'setup' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
                1. Configurar Entorno
              </Button>

              <Button
                onClick={() => executeTest('run')}
                disabled={isLoading || !status?.readyForTest}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading && currentAction === 'run' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                2. Ejecutar Test (15 usuarios)
              </Button>

              <Button
                onClick={() => executeTest('cleanup')}
                disabled={isLoading}
                variant="destructive"
                className="flex items-center gap-2"
              >
                {isLoading && currentAction === 'cleanup' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                3. Limpiar Datos
              </Button>

              <Button
                onClick={fetchStatus}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Actualizar Estado
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {testResult && (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Resultados de la Prueba</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-400">{testResult.testResults.successful}</div>
                    <div className="text-sm text-gray-400">Compras Exitosas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-400">{testResult.testResults.failed}</div>
                    <div className="text-sm text-gray-400">Compras Fallidas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">{testResult.testResults.executionTime}</div>
                    <div className="text-sm text-gray-400">Tiempo de Ejecución</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">{testResult.testResults.databaseState.ordersCreated}</div>
                    <div className="text-sm text-gray-400">Órdenes Creadas</div>
                  </div>
                </div>

                {/* Validation Results */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {testResult.summary.noDuplicateSales ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-white">
                      Sin Ventas Duplicadas: {testResult.summary.noDuplicateSales ? '✅ PASADO' : '❌ FALLADO'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {testResult.summary.allUsersProcessed ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="text-white">
                      Todos los Usuarios Procesados: {testResult.summary.allUsersProcessed ? '✅ PASADO' : '❌ FALLADO'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      testResult.summary.dataIntegrity.includes('PASSED') ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                      {testResult.summary.dataIntegrity.includes('PASSED') ? '✓' : '✗'}
                    </div>
                    <span className="text-white">
                      Integridad de Datos: {testResult.summary.dataIntegrity}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database State */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Estado de la Base de Datos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Cuenta Objetivo</h4>
                    <p className="text-white font-medium">{testResult.testResults.databaseState.targetAccount}</p>
                    <p className="text-sm text-gray-400">Tipo: {testResult.testResults.databaseState.saleType}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Inventario Final</h4>
                    <p className="text-white">Cuentas disponibles: {testResult.testResults.databaseState.finalAccountStock}</p>
                    <p className="text-white">Perfiles disponibles: {testResult.testResults.databaseState.finalProfileStock}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Resultados Detallados por Usuario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {testResult.testResults.details.map((detail, index) => (
                    <div
                      key={detail.userId}
                      className={`p-3 rounded-lg border ${
                        detail.success 
                          ? 'bg-green-900/20 border-green-700/50' 
                          : 'bg-red-900/20 border-red-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {detail.success ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className="text-white font-medium">{detail.userName}</span>
                          <Badge variant={detail.success ? "default" : "destructive"}>
                            {detail.success ? 'ÉXITO' : 'FALLO'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400">
                          {detail.status && `Status: ${detail.status}`}
                        </div>
                      </div>
                      {detail.error && (
                        <p className="text-red-400 text-sm mt-1">Error: {detail.error}</p>
                      )}
                      {detail.result?.message && (
                        <p className="text-green-400 text-sm mt-1">{detail.result.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}