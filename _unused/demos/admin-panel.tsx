'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Users, ShoppingCart, DollarSign, Package, Eye, Edit, Trash2, Plus, 
  TrendingUp, CreditCard, UserPlus, BarChart3, PieChart, Activity,
  Settings, LogOut, Search, Filter, Download, RefreshCw, Send
} from 'lucide-react'

interface Order {
  id: string
  userId: string
  streamingAccountId: string
  status: string
  totalPrice: number
  createdAt: string
  user: {
    email: string
    name?: string
  }
  streamingAccount: {
    name: string
    type: string
  }
}

interface StreamingAccount {
  id: string
  name: string
  type: string
  price: number
  isActive: boolean
  saleType: string
  email?: string
  password?: string
  maxProfiles?: number
  pricePerProfile?: number
  orders: Array<{
    id: string
    status: string
  }>
}

interface User {
  id: string
  email: string
  name?: string
  credits: number
  role: string
  createdAt: string
}

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [accounts, setAccounts] = useState<StreamingAccount[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false)
  const [isRechargeCreditsOpen, setIsRechargeCreditsOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Form states
  const [newAccount, setNewAccount] = useState({
    name: '',
    description: '',
    price: '',
    type: '',
    duration: '1 mes',
    quality: 'HD',
    screens: '1',
    saleType: 'FULL',
    maxProfiles: '',
    pricePerProfile: '',
    email: '',
    password: ''
  })

  const [creditRecharge, setCreditRecharge] = useState({
    userId: '',
    amount: '',
    method: 'Transferencia',
    reference: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersResponse, accountsResponse, usersResponse] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/streaming-accounts'),
        fetch('/api/admin/users')
      ])

      if (ordersResponse.ok && accountsResponse.ok && usersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const accountsData = await accountsResponse.json()
        const usersData = await usersResponse.json()
        setOrders(ordersData)
        setAccounts(accountsData)
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async () => {
    try {
      const response = await fetch('/api/streaming-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      })

      if (response.ok) {
        setIsCreateAccountOpen(false)
        setNewAccount({
          name: '',
          description: '',
          price: '',
          type: '',
          duration: '1 mes',
          quality: 'HD',
          screens: '1',
          saleType: 'FULL',
          maxProfiles: '',
          pricePerProfile: '',
          email: '',
          password: ''
        })
        fetchData()
      }
    } catch (error) {
      console.error('Error creating account:', error)
    }
  }

  const handleRechargeCredits = async () => {
    try {
      const response = await fetch('/api/admin/credit-recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creditRecharge)
      })

      if (response.ok) {
        setIsRechargeCreditsOpen(false)
        setCreditRecharge({
          userId: '',
          amount: '',
          method: 'Transferencia',
          reference: ''
        })
        setSelectedUser(null)
        fetchData()
      }
    } catch (error) {
      console.error('Error recharging credits:', error)
    }
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0)
  const totalOrders = orders.length
  const totalAccounts = accounts.length
  const activeAccounts = accounts.filter(acc => acc.isActive).length
  const totalUsers = users.length
  const totalCredits = users.reduce((sum, user) => sum + user.credits, 0)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'EXPIRED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white rounded-xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Panel de Administración
              </h2>
              <p className="text-sm text-gray-400">Gestiona tu plataforma de streaming</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-5 bg-gray-800 border border-gray-700">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Resumen
                  </TabsTrigger>
                  <TabsTrigger value="accounts" className="data-[state=active]:bg-purple-600">
                    <Package className="h-4 w-4 mr-2" />
                    Cuentas
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="data-[state=active]:bg-purple-600">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Pedidos
                  </TabsTrigger>
                  <TabsTrigger value="users" className="data-[state=active]:bg-purple-600">
                    <Users className="h-4 w-4 mr-2" />
                    Usuarios
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
                    <PieChart className="h-4 w-4 mr-2" />
                    Estadísticas
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Ingresos Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-400">${totalRevenue.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</div>
                        <p className="text-xs text-gray-500 mt-1">+12% vs mes anterior</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Total Pedidos</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-400">{totalOrders}</div>
                        <p className="text-xs text-gray-500 mt-1">+8% vs mes anterior</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Cuentas Activas</CardTitle>
                        <Package className="h-4 w-4 text-purple-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-400">{activeAccounts}/{totalAccounts}</div>
                        <p className="text-xs text-gray-500 mt-1">{Math.round((activeAccounts/totalAccounts)*100)}% activas</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-400">Usuarios Totales</CardTitle>
                        <Users className="h-4 w-4 text-orange-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-400">{totalUsers}</div>
                        <p className="text-xs text-gray-500 mt-1">+15% vs mes anterior</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="bg-purple-600/20 p-2 rounded-lg">
                                <ShoppingCart className="h-4 w-4 text-purple-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white">{order.streamingAccount.name}</p>
                                <p className="text-sm text-gray-400">{order.user.name || order.user.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-400">${order.totalPrice.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Accounts Tab */}
                <TabsContent value="accounts" className="space-y-6 mt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Gestión de Cuentas</h3>
                    <Dialog open={isCreateAccountOpen} onOpenChange={setIsCreateAccountOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Nueva Cuenta
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Crear Nueva Cuenta de Streaming</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                              id="name"
                              value={newAccount.name}
                              onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          <div>
                            <Label htmlFor="type">Tipo</Label>
                            <Select value={newAccount.type} onValueChange={(value) => setNewAccount({...newAccount, type: value})}>
                              <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Netflix">Netflix</SelectItem>
                                <SelectItem value="Disney+">Disney+</SelectItem>
                                <SelectItem value="HBO Max">HBO Max</SelectItem>
                                <SelectItem value="Amazon Prime">Amazon Prime</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                              id="description"
                              value={newAccount.description}
                              onChange={(e) => setNewAccount({...newAccount, description: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          <div>
                            <Label htmlFor="price">Precio</Label>
                            <Input
                              id="price"
                              type="number"
                              value={newAccount.price}
                              onChange={(e) => setNewAccount({...newAccount, price: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          <div>
                            <Label htmlFor="saleType">Tipo de Venta</Label>
                            <Select value={newAccount.saleType} onValueChange={(value) => setNewAccount({...newAccount, saleType: value})}>
                              <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="FULL">Cuenta Completa</SelectItem>
                                <SelectItem value="PROFILES">Por Perfiles</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="duration">Duración</Label>
                            <Input
                              id="duration"
                              value={newAccount.duration}
                              onChange={(e) => setNewAccount({...newAccount, duration: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          <div>
                            <Label htmlFor="quality">Calidad</Label>
                            <Select value={newAccount.quality} onValueChange={(value) => setNewAccount({...newAccount, quality: value})}>
                              <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="HD">HD</SelectItem>
                                <SelectItem value="4K">4K</SelectItem>
                                <SelectItem value="4K HDR">4K HDR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="screens">Pantallas</Label>
                            <Input
                              id="screens"
                              type="number"
                              value={newAccount.screens}
                              onChange={(e) => setNewAccount({...newAccount, screens: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={newAccount.email}
                              onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          <div>
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                              id="password"
                              type="password"
                              value={newAccount.password}
                              onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          {newAccount.saleType === 'PROFILES' && (
                            <>
                              <div>
                                <Label htmlFor="maxProfiles">Máximos Perfiles</Label>
                                <Input
                                  id="maxProfiles"
                                  type="number"
                                  value={newAccount.maxProfiles}
                                  onChange={(e) => setNewAccount({...newAccount, maxProfiles: e.target.value})}
                                  className="bg-gray-700 border-gray-600"
                                />
                              </div>
                              <div>
                                <Label htmlFor="pricePerProfile">Precio por Perfil</Label>
                                <Input
                                  id="pricePerProfile"
                                  type="number"
                                  value={newAccount.pricePerProfile}
                                  onChange={(e) => setNewAccount({...newAccount, pricePerProfile: e.target.value})}
                                  className="bg-gray-700 border-gray-600"
                                />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                          <Button variant="outline" onClick={() => setIsCreateAccountOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleCreateAccount} className="bg-gradient-to-r from-purple-600 to-pink-600">
                            Crear Cuenta
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid gap-4">
                    {accounts.map((account) => (
                      <Card key={account.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-semibold text-white">{account.name}</h4>
                                <Badge variant={account.isActive ? "default" : "secondary"} className="bg-green-600/20 text-green-400 border-green-600/30">
                                  {account.isActive ? 'Activa' : 'Inactiva'}
                                </Badge>
                                <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">
                                  {account.saleType === 'PROFILES' ? 'Por Perfiles' : 'Cuenta Completa'}
                                </Badge>
                              </div>
                              <p className="text-gray-400 mb-3">{account.type}</p>
                              <div className="flex items-center space-x-6 text-sm">
                                <span className="text-gray-300">Precio: <span className="text-green-400 font-semibold">${account.price}</span></span>
                                <span className="text-gray-300">Pedidos: <span className="text-blue-400 font-semibold">{account.orders.length}</span></span>
                                {account.email && <span className="text-gray-300">Email: {account.email}</span>}
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white px-2 py-1 text-xs h-8 min-w-0 flex-shrink-0" title="Ver detalles">
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline ml-1">Ver</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white px-2 py-1 text-xs h-8 min-w-0 flex-shrink-0" title="Editar">
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline ml-1">Editar</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300 px-2 py-1 text-xs h-8 min-w-0 flex-shrink-0" title="Eliminar">
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline ml-1">Eliminar</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-6 mt-6">
                  {/* User List First */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Gestión de Usuarios</h3>
                    <div className="grid gap-4">
                      {filteredUsers.map((user) => (
                        <Card key={user.id} className="bg-gray-800 border-gray-700">
                          <CardContent className="p-4 sm:p-6">
                            {/* User Info */}
                            <div className="mb-4">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-semibold text-white truncate">{user.name || user.email}</h4>
                                <Badge className={user.role === 'ADMIN' ? 'bg-red-600/20 text-red-400 border-red-600/30' : 'bg-blue-600/20 text-blue-400 border-blue-600/30'}>
                                  {user.role}
                                </Badge>
                              </div>
                              <p className="text-gray-400 mb-3 text-sm truncate">{user.email}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm">
                                <span className="text-gray-300">Créditos: <span className="text-green-400 font-semibold">${user.credits}</span></span>
                                <span className="text-gray-300">Registrado: {new Date(user.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            
                            {/* Action Buttons - Responsive Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-400 hover:text-green-300 px-3 py-2 text-xs h-9 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 justify-start"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setCreditRecharge({...creditRecharge, userId: user.id})
                                  setIsRechargeCreditsOpen(true)
                                }}
                              >
                                <CreditCard className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="truncate">Recargar</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-400 hover:text-white px-3 py-2 text-xs h-9 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 justify-start"
                              >
                                <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="truncate">Detalles</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-400 hover:text-red-300 px-3 py-2 text-xs h-9 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 justify-start"
                              >
                                <Settings className="h-4 w-4 mr-2 flex-shrink-0" />
                                <span className="truncate">Permisos</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Controls Section Below */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4 sm:p-6">
                      {/* Search - Full width on all devices */}
                      <div className="relative w-full mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Buscar usuarios..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-gray-700 border-gray-600 text-white w-full"
                        />
                      </div>
                      
                      {/* Action Buttons - Stacked on mobile */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        <Dialog open={isRechargeCreditsOpen} onOpenChange={setIsRechargeCreditsOpen}>
                          <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 w-full text-sm h-10 px-3">
                              <CreditCard className="h-4 w-4 mr-2 flex-shrink-0" />
                              <span className="truncate">Recargar Créditos</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md mx-4 w-[95vw] max-h-[90vh] overflow-hidden">
                            <DialogHeader>
                              <DialogTitle className="text-lg">Recargar Créditos</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[70vh]">
                              <div className="space-y-4 pr-4">
                                <div>
                                  <Label htmlFor="userSelect" className="text-sm">Usuario</Label>
                                  <Select value={creditRecharge.userId} onValueChange={(value) => setCreditRecharge({...creditRecharge, userId: value})}>
                                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                      <SelectValue placeholder="Seleccionar usuario" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-700 border-gray-600 max-h-60">
                                      {users.map((user) => (
                                        <SelectItem key={user.id} value={user.id} className="text-white">
                                          {user.name || user.email} - ${user.credits} créditos
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="amount" className="text-sm">Monto</Label>
                                  <Input
                                    id="amount"
                                    type="number"
                                    value={creditRecharge.amount}
                                    onChange={(e) => setCreditRecharge({...creditRecharge, amount: e.target.value})}
                                    className="bg-gray-700 border-gray-600 text-white"
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="method" className="text-sm">Método</Label>
                                  <Select value={creditRecharge.method} onValueChange={(value) => setCreditRecharge({...creditRecharge, method: value})}>
                                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-700 border-gray-600">
                                      <SelectItem value="Transferencia" className="text-white">Transferencia</SelectItem>
                                      <SelectItem value="Billetera digital" className="text-white">Billetera digital</SelectItem>
                                      <SelectItem value="Tarjeta" className="text-white">Tarjeta</SelectItem>
                                      <SelectItem value="Efectivo" className="text-white">Efectivo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="reference" className="text-sm">Referencia (opcional)</Label>
                                  <Input
                                    id="reference"
                                    value={creditRecharge.reference}
                                    onChange={(e) => setCreditRecharge({...creditRecharge, reference: e.target.value})}
                                    className="bg-gray-700 border-gray-600 text-white"
                                    placeholder="Número de referencia"
                                  />
                                </div>
                              </div>
                            </ScrollArea>
                            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-700">
                              <Button variant="outline" onClick={() => setIsRechargeCreditsOpen(false)} className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                                Cancelar
                              </Button>
                              <Button onClick={handleRechargeCredits} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                                Recargar Créditos
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 w-full text-sm h-10 px-3">
                          <RefreshCw className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Actualizar Total</span>
                        </Button>

                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full text-sm h-10 px-3">
                          <Send className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Enviar Mensajes</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="space-y-6 mt-6">
                  <h3 className="text-xl font-bold text-white">Pedidos Recientes</h3>
                  <div className="grid gap-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="text-lg font-semibold text-white">{order.streamingAccount.name}</h4>
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-gray-400 mb-3">{order.user.name || order.user.email} • {order.streamingAccount.type}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-green-400">${order.totalPrice.toFixed(2)}</p>
                              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mt-2">
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white px-2 py-1 text-xs h-8 min-w-0 flex-shrink-0" title="Ver detalles">
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="hidden sm:inline ml-1">Ver</span>
                                </Button>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white px-2 py-1 text-xs h-8 min-w-0 flex-shrink-0" title="Descargar">
                                  <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="hidden sm:inline ml-1">Descargar</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6 mt-6">
                  <h3 className="text-xl font-bold text-white">Estadísticas y Análisis</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Distribución de Ventas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {['Netflix', 'Disney+', 'HBO Max', 'Amazon Prime'].map((service, index) => {
                            const percentage = Math.random() * 40 + 10
                            return (
                              <div key={service} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-300">{service}</span>
                                  <span className="text-purple-400">{percentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Métricas Clave</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                            <span className="text-gray-300">Valor Promedio de Pedido</span>
                            <span className="text-green-400 font-bold">${(totalRevenue / totalOrders || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                            <span className="text-gray-300">Créditos Totales en Sistema</span>
                            <span className="text-blue-400 font-bold">${totalCredits.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                            <span className="text-gray-300">Tasa de Conversión</span>
                            <span className="text-purple-400 font-bold">24.5%</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-700/50 rounded-lg">
                            <span className="text-gray-300">Usuarios Activos Hoy</span>
                            <span className="text-orange-400 font-bold">127</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}