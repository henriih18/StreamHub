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
  Settings, LogOut, Search, Filter, Download, RefreshCw, Gift, History,
  Database, Key, Mail
} from 'lucide-react'
import { ProfitsCard } from '@/components/profits-card'

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
  maxProfiles?: number
  pricePerProfile?: number
  accountStocks: AccountStock[]
  profileStocks: AccountProfile[]
  orders: Array<{
    id: string
    status: string
  }>
}

interface AccountStock {
  id: string
  streamingAccountId: string
  email: string
  password: string
  isAvailable: boolean
  soldToUserId?: string
  soldAt?: string
  createdAt: string
}

interface AccountProfile {
  id: string
  streamingAccountId: string
  profileName: string
  profilePin?: string
  isAvailable: boolean
  soldToUserId?: string
  soldAt?: string
  createdAt: string
}

interface User {
  id: string
  email: string
  name?: string
  credits: number
  role: string
  createdAt: string
  totalSpent?: number
  targetSpent?: number
}

interface SpecialOffer {
  id: string
  userId: string
  streamingAccountId: string
  discountPercentage: number
  specialPrice?: number
  targetSpent: number
  expiresAt?: string
  isActive: boolean
  user: User
  streamingAccount: StreamingAccount
}

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminPanelCards({ isOpen, onClose }: AdminPanelProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [accounts, setAccounts] = useState<StreamingAccount[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<StreamingAccount | null>(null)

  // Dialog states
  const [isCreateCardOpen, setIsCreateCardOpen] = useState(false)
  const [isAddStockOpen, setIsAddStockOpen] = useState(false)
  const [isRechargeCreditsOpen, setIsRechargeCreditsOpen] = useState(false)
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false)
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false)
  const [isViewStockOpen, setIsViewStockOpen] = useState(false)

  // Form states
  const [newCard, setNewCard] = useState({
    name: '',
    description: '',
    price: '',
    type: '',
    duration: '1 mes',
    quality: 'HD',
    screens: '1',
    saleType: 'FULL',
    maxProfiles: '',
    pricePerProfile: ''
  })

  const [newStock, setNewStock] = useState({
    streamingAccountId: '',
    accounts: [] as Array<{ email: string; password: string }>,
    profiles: [] as Array<{ profileName: string; profilePin?: string }>
  })

  const [creditRecharge, setCreditRecharge] = useState({
    userId: '',
    amount: '',
    method: 'Transferencia',
    reference: ''
  })

  const [newOffer, setNewOffer] = useState({
    userId: '',
    streamingAccountId: '',
    discountPercentage: '',
    specialPrice: '',
    targetSpent: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersResponse, accountsResponse, usersResponse, offersResponse] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/streaming-accounts'),
        fetch('/api/admin/users'),
        fetch('/api/admin/special-offers')
      ])

      if (ordersResponse.ok && accountsResponse.ok && usersResponse.ok) {
        const ordersData = await ordersResponse.json()
        const accountsData = await accountsResponse.json()
        const usersData = await usersResponse.json()
        setOrders(ordersData)
        setAccounts(accountsData)
        setUsers(usersData)
      }
      
      if (offersResponse.ok) {
        const offersData = await offersResponse.json()
        setSpecialOffers(offersData)
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCard = async () => {
    try {
      const response = await fetch('/api/streaming-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCard,
          price: parseFloat(newCard.price),
          screens: parseInt(newCard.screens),
          maxProfiles: newCard.maxProfiles ? parseInt(newCard.maxProfiles) : undefined,
          pricePerProfile: newCard.pricePerProfile ? parseFloat(newCard.pricePerProfile) : undefined
        })
      })

      if (response.ok) {
        setIsCreateCardOpen(false)
        resetCardForm()
        fetchData()
      }
    } catch (error) {
      console.error('Error creating card:', error)
    }
  }

  const handleAddStock = async () => {
    try {
      const response = await fetch('/api/admin/add-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStock)
      })

      if (response.ok) {
        setIsAddStockOpen(false)
        resetStockForm()
        fetchData()
      }
    } catch (error) {
      console.error('Error adding stock:', error)
    }
  }

  const handleRechargeCredits = async () => {
    try {
      const response = await fetch('/api/admin/credit-recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...creditRecharge,
          amount: parseFloat(creditRecharge.amount)
        })
      })

      if (response.ok) {
        setIsRechargeCreditsOpen(false)
        resetCreditForm()
        fetchData()
      }
    } catch (error) {
      console.error('Error recharging credits:', error)
    }
  }

  const handleCreateSpecialOffer = async () => {
    try {
      const response = await fetch('/api/admin/special-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOffer,
          discountPercentage: parseFloat(newOffer.discountPercentage),
          specialPrice: newOffer.specialPrice ? parseFloat(newOffer.specialPrice) : undefined,
          targetSpent: parseFloat(newOffer.targetSpent)
        })
      })

      if (response.ok) {
        setIsCreateOfferOpen(false)
        resetOfferForm()
        fetchData()
      }
    } catch (error) {
      console.error('Error creating special offer:', error)
    }
  }

  const resetCardForm = () => {
    setNewCard({
      name: '',
      description: '',
      price: '',
      type: '',
      duration: '1 mes',
      quality: 'HD',
      screens: '1',
      saleType: 'FULL',
      maxProfiles: '',
      pricePerProfile: ''
    })
  }

  const resetStockForm = () => {
    setNewStock({
      streamingAccountId: '',
      accounts: [],
      profiles: []
    })
    setSelectedAccount(null)
  }

  const resetCreditForm = () => {
    setCreditRecharge({
      userId: '',
      amount: '',
      method: 'Transferencia',
      reference: ''
    })
    setSelectedUser(null)
  }

  const resetOfferForm = () => {
    setNewOffer({
      userId: '',
      streamingAccountId: '',
      discountPercentage: '',
      specialPrice: '',
      targetSpent: ''
    })
  }

  const addAccountToStock = () => {
    setNewStock({
      ...newStock,
      accounts: [...newStock.accounts, { email: '', password: '' }]
    })
  }

  const updateAccountInStock = (index: number, field: 'email' | 'password', value: string) => {
    const updatedAccounts = [...newStock.accounts]
    updatedAccounts[index][field] = value
    setNewStock({ ...newStock, accounts: updatedAccounts })
  }

  const removeAccountFromStock = (index: number) => {
    const updatedAccounts = newStock.accounts.filter((_, i) => i !== index)
    setNewStock({ ...newStock, accounts: updatedAccounts })
  }

  const addProfileToStock = () => {
    setNewStock({
      ...newStock,
      profiles: [...newStock.profiles, { profileName: '', profilePin: '' }]
    })
  }

  const updateProfileInStock = (index: number, field: 'profileName' | 'profilePin', value: string) => {
    const updatedProfiles = [...newStock.profiles]
    updatedProfiles[index][field] = value
    setNewStock({ ...newStock, profiles: updatedProfiles })
  }

  const removeProfileFromStock = (index: number) => {
    const updatedProfiles = newStock.profiles.filter((_, i) => i !== index)
    setNewStock({ ...newStock, profiles: updatedProfiles })
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
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gradient-to-r from-green-900/50 to-emerald-900/50">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-2 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Panel de Administración
              </h2>
              <p className="text-sm text-gray-400">Gestiona tus cards y stock de cuentas</p>
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
                <RefreshCw className="h-8 w-8 animate-spin text-green-500" />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6 bg-gray-800 border border-gray-700">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-green-600">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Resumen
                  </TabsTrigger>
                  <TabsTrigger value="cards" className="data-[state=active]:bg-green-600">
                    <Package className="h-4 w-4 mr-2" />
                    Cards
                  </TabsTrigger>
                  <TabsTrigger value="stock" className="data-[state=active]:bg-green-600">
                    <Database className="h-4 w-4 mr-2" />
                    Stock
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="data-[state=active]:bg-green-600">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Pedidos
                  </TabsTrigger>
                  <TabsTrigger value="users" className="data-[state=active]:bg-green-600">
                    <Users className="h-4 w-4 mr-2" />
                    Usuarios
                  </TabsTrigger>
                  <TabsTrigger value="offers" className="data-[state=active]:bg-green-600">
                    <Gift className="h-4 w-4 mr-2" />
                    Ofertas
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ProfitsCard />

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
                        <CardTitle className="text-sm font-medium text-gray-400">Cards Activas</CardTitle>
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
                              <div className="bg-green-600/20 p-2 rounded-lg">
                                <ShoppingCart className="h-4 w-4 text-green-400" />
                              </div>
                              <div>
                                <p className="font-medium text-white">{order.streamingAccount.name}</p>
                                <p className="text-sm text-gray-400">{order.user.name || order.user.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-400">${order.totalPrice.toLocaleString('es-CO')}</p>
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

                {/* Cards Tab */}
                <TabsContent value="cards" className="space-y-6 mt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Gestión de Cards</h3>
                    <Dialog open={isCreateCardOpen} onOpenChange={setIsCreateCardOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Nueva Card
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Crear Nueva Card de Streaming</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">Nombre</Label>
                            <Input
                              id="name"
                              value={newCard.name}
                              onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          <div>
                            <Label htmlFor="type">Tipo</Label>
                            <Select value={newCard.type} onValueChange={(value) => setNewCard({...newCard, type: value})}>
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
                              value={newCard.description}
                              onChange={(e) => setNewCard({...newCard, description: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          <div>
                            <Label htmlFor="saleType">Tipo de Venta</Label>
                            <Select value={newCard.saleType} onValueChange={(value) => setNewCard({...newCard, saleType: value})}>
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
                            <Label htmlFor="price">
                              {newCard.saleType === 'PROFILES' ? 'Precio por Perfil (COP)' : 'Precio (COP)'}
                            </Label>
                            <Input
                              id="price"
                              type="number"
                              value={newCard.price}
                              onChange={(e) => setNewCard({...newCard, price: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          
                          {newCard.saleType === 'PROFILES' && (
                            <div>
                              <Label htmlFor="maxProfiles">Máximo de Perfiles</Label>
                              <Input
                                id="maxProfiles"
                                type="number"
                                value={newCard.maxProfiles}
                                onChange={(e) => setNewCard({...newCard, maxProfiles: e.target.value})}
                                className="bg-gray-700 border-gray-600"
                              />
                            </div>
                          )}
                          
                          <div>
                            <Label htmlFor="duration">Duración</Label>
                            <Input
                              id="duration"
                              value={newCard.duration}
                              onChange={(e) => setNewCard({...newCard, duration: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                          <div>
                            <Label htmlFor="quality">Calidad</Label>
                            <Select value={newCard.quality} onValueChange={(value) => setNewCard({...newCard, quality: value})}>
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
                              value={newCard.screens}
                              onChange={(e) => setNewCard({...newCard, screens: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                          <Button variant="outline" onClick={() => setIsCreateCardOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleCreateCard} className="bg-green-600 hover:bg-green-700">
                            Crear Card
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid gap-4">
                    {accounts.map((account) => (
                      <Card key={account.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h4 className="font-semibold text-white">{account.name}</h4>
                                <Badge variant={account.isActive ? "default" : "secondary"}>
                                  {account.isActive ? "Activa" : "Inactiva"}
                                </Badge>
                                <Badge variant="outline">
                                  {account.saleType === 'FULL' ? 'Cuenta Completa' : 'Por Perfiles'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-400 mt-1">{account.type}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm">
                                <span className="text-green-400 font-semibold">
                                  ${account.saleType === 'PROFILES' && account.pricePerProfile 
                                    ? account.pricePerProfile.toLocaleString('es-CO') 
                                    : account.price.toLocaleString('es-CO')}
                                </span>
                                {account.saleType === 'FULL' ? (
                                  <span className="text-gray-400">Stock: {account.accountStocks?.filter(a => a.isAvailable).length || 0}</span>
                                ) : (
                                  <span className="text-gray-400">Perfiles: {account.profileStocks?.filter(p => p.isAvailable).length || 0}</span>
                                )}
                                <span className="text-gray-400">{account.duration}</span>
                                <span className="text-gray-400">{account.quality}</span>
                                <span className="text-gray-400">{account.screens} pantallas</span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAccount(account)
                                  setIsViewStockOpen(true)
                                }}
                              >
                                <Database className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAccount(account)
                                  setNewStock({...newStock, streamingAccountId: account.id})
                                  setIsAddStockOpen(true)
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Stock Tab */}
                <TabsContent value="stock" className="space-y-6 mt-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Gestión de Stock</h3>
                    <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Stock
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Agregar Stock a Card</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="accountSelect">Seleccionar Card</Label>
                            <Select value={newStock.streamingAccountId} onValueChange={(value) => {
                              setNewStock({...newStock, streamingAccountId: value})
                              const account = accounts.find(a => a.id === value)
                              setSelectedAccount(account || null)
                            }}>
                              <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.name} - {account.type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {selectedAccount && (
                            <>
                              {selectedAccount.saleType === 'FULL' ? (
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <Label>Cuentas Completas</Label>
                                    <Button size="sm" onClick={addAccountToStock}>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Agregar Cuenta
                                    </Button>
                                  </div>
                                  <div className="space-y-3">
                                    {newStock.accounts.map((account, index) => (
                                      <div key={index} className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <Input
                                          placeholder="Email"
                                          value={account.email}
                                          onChange={(e) => updateAccountInStock(index, 'email', e.target.value)}
                                          className="bg-gray-600 border-gray-500"
                                        />
                                        <Key className="h-4 w-4 text-gray-400" />
                                        <Input
                                          placeholder="Contraseña"
                                          type="password"
                                          value={account.password}
                                          onChange={(e) => updateAccountInStock(index, 'password', e.target.value)}
                                          className="bg-gray-600 border-gray-500"
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => removeAccountFromStock(index)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center justify-between mb-4">
                                    <Label>Perfiles Individuales</Label>
                                    <Button size="sm" onClick={addProfileToStock}>
                                      <Plus className="h-4 w-4 mr-2" />
                                      Agregar Perfil
                                    </Button>
                                  </div>
                                  <div className="space-y-3">
                                    {newStock.profiles.map((profile, index) => (
                                      <div key={index} className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        <Input
                                          placeholder="Nombre del perfil"
                                          value={profile.profileName}
                                          onChange={(e) => updateProfileInStock(index, 'profileName', e.target.value)}
                                          className="bg-gray-600 border-gray-500"
                                        />
                                        <Key className="h-4 w-4 text-gray-400" />
                                        <Input
                                          placeholder="PIN (opcional)"
                                          value={profile.profilePin}
                                          onChange={(e) => updateProfileInStock(index, 'profilePin', e.target.value)}
                                          className="bg-gray-600 border-gray-500"
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => removeProfileFromStock(index)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                          <Button variant="outline" onClick={() => setIsAddStockOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddStock} className="bg-green-600 hover:bg-green-700">
                            Agregar Stock
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Stock Overview */}
                  <div className="grid gap-4">
                    {accounts.map((account) => (
                      <Card key={account.id} className="bg-gray-800 border-gray-700">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white">{account.name}</CardTitle>
                            <Badge variant="outline">
                              {account.saleType === 'FULL' ? 'Cuentas Completas' : 'Perfiles'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {account.saleType === 'FULL' ? (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Disponibles:</span>
                                <span className="text-green-400 font-semibold">
                                  {account.accountStocks?.filter(a => a.isAvailable).length || 0}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Vendidas:</span>
                                <span className="text-red-400 font-semibold">
                                  {account.accountStocks?.filter(a => !a.isAvailable).length || 0}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total:</span>
                                <span className="text-white font-semibold">
                                  {account.accountStocks?.length || 0}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Disponibles:</span>
                                <span className="text-green-400 font-semibold">
                                  {account.profileStocks?.filter(p => p.isAvailable).length || 0}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Vendidos:</span>
                                <span className="text-red-400 font-semibold">
                                  {account.profileStocks?.filter(p => !p.isAvailable).length || 0}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total:</span>
                                <span className="text-white font-semibold">
                                  {account.profileStocks?.length || 0}
                                </span>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="space-y-6 mt-6">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-xl font-bold text-white">Gestión de Pedidos</h3>
                    <div className="flex-1 max-w-sm">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Buscar pedidos..."
                          className="pl-10 bg-gray-800 border-gray-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-white">{order.streamingAccount.name}</h4>
                              <p className="text-sm text-gray-400">
                                Cliente: {order.user.name || order.user.email}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(order.createdAt).toLocaleDateString('es-CO')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-400">
                                ${order.totalPrice.toLocaleString('es-CO')}
                              </p>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-6 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Gestión de Usuarios</h3>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Buscar usuarios..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-gray-800 border-gray-700"
                        />
                      </div>
                      <Dialog open={isRechargeCreditsOpen} onOpenChange={setIsRechargeCreditsOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-green-600 hover:bg-green-700">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Recargar Créditos
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-800 border-gray-700 text-white">
                          <DialogHeader>
                            <DialogTitle>Recargar Créditos de Usuario</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="userSelect">Usuario</Label>
                              <Select value={creditRecharge.userId} onValueChange={(value) => {
                                setCreditRecharge({...creditRecharge, userId: value})
                                const user = users.find(u => u.id === value)
                                setSelectedUser(user || null)
                              }}>
                                <SelectTrigger className="bg-gray-700 border-gray-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name || user.email} - ${user.credits.toLocaleString('es-CO')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="amount">Monto (COP)</Label>
                              <Input
                                id="amount"
                                type="number"
                                value={creditRecharge.amount}
                                onChange={(e) => setCreditRecharge({...creditRecharge, amount: e.target.value})}
                                className="bg-gray-700 border-gray-600"
                              />
                            </div>
                            <div>
                              <Label htmlFor="method">Método de Pago</Label>
                              <Select value={creditRecharge.method} onValueChange={(value) => setCreditRecharge({...creditRecharge, method: value})}>
                                <SelectTrigger className="bg-gray-700 border-gray-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Transferencia">Transferencia Bancaria</SelectItem>
                                  <SelectItem value="Nequi">Nequi</SelectItem>
                                  <SelectItem value="Daviplata">Daviplata</SelectItem>
                                  <SelectItem value="Efecty">Efecty</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="reference">Referencia (Opcional)</Label>
                              <Input
                                id="reference"
                                value={creditRecharge.reference}
                                onChange={(e) => setCreditRecharge({...creditRecharge, reference: e.target.value})}
                                className="bg-gray-700 border-gray-600"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2 mt-6">
                            <Button variant="outline" onClick={() => setIsRechargeCreditsOpen(false)}>
                              Cancelar
                            </Button>
                            <Button onClick={handleRechargeCredits} className="bg-green-600 hover:bg-green-700">
                              Recargar
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {filteredUsers.map((user) => (
                      <Card key={user.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-white">{user.name || user.email}</h4>
                              <p className="text-sm text-gray-400">{user.email}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm">
                                <span className="text-green-400 font-semibold">
                                  Créditos: ${user.credits.toLocaleString('es-CO')}
                                </span>
                                <span className="text-gray-400">
                                  Total Gastado: ${(user.totalSpent || 0).toLocaleString('es-CO')}
                                </span>
                                <span className="text-gray-400">
                                  Meta: ${(user.targetSpent || 0).toLocaleString('es-CO')}
                                </span>
                                <Badge variant={user.role === 'ADMIN' ? "default" : "secondary"}>
                                  {user.role}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setCreditRecharge({...creditRecharge, userId: user.id})
                                  setIsRechargeCreditsOpen(true)
                                }}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {/* Special Offers Tab */}
                <TabsContent value="offers" className="space-y-6 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Ofertas Especiales</h3>
                    <Dialog open={isCreateOfferOpen} onOpenChange={setIsCreateOfferOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                          <Gift className="h-4 w-4 mr-2" />
                          Nueva Oferta
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gray-800 border-gray-700 text-white">
                        <DialogHeader>
                          <DialogTitle>Crear Oferta Especial</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="offerUser">Usuario</Label>
                            <Select value={newOffer.userId} onValueChange={(value) => setNewOffer({...newOffer, userId: value})}>
                              <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {users.filter(u => u.role === 'USER').map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name || user.email} - Gastado: ${(user.totalSpent || 0).toLocaleString('es-CO')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="offerAccount">Card</Label>
                            <Select value={newOffer.streamingAccountId} onValueChange={(value) => setNewOffer({...newOffer, streamingAccountId: value})}>
                              <SelectTrigger className="bg-gray-700 border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.name} - ${account.price.toLocaleString('es-CO')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="targetSpent">Meta de Gasto (COP)</Label>
                            <Input
                              id="targetSpent"
                              type="number"
                              value={newOffer.targetSpent}
                              onChange={(e) => setNewOffer({...newOffer, targetSpent: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                              placeholder="Ej: 50000"
                            />
                          </div>
                          <div>
                            <Label htmlFor="discountPercentage">Descuento (%)</Label>
                            <Input
                              id="discountPercentage"
                              type="number"
                              value={newOffer.discountPercentage}
                              onChange={(e) => setNewOffer({...newOffer, discountPercentage: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                              placeholder="Ej: 20 para 20% de descuento"
                            />
                          </div>
                          <div>
                            <Label htmlFor="specialPrice">Precio Especial (Opcional)</Label>
                            <Input
                              id="specialPrice"
                              type="number"
                              value={newOffer.specialPrice}
                              onChange={(e) => setNewOffer({...newOffer, specialPrice: e.target.value})}
                              className="bg-gray-700 border-gray-600"
                              placeholder="Precio fijo especial en COP"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-6">
                          <Button variant="outline" onClick={() => setIsCreateOfferOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleCreateSpecialOffer} className="bg-green-600 hover:bg-green-700">
                            Crear Oferta
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid gap-4">
                    {specialOffers.map((offer) => (
                      <Card key={offer.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-white">
                                Oferta para {offer.user.name || offer.user.email}
                              </h4>
                              <p className="text-sm text-gray-400">{offer.streamingAccount.name}</p>
                              <div className="flex items-center space-x-4 mt-2 text-sm">
                                <span className="text-green-400 font-semibold">
                                  Meta: ${offer.targetSpent.toLocaleString('es-CO')}
                                </span>
                                {offer.discountPercentage && (
                                  <span className="text-blue-400">
                                    {offer.discountPercentage}% descuento
                                  </span>
                                )}
                                {offer.specialPrice && (
                                  <span className="text-purple-400">
                                    Precio: ${offer.specialPrice.toLocaleString('es-CO')}
                                  </span>
                                )}
                                <Badge variant={offer.isActive ? "default" : "secondary"}>
                                  {offer.isActive ? "Activa" : "Inactiva"}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Toggle offer status
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* View Stock Dialog */}
      <Dialog open={isViewStockOpen} onOpenChange={setIsViewStockOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock de {selectedAccount?.name}</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              {selectedAccount.saleType === 'FULL' ? (
                <div>
                  <h4 className="font-semibold text-white mb-3">Cuentas Completas</h4>
                  <div className="space-y-2">
                    {selectedAccount.accountStocks?.map((stock) => (
                      <div key={stock.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-white">{stock.email}</span>
                          <Key className="h-4 w-4 text-gray-400" />
                          <span className="text-white font-mono text-sm">{stock.password}</span>
                        </div>
                        <Badge variant={stock.isAvailable ? "default" : "secondary"}>
                          {stock.isAvailable ? "Disponible" : "Vendida"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="font-semibold text-white mb-3">Perfiles Individuales</h4>
                  <div className="space-y-2">
                    {selectedAccount.profileStocks?.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-white">{profile.profileName}</span>
                          {profile.profilePin && (
                            <>
                              <Key className="h-4 w-4 text-gray-400" />
                              <span className="text-white font-mono text-sm">{profile.profilePin}</span>
                            </>
                          )}
                        </div>
                        <Badge variant={profile.isAvailable ? "default" : "secondary"}>
                          {profile.isAvailable ? "Disponible" : "Vendido"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}