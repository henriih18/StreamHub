import { Play, Shield, Clock, Users, Sparkles, TrendingUp, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="absolute inset-0 bg-black/20"></div>
        {/* Animated pattern overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Top badge */}
          <div className="flex justify-center mb-6">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 text-sm font-medium border-0">
              <Sparkles className="w-4 h-4 mr-2" />
              La plataforma #1 de cuentas streaming
            </Badge>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            Cuentas de Streaming
            <span className="block text-3xl md:text-5xl mt-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Premium Exclusivas
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Accede ilimitadamente a Netflix, Disney+, HBO Max, Amazon Prime y más. 
            <span className="block text-purple-300 font-semibold mt-2">Calidad 4K • Sin anuncios • Entrega inmediata</span>
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-3xl font-bold text-white">
                <TrendingUp className="w-8 h-8 text-green-400" />
                <span>50K+</span>
              </div>
              <p className="text-gray-400 text-sm">Clientes Activos</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-3xl font-bold text-white">
                <Star className="w-8 h-8 text-yellow-400" />
                <span>4.9</span>
              </div>
              <p className="text-gray-400 text-sm">Calificación</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-3xl font-bold text-white">
                <Shield className="w-8 h-8 text-blue-400" />
                <span>100%</span>
              </div>
              <p className="text-gray-400 text-sm">Garantía</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <Play className="mr-2 h-5 w-5" />
              Explorar Catálogo
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-purple-400 text-purple-300 hover:bg-purple-600 hover:text-white hover:border-purple-600 text-lg px-8 py-4 rounded-xl font-semibold transition-all duration-300">
              Comprar Ahora
            </Button>
          </div>

          {/* Features grid */}
          <div className="grid md:grid-cols-4 gap-6 mt-16">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">100% Seguro</h3>
                <p className="text-sm text-gray-300">
                  Compras protegidas con encriptación SSL
                </p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">Entrega Inmediata</h3>
                <p className="text-sm text-gray-300">
                  Recibe tu cuenta al instante
                </p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">Soporte 24/7</h3>
                <p className="text-sm text-gray-300">
                  Ayuda cuando la necesites
                </p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-white mb-2">Calidad 4K</h3>
                <p className="text-sm text-gray-300">
                  HDR y Dolby Atmos incluidos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </section>
  )
}