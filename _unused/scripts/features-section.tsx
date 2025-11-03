import { CheckCircle, Zap, Users, Headphones, Shield, Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Entrega Inmediata",
      description: "Recibe tus credenciales al instante después del pago. Sin esperas, sin complicaciones."
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: "Garantía de Seguridad",
      description: "Todas nuestras cuentas son verificadas y cuentan con garantía de funcionamiento."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Múltiples Perfiles",
      description: "Comparte tu cuenta con familiares y amigos. Hasta 4 perfiles disponibles."
    },
    {
      icon: <Headphones className="h-8 w-8 text-primary" />,
      title: "Soporte 24/7",
      description: "Equipo de soporte disponible las 24 horas para resolver cualquier duda o problema."
    },
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      title: "Acceso Global",
      description: "Funciona en cualquier país. Disfruta de tu contenido donde quieras, cuando quieras."
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-primary" />,
      title: "Calidad Premium",
      description: "Acceso a contenido en 4K HDR, Dolby Atmos y la mejor calidad de streaming."
    }
  ]

  return (
    <section id="features" className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30 px-4 py-2 mb-4">
            ¿Por Qué Elegirnos?
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            La Experiencia de Streaming
            <span className="block text-3xl md:text-4xl mt-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Definitiva
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            La plataforma más confiable para comprar cuentas de streaming 
            con el mejor servicio y calidad del mercado.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-purple-600/50 transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-4 group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-all duration-300">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-white group-hover:text-purple-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-3xl p-8 md:p-16 border border-purple-800/30 backdrop-blur-sm">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Listo para Disfrutar del Mejor Streaming?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Únete a miles de usuarios que ya disfrutan de nuestras cuentas premium 
              con la mejor calidad y servicio del mercado.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
                Ver Catálogo Completo
              </button>
              <button className="border-2 border-purple-500 text-purple-300 hover:bg-purple-600 hover:text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300">
                Contactar Soporte
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}