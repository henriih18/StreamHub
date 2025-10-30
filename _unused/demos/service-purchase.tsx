'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuantitySelector } from '@/components/ui/quantity-selector'
import { 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  Shield,
  Monitor,
  Star,
  AlertCircle,
  CreditCard,
  Zap
} from 'lucide-react'

interface ServiceItem {
  id: string
  name: string
  type: string
  duration: string
  quality: string
  screens: number
  price: number
  status: 'available' | 'sold_out'
  features: string[]
  image?: string
  filename?: string
  guaranteed: boolean
}

interface ServicePurchaseProps {
  services: ServiceItem[]
  onPurchase: (items: { service: ServiceItem; quantity: number }[]) => void
  userCredits?: number
}

export function ServicePurchase({ services, onPurchase, userCredits = 0 }: ServicePurchaseProps) {
  const [cart, setCart] = useState<{ service: ServiceItem; quantity: number }[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [serviceId]: quantity
    }))
  }

  const addToCart = (service: ServiceItem) => {
    const quantity = quantities[service.id] || 1
    const existingItem = cart.find(item => item.service.id === service.id)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.service.id === service.id 
          ? { ...item, quantity }
          : item
      ))
    } else {
      setCart([...cart, { service, quantity }])
    }
  }

  const removeFromCart = (serviceId: string) => {
    setCart(cart.filter(item => item.service.id !== serviceId))
    setQuantities(prev => {
      const newQuantities = { ...prev }
      delete newQuantities[serviceId]
      return newQuantities
    })
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.service.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handlePurchase = () => {
    if (cart.length === 0) return
    
    const totalPrice = getTotalPrice()
    if (totalPrice > userCredits) {
      alert('Créditos insuficientes')
      return
    }
    
    onPurchase(cart)
    setCart([])
    setQuantities({})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Comprar Servicios de Streaming
          </h1>
          <p className="text-slate-400 mb-4">
            Selecciona los servicios que deseas adquirir
          </p>
          {userCredits > 0 && (
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              Créditos disponibles: ${userCredits.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Services List */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <Card key={service.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                  <CardContent className="p-4">
                    {/* Service Image */}
                    {service.image && (
                      <div className="relative h-32 overflow-hidden rounded-lg mb-4">
                        <img 
                          src={service.image} 
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                        {service.status === 'sold_out' && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Badge className="bg-red-500 text-white">
                              Agotado
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Service Info */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {service.name}
                      </h3>
                      {service.filename && (
                        <p className="text-xs text-slate-400 mb-2">{service.filename}</p>
                      )}
                      
                      {/* Service Details */}
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Duración:</span>
                          <span className="text-white">{service.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Calidad:</span>
                          <span className="text-white">{service.quality}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Pantallas:</span>
                          <span className="text-white">{service.screens}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {service.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {service.guaranteed && (
                          <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Garantizado
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="text-2xl font-bold text-emerald-400">
                        ${service.price.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-slate-400 text-sm">/mes</div>
                    </div>

                    {/* Quantity and Actions */}
                    {service.status === 'available' ? (
                      <div className="space-y-2">
                        <QuantitySelector
                          value={quantities[service.id] || 1}
                          onChange={(value) => handleQuantityChange(service.id, value)}
                          min={1}
                          max={10}
                        />
                        <Button
                          onClick={() => addToCart(service)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={cart.some(item => item.service.id === service.id)}
                        >
                          {cart.some(item => item.service.id === service.id) ? 'En el carrito' : 'Agregar al carrito'}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        disabled
                        className="w-full bg-slate-700 text-slate-400 cursor-not-allowed"
                      >
                        Agotado
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-slate-700 sticky top-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Carrito
                  </h3>
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                    {getTotalItems()} items
                  </Badge>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">Tu carrito está vacío</p>
                  </div>
                ) : (
                  <>
                    {/* Cart Items */}
                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.service.id} className="bg-slate-700/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-white font-medium text-sm">
                              {item.service.name}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.service.id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0"
                            >
                              ×
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 text-sm">
                              {item.quantity} × ${item.service.price.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-emerald-400 font-medium">
                              ${(item.service.price * item.quantity).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="border-t border-slate-700 pt-4 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400">Subtotal:</span>
                        <span className="text-white">
                          ${getTotalPrice().toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400">Impuestos:</span>
                        <span className="text-white">$0</span>
                      </div>
                      <div className="flex items-center justify-between text-lg font-semibold">
                        <span className="text-white">Total:</span>
                        <span className="text-emerald-400">
                          ${getTotalPrice().toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    {/* Credit Check */}
                    {getTotalPrice() > userCredits && (
                      <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-red-300 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>Créditos insuficientes</span>
                        </div>
                      </div>
                    )}

                    {/* Purchase Button */}
                    <Button
                      onClick={handlePurchase}
                      disabled={getTotalPrice() > userCredits || cart.length === 0}
                      className={`w-full ${
                        getTotalPrice() > userCredits || cart.length === 0
                          ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {getTotalPrice() > userCredits ? 'Créditos insuficientes' : 'Comprar ahora'}
                    </Button>

                    {/* Features */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span>Compra 100% segura</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Zap className="w-4 h-4 text-emerald-400" />
                        <span>Entrega inmediata</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>Garantía de satisfacción</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}