'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuantitySelector } from '@/components/ui/quantity-selector'
import { 
  CheckCircle, 
  Shield, 
  Clock, 
  Monitor,
  Wifi,
  Lock,
  Star
} from 'lucide-react'

interface StreamingService {
  id: string
  name: string
  type: string
  duration: string
  quality: string
  screens: number
  price: number
  originalPrice?: number
  status: 'available' | 'sold_out'
  features: string[]
  image?: string
  badge?: string
}

interface StreamingShowcaseProps {
  services: StreamingService[]
  onAddToCart: (service: StreamingService, quantity: number) => void
}

export function StreamingShowcase({ services, onAddToCart }: StreamingShowcaseProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const handleQuantityChange = (serviceId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [serviceId]: quantity
    }))
  }

  const handleAddToCart = (service: StreamingService) => {
    const quantity = quantities[service.id] || 1
    onAddToCart(service, quantity)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-4">
            🎬 Cuentas de Streaming Premium Exclusivas
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Cuentas de Streaming Premium Exclusivas
          </h1>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Acceso ilimitado a Netflix, Disney+, HBO Max, Prime Video y más. 
            Calidad 4K, sin anuncios, entrega instantánea.
          </p>
          
          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="flex items-center gap-2 text-white/80">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">100% Seguro (SSL)</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">Entrega Inmediata</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Wifi className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">Soporte 24/7</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Monitor className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">Calidad 4K HDR</span>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="bg-slate-800/90 border-slate-700 hover:bg-slate-800 transition-all duration-300 overflow-hidden group">
              {/* Service Image */}
              {service.image && (
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {service.badge && (
                    <Badge className="absolute top-2 right-2 bg-emerald-500 text-white">
                      {service.badge}
                    </Badge>
                  )}
                  {service.status === 'sold_out' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge className="bg-red-500 text-white text-lg px-4 py-2">
                        Agotado
                      </Badge>
                    </div>
                  )}
                </div>
              )}

              <CardContent className="p-4">
                {/* Service Name */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {service.name}
                </h3>

                {/* Service Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Duración:</span>
                    <span className="text-white">{service.duration}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Calidad:</span>
                    <span className="text-white">{service.quality}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Pantallas:</span>
                    <span className="text-white">{service.screens}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {service.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                {/* Price */}
                <div className="mb-4">
                  {service.originalPrice && service.originalPrice > service.price ? (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 line-through text-sm">
                        ${service.originalPrice.toLocaleString('es-CO')}
                      </span>
                      <span className="text-2xl font-bold text-emerald-400">
                        ${service.price.toLocaleString('es-CO')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-emerald-400">
                      ${service.price.toLocaleString('es-CO')}
                    </span>
                  )}
                  <span className="text-slate-400 text-sm"> /mes</span>
                </div>

                {/* Quantity Selector */}
                {service.status === 'available' && (
                  <div className="mb-4">
                    <QuantitySelector
                      value={quantities[service.id] || 1}
                      onChange={(value) => handleQuantityChange(service.id, value)}
                      min={1}
                      max={10}
                    />
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={() => handleAddToCart(service)}
                  disabled={service.status === 'sold_out'}
                  className={`w-full ${
                    service.status === 'sold_out'
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {service.status === 'sold_out' ? 'Agotado' : 'Agregar al carrito'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {services.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Monitor className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay servicios disponibles
            </h3>
            <p className="text-slate-400">
              No se encontraron cuentas de streaming en este momento.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}