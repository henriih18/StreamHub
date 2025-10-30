'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Users, Check } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
  ordersCount: number
  memberSince: string
}

interface UserSelectionPanelProps {
  users: User[]
  onSelectionChange: (selectedUsers: string[]) => void
  selectedUsers: string[]
}

export function UserSelectionPanel({ 
  users, 
  onSelectionChange, 
  selectedUsers 
}: UserSelectionPanelProps) {
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
    <Card className="bg-slate-900/90 border-purple-500/20 backdrop-blur-sm">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">
                Seleccionar Usuarios
              </h3>
              <p className="text-purple-300 text-sm">
                Elige los usuarios a los que deseas asignar cuentas
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="border-purple-500/30 text-purple-300 hover:bg-purple-800/30"
          >
            {selectedUsers.length === users.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
          </Button>
        </div>

        {/* Users List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {users.map((user) => {
            const isSelected = selectedUsers.includes(user.id)
            
            return (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                  isSelected 
                    ? 'bg-purple-900/30 border-purple-500/40' 
                    : 'bg-slate-800/30 border-purple-500/20 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    id={user.id}
                    checked={isSelected}
                    onCheckedChange={(checked) => handleUserToggle(user.id, checked as boolean)}
                    className="w-5 h-5 border-purple-500/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium">
                          {user.name}
                        </h4>
                        {user.role === 'admin' && (
                          <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/30 text-xs">
                            Administrador
                          </Badge>
                        )}
                      </div>
                      <p className="text-purple-300 text-sm">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-white font-medium">
                    {user.ordersCount} pedidos
                  </div>
                  <div className="text-purple-400 text-xs">
                    Miembro desde {user.memberSince}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="text-purple-300">
              <span className="font-medium text-white">
                {selectedUsers.length}
              </span>
              {' '}usuarios seleccionados
            </div>
            
            <Button
              disabled={selectedUsers.length === 0}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar Selección
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}