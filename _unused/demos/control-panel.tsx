'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Star, 
  Zap, 
  Shield,
  Activity,
  TrendingUp,
  Eye,
  Settings,
  LogOut,
  User,
  Mail,
  Calendar
} from 'lucide-react'

interface ControlPanelProps {
  user?: {
    id: string
    name: string
    email: string
    role: string
    memberSince: string
    avatar?: string
  }
  stats?: {
    activeUsers: number
    rating: number
    uptime: number
    support: string
  }
}

export function ControlPanel({ user, stats }: ControlPanelProps) {
  const defaultStats = {
    activeUsers: 50000,
    rating: 4.9,
    uptime: 100,
    support: '24/7'
  }

  const panelStats = stats || defaultStats

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-6">
            <Activity className="w-4 h-4 mr-2" />
            Panel de Streaming Activo
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
            Panel de Control
            <span className="block text-emerald-400 text-4xl md:text-6xl">
              Streaming Premium
            </span>
          </h1>
          
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-12">
            Gestiona y accede a todas tus cuentas de streaming desde un único panel
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {(panelStats.activeUsers / 1000).toFixed(0)}K+
              </div>
              <div className="text-white/70 text-sm">Usuarios Activos</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {panelStats.rating}
              </div>
              <div className="text-white/70 text-sm">Rating</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {panelStats.uptime}%
              </div>
              <div className="text-white/70 text-sm">Uptime</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                {panelStats.support}
              </div>
              <div className="text-white/70 text-sm">Soporte</div>
            </CardContent>
          </Card>
        </div>

        {/* User Info Section */}
        {user && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-8">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Información del Usuario</h2>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                  {user.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-white/70 text-sm mb-1">Nombre</div>
                    <div className="text-white font-semibold text-lg">{user.name}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-white/70 text-sm mb-1">Correo Electrónico</div>
                    <div className="text-white font-semibold text-lg">{user.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-white/70 text-sm mb-1">Miembro desde</div>
                    <div className="text-white font-semibold text-lg">{user.memberSince}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="text-white/70 text-sm mb-1">Estado</div>
                    <div className="text-emerald-400 font-semibold text-lg">Activo</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg font-semibold">
            <Eye className="w-5 h-5 mr-2" />
            Ver Cuentas
          </Button>
          
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold">
            <Settings className="w-5 h-5 mr-2" />
            Configuración
          </Button>
          
          <Button variant="outline" className="border-red-500/50 text-red-300 hover:bg-red-500/10 px-8 py-4 text-lg font-semibold">
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Status Indicator */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-6 py-3">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-emerald-300 font-medium">Sistema En Línea - Todos los servicios operativos</span>
          </div>
        </div>
      </div>
    </div>
  )
}