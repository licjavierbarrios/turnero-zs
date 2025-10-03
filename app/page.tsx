'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import Link from 'next/link'

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
      // Demo: Usuarios de prueba
      const demoUsers = [
        { email: 'juan.paredes@salud.gov.ar', password: 'demo123', name: 'Dr. Juan Paredes' },
        { email: 'maria.lopez@salud.gov.ar', password: 'demo123', name: 'Enfermera María López' },
        { email: 'admin@salud.gov.ar', password: 'admin123', name: 'Administrador Sistema' }
      ]

      const user = demoUsers.find(u => u.email === email && u.password === password)

      if (user) {
        // Simular autenticación exitosa
        localStorage.setItem('user', JSON.stringify(user))
        router.push('/institutions/select')
      } else {
        setError('Email o contraseña incorrectos')
      }
    } catch (error) {
      setError('Error al iniciar sesión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Turnero ZS
          </h1>
          <p className="text-gray-600">
            Sistema de Gestión de Turnos para Centros de Salud
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
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
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-blue-900">
              Usuarios de Demostración
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <div>
              <strong>Dr. Juan Paredes:</strong> juan.paredes@salud.gov.ar / demo123
            </div>
            <div>
              <strong>Enfermera María López:</strong> maria.lopez@salud.gov.ar / demo123
            </div>
            <div>
              <strong>Administrador:</strong> admin@salud.gov.ar / admin123
            </div>
          </CardContent>
        </Card>

        {/* Public Screen Link */}
        <div className="text-center">
          <Link
            href="/pantalla"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Ver Pantalla Pública
          </Link>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>Versión 0.1.0 - Sistema de Turnos Zonales</p>
        </div>
      </div>
    </div>
  )
}