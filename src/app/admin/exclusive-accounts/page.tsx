'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Crown, Eye, EyeOff, Users, Settings, Trash2, Edit, Plus, Search, Filter, Shield, Lock, Unlock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ExclusiveAccount {
  id: string
  name: string
  description: string
  type: string
  price: number
  duration: number
  quality?: string
  screens?: string
  saleType: string
  maxProfiles?: number
  pricePerProfile?: number
  isPublic: boolean
  isActive: boolean
  allowedUsers: Array<{
    id: string
    name: string
    email: string
  }>
  createdAt: string
  expiresAt?: string
  exclusiveStocks?: ExclusiveStock[]
}

interface ExclusiveStock {
  id: string
  email: string
  password: string
  pin?: string
  profileName?: string
  isAvailable: boolean
  soldToUserId?: string
  soldAt?: string
  notes?: string
  createdAt: string
  soldToUser?: {
    id: string
    name: string
    email: string
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
  credits: number
  isActive: boolean
}

export default function ExclusiveAccountsPage() {
  const [accounts, setAccounts] = useState<ExclusiveAccount[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showInactive, setShowInactive] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<ExclusiveAccount | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showAccessDialog, setShowAccessDialog] = useState(false)
  const [showCredentials, setShowCredentials] = useState<{ [key: string]: boolean }>({})

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'NETFLIX',
    price: 0,
    duration: 30,
    quality: '4K',
    screens: '4',
    saleType: 'FULL',
    maxProfiles: 1,
    pricePerProfile: 0,
    isPublic: false,
    allowedUsers: [] as string[],
    expiresAt: ''
  })

  // Stock form states
  const [stockFormData, setStockFormData] = useState({
    email: '',
    password: '',
    pin: '',
    profileName: '',
    notes: ''
  })
  const [showStockDialog, setShowStockDialog] = useState(false)
  const [selectedAccountForStock, setSelectedAccountForStock] = useState<ExclusiveAccount | null>(null)

  useEffect(() => {
    fetchAccounts()
    fetchUsers()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch('/api/admin/exclusive-accounts')
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
    } catch (error) {
      toast.error('Error al cargar cuentas exclusivas')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.filter((user: User) => user.isActive))
      }
    } catch (error) {
      toast.error('Error al cargar usuarios')
    }
  }

  const handleCreateAccount = async () => {
    try {
      const response = await fetch('/api/admin/exclusive-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Cuenta exclusiva creada exitosamente')
        setShowCreateDialog(false)
        resetForm()
        fetchAccounts()
      } else {
        const error = await response.json()
        toast.error(error.message || error.error || 'Error al crear cuenta')
      }
    } catch (error) {
      toast.error('Error al crear cuenta')
    }
  }

  const handleUpdateAccount = async (accountId: string, updates: Partial<ExclusiveAccount>) => {
    try {
      const response = await fetch(`/api/admin/exclusive-accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        toast.success('Cuenta actualizada exitosamente')
        fetchAccounts()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al actualizar cuenta')
      }
    } catch (error) {
      toast.error('Error al actualizar cuenta')
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    try {
      const response = await fetch(`/api/admin/exclusive-accounts/${accountId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Cuenta eliminada exitosamente')
        fetchAccounts()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al eliminar cuenta')
      }
    } catch (error) {
      toast.error('Error al eliminar cuenta')
    }
  }

  const handleToggleAccess = async (accountId: string, userId: string, hasAccess: boolean) => {
    try {
      const response = await fetch(`/api/admin/exclusive-accounts/${accountId}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: hasAccess ? 'remove' : 'add' })
      })

      if (response.ok) {
        toast.success(`Acceso ${hasAccess ? 'revocado' : 'otorgado'} exitosamente`)
        fetchAccounts()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al modificar acceso')
      }
    } catch (error) {
      toast.error('Error al modificar acceso')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'NETFLIX',
      price: 0,
      duration: 30,
      quality: '4K',
      screens: '4',
      saleType: 'FULL',
      maxProfiles: 1,
      pricePerProfile: 0,
      isPublic: false,
      allowedUsers: [],
      expiresAt: ''
    })
  }

  const resetStockForm = () => {
    setStockFormData({
      email: '',
      password: '',
      pin: '',
      profileName: '',
      notes: ''
    })
  }

  const handleAddStock = async () => {
    if (!selectedAccountForStock) return

    try {
      const response = await fetch('/api/admin/exclusive-accounts/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exclusiveAccountId: selectedAccountForStock.id,
          ...stockFormData
        })
      })

      if (response.ok) {
        toast.success('Stock agregado exitosamente')
        setShowStockDialog(false)
        resetStockForm()
        setSelectedAccountForStock(null)
        fetchAccounts()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Error al agregar stock')
      }
    } catch (error) {
      toast.error('Error al agregar stock')
    }
  }

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || account.type === filterType
    const matchesStatus = showInactive || account.isActive
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getAccountTypeInfo = (type: string) => {
    const types = {
      NETFLIX: { name: 'Netflix', color: 'bg-red-500' },
      DISNEY: { name: 'Disney+', color: 'bg-blue-500' },
      HBO: { name: 'HBO Max', color: 'bg-purple-500' },
      AMAZON: { name: 'Amazon Prime', color: 'bg-orange-500' },
      STAR: { name: 'Star+', color: 'bg-indigo-500' },
      PARAMOUNT: { name: 'Paramount+', color: 'bg-cyan-500' }
    }
    return types[type as keyof typeof types] || { name: type, color: 'bg-gray-500' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Crown className="w-8 h-8 text-yellow-500" />
            Cuentas Exclusivas
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona cuentas premium con acceso restringido
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cuenta Exclusiva
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nueva Cuenta Exclusiva</DialogTitle>
              <DialogDescription>
                Configura una cuenta premium con acceso limitado
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Netflix Premium 4K"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NETFLIX">Netflix</SelectItem>
                      <SelectItem value="DISNEY">Disney+</SelectItem>
                      <SelectItem value="HBO">HBO Max</SelectItem>
                      <SelectItem value="AMAZON">Amazon Prime</SelectItem>
                      <SelectItem value="STAR">Star+</SelectItem>
                      <SelectItem value="PARAMOUNT">Paramount+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe los beneficios de esta cuenta exclusiva..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="saleType">Tipo de venta</Label>
                  <Select value={formData.saleType} onValueChange={(value) => setFormData({ ...formData, saleType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL">Cuenta completa</SelectItem>
                      <SelectItem value="PROFILES">Por perfiles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quality">Calidad</Label>
                  <Select value={formData.quality} onValueChange={(value) => setFormData({ ...formData, quality: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HD">HD</SelectItem>
                      <SelectItem value="FULL_HD">Full HD</SelectItem>
                      <SelectItem value="4K">4K</SelectItem>
                      <SelectItem value="4K_HDR">4K HDR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.saleType === 'PROFILES' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxProfiles">Máximo de perfiles</Label>
                    <Input
                      id="maxProfiles"
                      type="number"
                      value={formData.maxProfiles}
                      onChange={(e) => setFormData({ ...formData, maxProfiles: Number(e.target.value) || 1 })}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerProfile">Precio por perfil ($)</Label>
                    <Input
                      id="pricePerProfile"
                      type="number"
                      value={formData.pricePerProfile}
                      onChange={(e) => setFormData({ ...formData, pricePerProfile: Number(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (días)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="screens">Pantallas</Label>
                  <Select value={formData.screens} onValueChange={(value) => setFormData({ ...formData, screens: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 pantalla</SelectItem>
                      <SelectItem value="2">2 pantallas</SelectItem>
                      <SelectItem value="4">4 pantallas</SelectItem>
                      <SelectItem value="6">6 pantallas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Fecha de expiración (opcional)</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="isPublic"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                  />
                  <Label htmlFor="isPublic">Cuenta pública (todos pueden ver)</Label>
                </div>
              </div>

              {!formData.isPublic && (
                <div className="space-y-2">
                  <Label>Usuarios permitidos</Label>
                  <div className="border rounded-lg p-3 max-h-32 overflow-y-auto">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={formData.allowedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                allowedUsers: [...formData.allowedUsers, user.id]
                              })
                            } else {
                              setFormData({
                                ...formData,
                                allowedUsers: formData.allowedUsers.filter(id => id !== user.id)
                              })
                            }
                          }}
                        />
                        <Label htmlFor={`user-${user.id}`} className="text-sm">
                          {user.name} ({user.email})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAccount} className="bg-yellow-500 hover:bg-yellow-600">
                Crear Cuenta Exclusiva
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar cuentas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="NETFLIX">Netflix</SelectItem>
            <SelectItem value="DISNEY">Disney+</SelectItem>
            <SelectItem value="HBO">HBO Max</SelectItem>
            <SelectItem value="AMAZON">Amazon Prime</SelectItem>
            <SelectItem value="STAR">Star+</SelectItem>
            <SelectItem value="PARAMOUNT">Paramount+</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <Switch
            id="showInactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="showInactive">Mostrar inactivas</Label>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredAccounts.map((account) => {
          const typeInfo = getAccountTypeInfo(account.type)
          const isExpired = account.expiresAt && new Date(account.expiresAt) < new Date()
          
          return (
            <Card key={account.id} className={`${!account.isActive ? 'opacity-50' : ''} ${isExpired ? 'border-red-200 bg-red-50/50' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${typeInfo.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                      {typeInfo.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {account.name}
                        <Crown className="w-5 h-5 text-yellow-500" />
                        {account.isPublic ? (
                          <Unlock className="w-4 h-4 text-green-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-red-500" />
                        )}
                        {isExpired && (
                          <Badge variant="destructive">Expirada</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{account.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAccountForStock(account)
                        setShowStockDialog(true)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Stock
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAccount(account)
                        setShowAccessDialog(true)
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Acceso
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateAccount(account.id, { isActive: !account.isActive })}
                    >
                      {account.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar cuenta exclusiva?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. La cuenta será eliminada permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteAccount(account.id)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Precio</Label>
                    <p className="font-semibold">${account.price.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Duración</Label>
                    <p className="font-semibold">{account.duration} días</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Tipo de venta</Label>
                    <p className="font-semibold">
                      {account.saleType === 'FULL' ? 'Cuenta completa' : 'Por perfiles'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Creada</Label>
                    <p className="font-semibold">
                      {format(new Date(account.createdAt), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                </div>

                {/* Stock Information */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm text-muted-foreground">
                      Stock disponible ({account.exclusiveStocks?.filter(s => s.isAvailable).length || 0} items)
                    </Label>
                  </div>
                  {account.exclusiveStocks && account.exclusiveStocks.length > 0 ? (
                    <div className="space-y-2">
                      {account.exclusiveStocks.slice(0, 3).map((stock) => (
                        <div key={stock.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${stock.isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm font-mono">{stock.email}</span>
                            {stock.profileName && (
                              <Badge variant="outline" className="text-xs">{stock.profileName}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {stock.isAvailable ? (
                              <Badge variant="default" className="text-xs">Disponible</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Vendido</Badge>
                            )}
                            {stock.soldToUser && (
                              <span className="text-xs text-muted-foreground">
                                {stock.soldToUser.name}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {account.exclusiveStocks.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{account.exclusiveStocks.length - 3} más items en stock
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No hay stock agregado</p>
                  )}
                </div>

                {!account.isPublic && (
                  <div className="mt-4">
                    <Label className="text-sm text-muted-foreground">Usuarios con acceso ({account.allowedUsers.length})</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {account.allowedUsers.slice(0, 5).map((user) => (
                        <Badge key={user.id} variant="secondary" className="text-xs">
                          {user.name}
                        </Badge>
                      ))}
                      {account.allowedUsers.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{account.allowedUsers.length - 5} más
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {account.expiresAt && (
                  <div className="mt-4">
                    <Label className="text-sm text-muted-foreground">Fecha de expiración</Label>
                    <p className={`font-semibold ${isExpired ? 'text-red-500' : ''}`}>
                      {format(new Date(account.expiresAt), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredAccounts.length === 0 && (
        <div className="text-center py-12">
          <Crown className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No se encontraron cuentas exclusivas</h3>
          <p className="text-muted-foreground">
            {searchTerm || filterType !== 'all' 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Crea tu primera cuenta exclusiva para comenzar'
            }
          </p>
        </div>
      )}

      {/* Dialogo de gestión de acceso */}
      <Dialog open={showAccessDialog} onOpenChange={setShowAccessDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gestionar Acceso - {selectedAccount?.name}</DialogTitle>
            <DialogDescription>
              Controla qué usuarios pueden acceder a esta cuenta exclusiva
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <Shield className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="font-semibold">Estado de acceso</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAccount.isPublic 
                      ? 'Cuenta pública - Todos los usuarios pueden verla' 
                      : `Cuenta privada - Solo ${selectedAccount.allowedUsers.length} usuarios tienen acceso`
                    }
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateAccount(selectedAccount.id, { 
                    isPublic: !selectedAccount.isPublic,
                    allowedUsers: !selectedAccount.isPublic ? [] : selectedAccount.allowedUsers.map((u: any) => u.id)
                  })}
                >
                  {selectedAccount.isPublic ? 'Hacer privada' : 'Hacer pública'}
                </Button>
              </div>

              {!selectedAccount.isPublic && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Usuarios con acceso</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Créditos</TableHead>
                        <TableHead>Acceso</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => {
                        const hasAccess = selectedAccount.allowedUsers.some(u => u.id === user.id)
                        return (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                {user.role}
                              </Badge>
                            </TableCell>
                            <TableCell>${user.credits.toLocaleString('es-CO', { maximumFractionDigits: 0 })}</TableCell>
                            <TableCell>
                              <Badge variant={hasAccess ? 'default' : 'secondary'}>
                                {hasAccess ? 'Permitido' : 'Denegado'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant={hasAccess ? 'destructive' : 'default'}
                                size="sm"
                                onClick={() => handleToggleAccess(selectedAccount.id, user.id, hasAccess)}
                              >
                                {hasAccess ? 'Revocar' : 'Otorgar'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Management Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Stock - {selectedAccountForStock?.name}</DialogTitle>
            <DialogDescription>
              Agrega nuevas cuentas al stock de esta cuenta exclusiva
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={stockFormData.email}
                onChange={(e) => setStockFormData({ ...stockFormData, email: e.target.value })}
                placeholder="email@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={stockFormData.password}
                onChange={(e) => setStockFormData({ ...stockFormData, password: e.target.value })}
                placeholder="Contraseña de la cuenta"
              />
            </div>
            {selectedAccountForStock?.saleType === 'PROFILES' && (
              <div className="space-y-2">
                <Label htmlFor="profileName">Nombre del perfil</Label>
                <Input
                  id="profileName"
                  value={stockFormData.profileName}
                  onChange={(e) => setStockFormData({ ...stockFormData, profileName: e.target.value })}
                  placeholder="Nombre del perfil (opcional)"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="pin">PIN (opcional)</Label>
              <Input
                id="pin"
                value={stockFormData.pin}
                onChange={(e) => setStockFormData({ ...stockFormData, pin: e.target.value })}
                placeholder="PIN si es requerido"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={stockFormData.notes}
                onChange={(e) => setStockFormData({ ...stockFormData, notes: e.target.value })}
                placeholder="Notas adicionales sobre este item de stock"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowStockDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddStock} className="bg-yellow-500 hover:bg-yellow-600">
              Agregar Stock
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}