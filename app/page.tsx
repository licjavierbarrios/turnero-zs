'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EyeIcon, EyeOffIcon, Loader2Icon } from 'lucide-react'

interface Institution {
  id: string
  name: string
  type: string
  zone_name: string
  address: string
  user_role: string
}

interface UserMembershipsResponse {
  user: any
  institutions: Institution[]
  hasMultipleInstitutions: boolean
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Autenticación real con Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      if (!data.user) {
        throw new Error('No se recibió información del usuario')
      }

      // Obtener token de sesión para las siguientes queries
      const session = await supabase.auth.getSession()
      if (!session.data.session?.access_token) {
        throw new Error('No se pudo obtener el token de sesión')
      }

      // Pre-cargar membresías del usuario usando el nuevo endpoint
      const response = await fetch('/api/user/memberships', {
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar membresías')
      }

      const membershipData: UserMembershipsResponse = await response.json()

      // Guardar datos en sessionStorage para evitar re-queries
      sessionStorage.setItem('user_data', JSON.stringify(membershipData.user))
      sessionStorage.setItem('user_institutions', JSON.stringify(membershipData.institutions))

      // Lógica de ruteo inteligente
      // 1. Si es super_admin → dashboard super-admin
      const isSuperAdmin = membershipData.institutions.some((inst: any) => inst.user_role === 'super_admin')
      if (isSuperAdmin) {
        router.push('/super-admin/zonas')
        return
      }

      // 2. Si tiene una sola institución → ir directamente a esa institución
      if (!membershipData.hasMultipleInstitutions && membershipData.institutions.length === 1) {
        const institution = membershipData.institutions[0]
        
        // Guardar contexto institucional
        const institutionContext = {
          institution_id: institution.id,
          institution_name: institution.name,
          institution_type: institution.type,
          zone_name: institution.zone_name,
          user_role: institution.user_role
        }
        localStorage.setItem('institution_context', JSON.stringify(institutionContext))

        // Rutear según el rol
        if (institution.user_role === 'pantalla') {
          router.push(`/pantalla/${institution.id}`)
        } else {
          router.push('/dashboard')
        }
        return
      }

      // 3. Si tiene múltiples instituciones → mostrar selector (con datos precargados)
      router.push('/institutions/select')
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Email o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Tarjeta visual elevada */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 border border-gray-100">
        {/* Logo como avatar circular */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-1 shadow-lg">
              <div className="w-full h-full rounded-full bg-white p-3 flex items-center justify-center">
                <img
                  src="/images/logo.png"
                  alt="Turnero ZS"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Turnero ZS
          </h1>
          <p className="text-gray-600 text-sm">
            Sistema de Gestión de Turnos para Centros de Salud
          </p>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          {/* Form Header */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Iniciar Sesión</h2>
            <p className="text-sm text-gray-500 mt-1">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.email@salud.gov.ar"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8 pt-6 border-t border-gray-100">
          <p>Versión 0.1.0 - Sistema de Turnos Zonales</p>
        </div>
      </div>
    </div>
  )
}
