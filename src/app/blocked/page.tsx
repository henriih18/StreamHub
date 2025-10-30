'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Lock, Mail, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function BlockedPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [reason, setReason] = useState('')

  useEffect(() => {
    const reasonParam = searchParams.get('reason')
    if (reasonParam) {
      setReason(decodeURIComponent(reasonParam))
    }
  }, [searchParams])

  const handleLogout = async () => {
    try {
      // Limpiar cookie de autenticación
      document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800/50 backdrop-blur-sm border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Cuenta Bloqueada
          </CardTitle>
          <CardDescription className="text-gray-300">
            Tu cuenta ha sido temporalmente restringida
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alerta con el motivo del bloqueo */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-red-400 font-medium mb-1">Motivo del bloqueo:</h4>
                <p className="text-gray-300 text-sm">
                  {reason || 'Tu cuenta está temporalmente restringida. Contacta con soporte para más información.'}
                </p>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>No puedes realizar compras mientras tu cuenta esté bloqueada</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>El acceso a ciertas funciones puede estar limitado</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Contáctanos para resolver esta situación</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.location.href = 'mailto:soporte@streamhub.com'}
            >
              <Mail className="w-4 h-4 mr-2" />
              Contactar Soporte
            </Button>

            <Button 
              variant="outline" 
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => window.location.href = 'https://wa.me/1234567890'}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>

            <Button 
              variant="ghost" 
              className="w-full text-gray-400 hover:text-white hover:bg-gray-700"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </div>

          {/* Enlace a términos */}
          <div className="text-center text-xs text-gray-500">
            <p>
              Al contactar soporte, ten a mano tu información de cuenta.
              <br />
              Revisa nuestros{' '}
              <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline">
                Términos y Condiciones
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}