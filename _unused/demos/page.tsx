'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UserSelectionPanel from '@/components/user-selection-panel'
import UserProfileCard from '@/components/user-profile-card'
import StreamingAccountsPanel from '@/components/streaming-accounts-panel'
import { 
  Users, 
  User, 
  Play, 
  Monitor,
  Eye,
  Settings,
  ShoppingCart
} from 'lucide-react'

export default function DemoPage() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Mock data for demonstration
  const mockUsers = [
    {
      id: '1',
      name: 'Admin',
      email: 'admin@streamhub.com',
      role: 'admin',
      ordersCount: 1,
      memberSince: '20/10/2025'
    },
    {
      id: '2',
      name: 'Test User',
      email: 'test@streamhub.com',
      role: 'user',
      ordersCount: 0,
      memberSince: '20/10/2025'
    }
  ]

  const mockCurrentUser = {
    id: '1',
    name: 'Admin',
    email: 'admin@streamhub.com',
    role: 'admin',
    memberSince: '20/10/2025'
  }

  const mockAccounts = [
    {
      id: '1',
      name: 'Netflix Premium',
      description: 'Acceso a HBO, Warner Bros y contenido exclusivo',
      price: 14999,
      type: 'Netflix',
      duration: '1 mes',
      quality: 'HD',
      screens: 1,
      inStock: false,
      stockCount: 0,
      saleType: 'FULL' as const
    },
    {
      id: '2',
      name: 'Disney+ Premium',
      description: 'Acceso a HBO, Warner Bros y contenido exclusivo',
      price: 10000,
      type: 'Disney+',
      duration: '1 mes',
      quality: 'HD',
      screens: 1,
      inStock: false,
      stockCount: 0,
      saleType: 'FULL' as const
    },
    {
      id: '3',
      name: 'HBO Max',
      description: 'Acceso a HBO, Warner Bros y contenido exclusivo',
      price: 14999,
      type: 'HBO Max',
      duration: '1 mes',
      quality: 'HD',
      screens: 3,
      inStock: false,
      stockCount: 0,
      saleType: 'FULL' as const
    },
    {
      id: '4',
      name: 'Amazon Prime Video',
      description: 'Miles de películas y series con Prime Originals',
      price: 8999,
      type: 'Amazon Prime',
      duration: '1 mes',
      quality: '4K',
      screens: 3,
      inStock: false,
      stockCount: 0,
      saleType: 'FULL' as const
    }
  ]

  const handleAddToCart = (accountId: string, quantity: number) => {
    console.log(`Adding ${quantity} of account ${accountId} to cart`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Demo de Componentes
          </h1>
          <p className="text-purple-200">
            Explora todos los componentes de la plataforma de streaming
          </p>
        </div>

        <Tabs defaultValue="selection" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-purple-900/20 border-purple-500/20">
            <TabsTrigger value="selection" className="data-[state=active]:bg-purple-600 text-white">
              <Users className="w-4 h-4 mr-2" />
              Selección
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-purple-600 text-white">
              <User className="w-4 h-4 mr-2" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="accounts" className="data-[state=active]:bg-purple-600 text-white">
              <Play className="w-4 h-4 mr-2" />
              Cuentas
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-600 text-white">
              <Monitor className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selection" className="mt-6">
            <UserSelectionPanel
              users={mockUsers}
              selectedUsers={selectedUsers}
              onSelectionChange={setSelectedUsers}
            />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <UserProfileCard user={mockCurrentUser} />
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="mt-6">
            <StreamingAccountsPanel
              accounts={mockAccounts}
              onAddToCart={handleAddToCart}
            />
          </TabsContent>

          <TabsContent value="dashboard" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-white/10 text-white border-white/20">
                      Activo
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">
                    50,000+
                  </div>
                  <div className="text-purple-200 font-medium mb-1">
                    Usuarios Activos
                  </div>
                  <div className="text-purple-300 text-sm">
                    Clientes satisfechos
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-white/10 text-white border-white/20">
                      Activo
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">
                    4.9
                  </div>
                  <div className="text-purple-200 font-medium mb-1">
                    Rating
                  </div>
                  <div className="text-purple-300 text-sm">
                    Calificación promedio
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                      <Settings className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-white/10 text-white border-white/20">
                      Activo
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">
                    100%
                  </div>
                  <div className="text-purple-200 font-medium mb-1">
                    Uptime
                  </div>
                  <div className="text-purple-300 text-sm">
                    Disponibilidad
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-white" />
                    </div>
                    <Badge className="bg-white/10 text-white border-white/20">
                      Activo
                    </Badge>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">
                    24/7
                  </div>
                  <div className="text-purple-200 font-medium mb-1">
                    Soporte
                  </div>
                  <div className="text-purple-300 text-sm">
                    Soporte continuo
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/30 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Eye className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ver Cuentas
                </h2>
                <p className="text-purple-200 mb-8 max-w-2xl mx-auto">
                  Accede a todas tus cuentas de streaming premium. Gestiona tus suscripciones, 
                  renueva servicios y disfruta del mejor contenido.
                </p>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Ver Todas mis Cuentas
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}