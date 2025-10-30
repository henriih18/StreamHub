'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Calendar, Mail, Shield } from 'lucide-react'

interface UserProfileCardProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    memberSince: string
    avatar?: string
  }
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <Card className="bg-slate-900/90 border-purple-500/20 backdrop-blur-sm">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-white">
              Usuário
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-800/20"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* User Details */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-lg font-semibold text-white">
                {user.name}
              </h4>
              <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/30">
                Administrador
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-300">
                <Mail className="w-4 h-4" />
                <span className="text-sm">
                  {user.email}
                </span>
              </div>

              <div className="flex items-center gap-2 text-purple-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Miembro desde {user.memberSince}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Role Badge */}
        <div className="mt-6 p-4 bg-purple-900/20 rounded-lg border border-purple-600/30">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-purple-200 font-medium">
                Nivel de Acceso
              </div>
              <div className="text-purple-300 text-sm">
                Acceso completo a todas las funciones administrativas
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-purple-500/30 text-purple-300 hover:bg-purple-800/30 flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar Perfil
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="border-purple-500/30 text-purple-300 hover:bg-purple-800/30 flex-1"
          >
            <Shield className="w-4 h-4 mr-2" />
            Configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}