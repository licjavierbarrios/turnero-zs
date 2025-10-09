'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MonitorIcon, AlertCircle } from 'lucide-react'

export default function PantallaLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Intentar login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('No se pudo autenticar')
      }

      // Verificar que el usuario tenga un display_device asociado
      const { data: displayDevice, error: displayError } = await supabase
        .from('display_devices')
        .select(`
          id,
          institution_id,
          name,
          type,
          is_active,
          institution:institution_id (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .single()

      if (displayError || !displayDevice) {
        throw new Error('Este usuario no está configurado como pantalla de visualización')
      }

      // Actualizar last_seen_at
      await supabase
        .from('display_devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', displayDevice.id)

      // Redirigir a la pantalla correspondiente
      const institution = displayDevice.institution as any
      const slug = institution.slug || institution.id
      router.push(`/pantalla/${slug}`)
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2">
            <MonitorIcon className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Pantalla Pública</CardTitle>
          <CardDescription>
            Ingresa con tu cuenta de pantalla de visualización
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="pantalla@institucion.gob.ar"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>

            <p className="text-sm text-center text-gray-600 mt-4">
              ¿No tienes cuenta? Contacta al administrador del sistema
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
