'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Eye, EyeOff, User, Mail, Phone, Lock, Check, X, AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui/toast-custom'

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [availability, setAvailability] = useState<Record<string, { available: boolean; message: string; checking: boolean }>>({})
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({})

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: ''
  })

  const checkAvailability = async (field: string, value: string) => {
    if (!value || value.length < 3) {
      setAvailability(prev => ({ ...prev, [field]: { available: false, message: '', checking: false } }))
      return
    }

    // Limpiar timer anterior
    if (debounceTimers.current[field]) {
      clearTimeout(debounceTimers.current[field])
    }

    // Mostrar estado de verificación
    setAvailability(prev => ({ ...prev, [field]: { available: false, message: '', checking: true } }))

    // Debounce de 500ms
    debounceTimers.current[field] = setTimeout(async () => {
      try {
        const response = await fetch(`/api/auth/check-availability?type=${field}&value=${encodeURIComponent(value)}`)
        const data = await response.json()
        
        if (response.ok) {
          setAvailability(prev => ({ 
            ...prev, 
            [field]: { 
              available: data.available, 
              message: data.message, 
              checking: false 
            } 
          }))
        } else {
          setAvailability(prev => ({ 
            ...prev, 
            [field]: { 
              available: false, 
              message: '', 
              checking: false 
            } 
          }))
        }
      } catch (error) {
        setAvailability(prev => ({ 
          ...prev, 
          [field]: { 
            available: false, 
            message: '', 
            checking: false 
          } 
        }))
      }
    }, 500)
  }

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => {
        if (timer) clearTimeout(timer)
      })
    }
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validación de nombre completo
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido'
    } else if (formData.fullName.length < 3) {
      newErrors.fullName = 'El nombre debe tener al menos 3 caracteres'
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    // Validación de teléfono
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido'
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'El teléfono no es válido'
    }

    // Validación de username
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido'
    } else if (!usernameRegex.test(formData.username)) {
      newErrors.username = 'Solo letras, números y guiones bajos (3-20 caracteres)'
    }

    // Validación de contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Debe incluir mayúsculas, minúsculas y números'
    }

    // Validación de confirmación
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          username: formData.username,
          password: formData.password,
          country: 'CO', // Valor por defecto
          language: 'es', // Valor por defecto
          acceptMarketing: false
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('¡Cuenta creada exitosamente! Por favor inicia sesión.')
        // Redirigir a la página de login
        router.push('/login')
      } else {
        toast.error(data.error || 'Error al crear la cuenta')
        if (data.field) {
          setErrors({ [data.field]: data.error })
        }
      }
    } catch (error) {
      toast.error('Error de conexión. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Verificar disponibilidad para email y username
    if (field === 'email' && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (emailRegex.test(value)) {
        checkAvailability('email', value)
      } else {
        setAvailability(prev => ({ ...prev, email: { available: false, message: '', checking: false } }))
      }
    } else if (field === 'username' && typeof value === 'string') {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
      if (usernameRegex.test(value)) {
        checkAvailability('username', value)
      } else {
        setAvailability(prev => ({ ...prev, username: { available: false, message: '', checking: false } }))
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Crear Cuenta
            </CardTitle>
            <CardDescription className="text-slate-400">
              Únete a StreamHub y accede al mejor contenido
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre Completo */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">
                  Nombre Completo *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Pérez"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 ${
                    errors.fullName ? 'border-red-400' : ''
                  }`}
                  disabled={isLoading}
                />
                {errors.fullName && (
                  <p className="text-red-400 text-sm">{errors.fullName}</p>
                )}
              </div>

              {/* Nombre de Usuario */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">
                  Nombre de Usuario *
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="juanperez"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10 ${
                      errors.username ? 'border-red-400' : ''
                    } ${
                      availability.username?.available === true ? 'border-green-400' : ''
                    } ${
                      availability.username?.available === false ? 'border-red-400' : ''
                    }`}
                    disabled={isLoading}
                  />
                  {availability.username?.checking && (
                    <div className="absolute right-0 top-0 h-full px-3 flex items-center">
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    </div>
                  )}
                  {availability.username?.available === true && !availability.username?.checking && (
                    <div className="absolute right-0 top-0 h-full px-3 flex items-center">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  {availability.username?.available === false && !availability.username?.checking && (
                    <div className="absolute right-0 top-0 h-full px-3 flex items-center">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                  )}
                </div>
                {errors.username && (
                  <p className="text-red-400 text-sm">{errors.username}</p>
                )}
                {availability.username?.message && !errors.username && (
                  <p className={`text-sm ${
                    availability.username.available ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {availability.username.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email *
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10 ${
                      errors.email ? 'border-red-400' : ''
                    } ${
                      availability.email?.available === true ? 'border-green-400' : ''
                    } ${
                      availability.email?.available === false ? 'border-red-400' : ''
                    }`}
                    disabled={isLoading}
                  />
                  {availability.email?.checking && (
                    <div className="absolute right-0 top-0 h-full px-3 flex items-center">
                      <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    </div>
                  )}
                  {availability.email?.available === true && !availability.email?.checking && (
                    <div className="absolute right-0 top-0 h-full px-3 flex items-center">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                  )}
                  {availability.email?.available === false && !availability.email?.checking && (
                    <div className="absolute right-0 top-0 h-full px-3 flex items-center">
                      <X className="w-4 h-4 text-red-400" />
                    </div>
                  )}
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email}</p>
                )}
                {availability.email?.message && !errors.email && (
                  <p className={`text-sm ${
                    availability.email.available ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {availability.email.message}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">
                  Teléfono *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+57 300 123 4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 ${
                    errors.phone ? 'border-red-400' : ''
                  }`}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="text-red-400 text-sm">{errors.phone}</p>
                )}
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Contraseña *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10 ${
                      errors.password ? 'border-red-400' : ''
                    }`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm">{errors.password}</p>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  Confirmar Contraseña *
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-10 ${
                      errors.confirmPassword ? 'border-red-400' : ''
                    }`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Botón de Registro */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 mr-2" />
                    Crear Cuenta
                  </>
                )}
              </Button>

              {/* Link para Login */}
              <div className="text-center">
                <p className="text-slate-400">
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    href="/login"
                    className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                  >
                    Inicia Sesión
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}