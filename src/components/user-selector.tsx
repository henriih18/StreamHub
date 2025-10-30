'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { User, Mail } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  ordersCount: number
  avatar?: string
}

interface UserSelectorProps {
  users: User[]
  onSelectionChange: (selectedUsers: string[]) => void
  selectedUsers: string[]
}

export function UserSelector({ users, onSelectionChange, selectedUsers }: UserSelectorProps) {
  const handleUserToggle = (userId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedUsers, userId])
    } else {
      onSelectionChange(selectedUsers.filter(id => id !== userId))
    }
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(users.map(user => user.id))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Seleccionar Usuarios
          </h1>
          <p className="text-slate-400">
            {selectedUsers.length} usuarios seleccionados
          </p>
        </div>

        {/* Select All Button */}
        <div className="mb-6 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleSelectAll}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {selectedUsers.length === users.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </Button>
          
          <Badge variant="secondary" className="bg-slate-700 text-slate-300">
            {users.length} usuarios totales
          </Badge>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <Checkbox
                      id={user.id}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={(checked) => handleUserToggle(user.id, checked as boolean)}
                      className="w-5 h-5 border-slate-600"
                    />
                    
                    {/* User Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    
                    {/* User Info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-medium">{user.name}</h3>
                        {user.role === 'ADMIN' && (
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Orders Count */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">
                      {user.ordersCount}
                    </div>
                    <div className="text-xs text-slate-400">
                      pedidos
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {users.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay usuarios disponibles
            </h3>
            <p className="text-slate-400">
              No se encontraron usuarios para mostrar.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {selectedUsers.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            <Button
              onClick={() => onSelectionChange([])}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Limpiar selección
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Continuar con {selectedUsers.length} usuario{selectedUsers.length !== 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}