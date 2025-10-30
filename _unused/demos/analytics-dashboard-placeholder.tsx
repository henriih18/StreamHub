"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  Activity,
  Eye,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  PieChart,
  LineChart,
  Target,
  Zap,
  Clock,
  Server,
  Wifi,
  Headphones,
  Phone,
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

export default function AnalyticsDashboardPlaceholder() {
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  const stats = {
    totalRevenue: 2500000,
    totalOrders: 150,
    totalUsers: 85,
    conversionRate: 12.5,
    averageOrderValue: 16667,
    activeUsers: 45,
    pageViews: 1250,
    bounceRate: 35.2
  }

  const recentActivity = [
    { id: 1, type: 'order', description: 'Nuevo pedido #123', time: 'Hace 2 minutos', icon: ShoppingBag },
    { id: 2, type: 'user', description: 'Nuevo usuario registrado', time: 'Hace 5 minutos', icon: Users },
    { id: 3, type: 'revenue', description: 'Pago recibido $15,000', time: 'Hace 10 minutos', icon: DollarSign },
    { id: 4, type: 'system', description: 'Sistema actualizado', time: 'Hace 15 minutos', icon: Activity }
  ]

  const topProducts = [
    { name: 'Netflix Premium', sales: 45, revenue: 675000, growth: 12.5 },
    { name: 'Disney+ Premium', sales: 38, revenue: 456000, growth: 8.3 },
    { name: 'HBO Max', sales: 28, revenue: 280000, growth: -2.1 },
    { name: 'Amazon Prime', sales: 22, revenue: 198000, growth: 15.7 }
  ]

  const userGrowth = [
    { month: 'Ene', users: 45, newUsers: 12 },
    { month: 'Feb', users: 58, newUsers: 13 },
    { month: 'Mar', users: 72, newUsers: 14 },
    { month: 'Abr', users: 85, newUsers: 13 }
  ]

  const revenueByMonth = [
    { month: 'Ene', revenue: 450000, orders: 28 },
    { month: 'Feb', revenue: 580000, orders: 35 },
    { month: 'Mar', revenue: 720000, orders: 42 },
    { month: 'Abr', revenue: 750000, orders: 45 }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Panel de Análisis</h2>
          <p className="text-muted-foreground">
            Métricas y análisis del rendimiento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 horas</SelectItem>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="90d">90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
              +12.5% vs período anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
              +8.3% vs período anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
              +15.2% vs período anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowDown className="h-3 w-3 mr-1 text-red-500" />
              -2.1% vs período anterior
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="products">Productos</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia de Ingresos</CardTitle>
                <CardDescription>
                  Ingresos mensuales últimos 4 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Gráfico de línea de ingresos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Crecimiento de Usuarios</CardTitle>
                <CardDescription>
                  Nuevos usuarios por mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Gráfico de barras de usuarios</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vendidos</CardTitle>
              <CardDescription>
                Top productos por ingresos y ventas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.sales} ventas • ${product.revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.growth > 0 ? 'default' : 'secondary'}>
                        {product.growth > 0 ? '+' : ''}{product.growth}%
                      </Badge>
                      {product.growth > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Usuarios</CardTitle>
              <CardDescription>
                Estadísticas detalladas de usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <div className="text-sm text-muted-foreground">Usuarios Totales</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.activeUsers}</div>
                  <div className="text-sm text-muted-foreground">Usuarios Activos</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats.conversionRate}%</div>
                  <div className="text-sm text-muted-foreground">Tasa de Conversión</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Productos</CardTitle>
              <CardDescription>
                Rendimiento de productos por categoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-2" />
                  <p>Gráfico circular de productos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento del Sistema</CardTitle>
              <CardDescription>
                Métricas de rendimiento y disponibilidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <span>Tiempo de respuesta</span>
                    </div>
                    <span className="font-medium">245ms</span>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-blue-500" />
                      <span>Tiempo de actividad</span>
                    </div>
                    <span className="font-medium">99.9%</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span>Usuarios en línea</span>
                    </div>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span>Puntuación de rendimiento</span>
                    </div>
                    <span className="font-medium">95/100</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>
            Últimas actividades del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{activity.description}</div>
                  <div className="text-sm text-muted-foreground">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}