"use client"

import { useState, useEffect } from 'react'
import Navigation from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Bell, Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  id: string
  title: string
  content: string
  type: 'GENERAL' | 'WARNING' | 'BLOCK_NOTICE' | 'UNBLOCK_NOTICE' | 'RESTRICTION_NOTICE' | 'SYSTEM_NOTIFICATION'
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    name: string | null
    email: string
    role: string
  }
}

export default function TestMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [apiResponse, setApiResponse] = useState<any>(null)

  useEffect(() => {
    testMessagesAPI()
  }, [])

  const testMessagesAPI = async () => {
    try {
      console.log('🔍 Testing messages API...')
      
      const response = await fetch('/api/messages')
      console.log('📡 API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📨 API Response data:', data)
        setApiResponse(data)
        setMessages(data.messages || [])
        toast.success(`✅ Cargados ${data.messages?.length || 0} mensajes (${data.unreadCount || 0} no leídos)`)
      } else {
        console.error('❌ API Error:', response.status, response.statusText)
        toast.error(`❌ Error ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.error('❌ Network Error:', error)
      toast.error('❌ Error de conexión al API')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      console.log('📝 Marking message as read:', messageId)
      
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      })
      
      console.log('📡 Mark as read response:', response.status)
      
      if (response.ok) {
        setMessages(messages.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        ))
        toast.success('✅ Mensaje marcado como leído')
        
        // Trigger navigation update
        window.dispatchEvent(new CustomEvent('messagesUpdated'))
      } else {
        toast.error('❌ Error al marcar como leído')
      }
    } catch (error) {
      console.error('❌ Error marking as read:', error)
      toast.error('❌ Error de conexión')
    }
  }

  const refreshMessages = () => {
    setLoading(true)
    testMessagesAPI()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Probando sistema de mensajes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">🧪 Test de Mensajes</h1>
          <p className="text-slate-400">Diagnóstico del sistema de mensajes</p>
        </div>

        {/* API Response Info */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Estado del API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${apiResponse ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-slate-300">
                  API: {apiResponse ? '✅ Conectado' : '❌ Error'}
                </span>
              </div>
              {apiResponse && (
                <>
                  <div className="text-slate-300">
                    Total mensajes: <span className="text-white font-bold">{apiResponse.messages?.length || 0}</span>
                  </div>
                  <div className="text-slate-300">
                    No leídos: <span className="text-red-400 font-bold">{apiResponse.unreadCount || 0}</span>
                  </div>
                </>
              )}
            </div>
            <Button onClick={refreshMessages} className="mt-4" variant="outline">
              🔄 Refrescar
            </Button>
          </CardContent>
        </Card>

        {/* Messages List */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mensajes ({messages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-500 opacity-50" />
                <p className="text-slate-400">No hay mensajes para mostrar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border transition-all ${
                      message.isRead 
                        ? 'bg-slate-700/30 border-slate-700/50' 
                        : 'bg-slate-700/50 border-slate-600/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-white font-medium">{message.title}</h3>
                          {!message.isRead && (
                            <Badge className="bg-blue-500 text-white text-xs">Nuevo</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {message.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-slate-400 text-sm mb-2">{message.content}</p>
                        <div className="text-slate-500 text-xs">
                          De: {message.sender.name || message.sender.email} • 
                          {new Date(message.createdAt).toLocaleDateString('es-CO')}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {!message.isRead && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRead(message.id)}
                            className="border-green-600 text-green-400 hover:bg-green-600/20"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}