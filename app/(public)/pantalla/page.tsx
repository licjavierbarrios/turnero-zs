"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MapPinIcon } from 'lucide-react'

export default function PantallaSelectionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkAccessAndRedirect() {
      try {
        // Verificar si el usuario está autenticado
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          // Si no está autenticado, redirigir al login
          router.push('/')
          return
        }

        // Obtener contexto institucional
        const contextData = localStorage.getItem('institution_context')

        if (!contextData) {
          setError('No se encontró contexto institucional. Por favor, selecciona una institución.')
          setLoading(false)
          return
        }

        const context = JSON.parse(contextData)

        // Verificar que el usuario tenga rol de admin o pantalla
        const allowedRoles = ['admin', 'pantalla', 'super_admin']
        if (!allowedRoles.includes(context.user_role)) {
          setError('No tienes permisos para acceder a la pantalla pública. Solo usuarios con rol admin o pantalla pueden acceder.')
          setLoading(false)
          return
        }

        // Redirigir directamente a la pantalla de su institución
        router.push(`/pantalla/${context.institution_id}`)
      } catch (err) {
        setError('Error al verificar permisos')
        console.error(err)
        setLoading(false)
      }
    }

    checkAccessAndRedirect()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando zonas sanitarias...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Mientras se verifica y redirige
  return null
}