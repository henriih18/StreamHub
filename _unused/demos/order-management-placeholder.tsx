"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  CreditCard,
  Package,
  Activity,
  AlertTriangle,
  Edit,
  Trash2
} from 'lucide-react'

export default function OrderManagementPlaceholder() {
  const [orders] = useState([
    {
      id: '1',
      user: { email: 'user1@example.com', name: 'Usuario 1' },
      streamingAccount: {
        name: 'Netflix Premium',
        type: 'Netflix',
        price: 15000,
        duration: '1 mes',
        quality: '4K',
        screens: 4
      },
      totalPrice: 15000,
      status: 'DELIVERED',
      saleType: 'FULL',
      quantity: 1,
      createdAt: '2024-01-15',
      expiresAt: '2024-02-15',
      renewalCount: 0,
      deliveryStatus: 'DELIVERED'
    },
    {
      id: '2',
      user: { email: 'user2@example.com', name: 'Usuario 2' },
      streamingAccount: {
        name: 'Disney+ Premium',
        type: 'Disney+',
        price: 12000,
        duration: '1 mes',
        quality: '4K',
        screens: 4
      },
      totalPrice: 12000,
      status: 'PENDING',
      saleType: 'PROFILE',
      quantity: 1,
      createdAt: '2024-01-20',
      expiresAt: '2024-02-20',
      renewalCount: 0,
      deliveryStatus: 'PENDING'
    }
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const handleDeliverOrder = (orderId: string) => {
    toast.success('Pedido entregado correctamente')
  }

  const handleCancelOrder = (orderId: string) => {
    toast.success('Pedido cancelado correctamente')
  }

  const handleRefundOrder = (orderId: string) => {
    toast.success('Reembolso procesado correctamente')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Entregado</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Pedidos</h2>
          <p className="text-muted-foreground">
            Administra los pedidos de los usuarios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              +1 esta semana
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.status === 'PENDING').length}</div>
            <p className="text-xs text-muted-foreground">
              Por entregar
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter(o => o.status === 'DELIVERED').length}</div>
            <p className="text-xs text-muted-foreground">
              Completados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${orders.reduce((sum, o) => sum + o.totalPrice, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total ventas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
          <CardDescription>
            Gestiona los pedidos de los usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedidos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="delivered">Entregados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Más filtros
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">#{order.id}</div>
                    <div className="text-sm text-muted-foreground">{order.saleType}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.user.name}</div>
                      <div className="text-sm text-muted-foreground">{order.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.streamingAccount?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.streamingAccount?.duration} • {order.streamingAccount?.quality}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>${order.totalPrice.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.createdAt}</div>
                      <div className="text-sm text-muted-foreground">
                        Exp: {order.expiresAt}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {order.status === 'PENDING' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeliverOrder(order.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}