'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast-custom'
import { CheckCircle, XCircle, AlertCircle, Info, Sparkles } from 'lucide-react'

export default function TestToastPage() {
  const [showAll, setShowAll] = useState(false)

  const showAllToasts = () => {
    // Limpiar todos los toasts existentes
    toast.dismiss()
    
    // Mostrar todos los tipos de toast con diferentes mensajes
    setTimeout(() => {
      toast.success('¡Operación completada con éxito!')
    }, 100)

    setTimeout(() => {
      toast.error('Ha ocurrido un error inesperado')
    }, 300)

    setTimeout(() => {
      toast.warning('Advertencia: Revisa la configuración')
    }, 500)

    setTimeout(() => {
      toast.info('Información importante del sistema')
    }, 700)

    setShowAll(true)
  }

  const clearAllToasts = () => {
    toast.dismiss()
    setShowAll(false)
  }

  const showToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: '¡Todo ha salido perfectamente bien!',
      error: 'Algo ha salido mal, intenta de nuevo',
      warning: 'Ten cuidado con esta acción',
      info: 'Este es un mensaje normal'
    }
    
    toast[type](messages[type])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            Test de Notificaciones
          </h1>
          <p className="text-gray-300 text-lg">
            Prueba y ajusta el diseño de las notificaciones en tiempo real
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Control Principal */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Control Principal
              </CardTitle>
              <CardDescription className="text-gray-400">
                Muestra todas las notificaciones a la vez
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={showAllToasts}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
                size="lg"
              >
                Mostrar Todas las Notificaciones
              </Button>
              <Button 
                onClick={clearAllToasts}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Limpiar Todas
              </Button>
            </CardContent>
          </Card>

          {/* Control Individual */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Notificaciones Individuales</CardTitle>
              <CardDescription className="text-gray-400">
                Prueba cada tipo por separado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={() => showToast('success')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Success
              </Button>
              <Button 
                onClick={() => showToast('error')}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Error
              </Button>
              <Button 
                onClick={() => showToast('warning')}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Warning
              </Button>
              <Button 
                onClick={() => showToast('info')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Info className="w-4 h-4 mr-2" />
                Info
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Información */}
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">🎨 Características Actuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-300">Colores vibrantes con opacidad 0.85</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-300">Posicionamiento top-center</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-300">Sin botón de cerrar</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-300">Animación elástica</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-300">Iconos blancos con sombra</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                  <span className="text-gray-300">Gradientes y blur effects</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {showAll && (
          <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
            <p className="text-yellow-300 text-center">
              ✨ Todas las notificaciones están visibles arriba. Ajusta los colores y estilos mientras las ves.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}