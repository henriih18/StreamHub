'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Monitor, 
  Users, 
  CheckCircle, 
  ShoppingCart,
  Plus,
  Minus,
  Play,
  Star
} from 'lucide-react'

interface StreamingAccount {
  id: string
  name: string
  description: string
  price: number
  type: string
  duration: string
  quality: string
  screens: number
  inStock: boolean
  stockCount?: number
  saleType: 'FULL' | 'PROFILES'
  maxProfiles?: number
  pricePerProfile?: number
}

interface StreamingAccountsPanelProps {
  accounts: StreamingAccount[]
  onAddToCart: (accountId: string, quantity: number) => void
}

export function StreamingAccountsPanel({ accounts, onAddToCart }: StreamingAccountsPanelProps) {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})

  const handleQuantityChange = (accountId: string, change: number) => {
    const account = accounts.find(a => a.id === accountId)
    if (!account) return

    const currentQuantity = quantities[accountId] || 1
    const maxQuantity = account.stockCount || 99
    const newQuantity = Math.max(1, Math.min(currentQuantity + change, maxQuantity))
    
    setQuantities(prev => ({
      ...prev,
      [accountId]: newQuantity
    }))
  }

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('es-CO')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          Cuentas de Streaming
        </h2>
        <Badge className="bg-purple-600/20 text-purple-300 border-purple-600/30">
          {accounts.length} servicios disponibles
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => {
          const quantity = quantities[account.id] || 1
          
          return (
            <Card 
              key={account.id}
              className={`bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-purple-500/20 backdrop-blur-sm hover:from-slate-800 hover:to-slate-900 transition-all duration-300 ${
                !account.inStock ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center text-2xl">
                      🎬
                    </div>
                    <div>
                      <CardTitle className="text-lg text-white">
                        {account.name}
                      </CardTitle>
                      <p className="text-purple-300 text-sm">
                        {account.type}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-purple-200 text-sm leading-relaxed">
                  {account.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-purple-300 text-sm">
                    <Monitor className="w-4 h-4" />
                    <span>{account.quality}</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-300 text-sm">
                    <Users className="w-4 h-4" />
                    <span>{account.screens} pantallas</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-300 text-sm">
                    <Play className="w-4 h-4" />
                    <span>{account.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-300 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span>Garantizado</span>
                  </div>
                </div>

                {/* Profile Info */}
                {account.saleType === 'PROFILES' && account.maxProfiles && (
                  <div className="bg-purple-800/30 rounded-lg p-3 border border-purple-600/30">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-200 text-sm">
                        {account.maxProfiles} perfiles disponibles
                      </span>
                      <Users className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-purple-300 text-xs mt-1">
                      Compra por separado cada perfil
                    </p>
                  </div>
                )}

                {/* Price */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {formatPrice(account.price)}
                    <span className="text-sm text-purple-300 font-normal">
                      /{account.saleType === 'PROFILES' ? 'perfil' : 'mes'}
                    </span>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="text-center">
                  {account.inStock ? (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      {account.stockCount || 'Disponible'} disponible{account.stockCount !== 1 ? 's' : ''}
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
                      Agotado
                    </Badge>
                  )}
                </div>

                {/* Quantity and Add to Cart */}
                {account.inStock ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(account.id, -1)}
                        disabled={quantity <= 1}
                        className="border-purple-500/30 text-purple-300 hover:bg-purple-800/30"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="text-white font-medium w-8 text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(account.id, 1)}
                        disabled={quantity >= (account.stockCount || 99)}
                        className="border-purple-500/30 text-purple-300 hover:bg-purple-800/30"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={() => onAddToCart(account.id, quantity)}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-300"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Agregar al Carrito
                    </Button>
                  </div>
                ) : (
                  <Button
                    disabled
                    className="w-full bg-gray-700 text-gray-400 font-semibold py-3 rounded-lg cursor-not-allowed"
                  >
                    Agotado
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}