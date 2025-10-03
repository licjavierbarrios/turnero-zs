"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Institution {
  id: string
  name: string
  type: string
  slug: string
}

export default function PantallaSelectionPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInstitutions() {
      try {
        const { data, error } = await supabase
          .from('institution')
          .select('id, name, type, slug')
          .order('name')

        if (error) throw error

        setInstitutions(data || [])
      } catch (err) {
        setError('Error al cargar las instituciones')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchInstitutions()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando instituciones...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Pantalla Pública
          </h1>
          <p className="text-gray-600">
            Seleccione la institución para mostrar la pantalla pública
          </p>
        </div>

        {institutions.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-500 mb-4">No hay instituciones disponibles</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {institutions.map((institution) => (
              <Link
                key={institution.id}
                href={`/pantalla/${institution.slug}`}
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 hover:border-blue-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {institution.name}
                </h3>
                <p className="text-sm text-gray-500 capitalize">
                  {institution.type.replace('_', ' ')}
                </p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}