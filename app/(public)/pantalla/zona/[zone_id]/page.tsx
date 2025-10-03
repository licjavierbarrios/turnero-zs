"use client"

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { BuildingIcon, ArrowLeftIcon } from 'lucide-react'

interface Institution {
  id: string
  name: string
  type: string
  slug: string
}

interface Zone {
  id: string
  name: string
}

export default function ZoneInstitutionsPage({
  params,
}: {
  params: Promise<{ zone_id: string }>
}) {
  const { zone_id } = use(params)
  const [zone, setZone] = useState<Zone | null>(null)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Obtener información de la zona
        const { data: zoneData, error: zoneError } = await supabase
          .from('zone')
          .select('id, name')
          .eq('id', zone_id)
          .single()

        if (zoneError) throw zoneError
        setZone(zoneData)

        // Obtener instituciones de esta zona
        const { data: institutionsData, error: institutionsError } = await supabase
          .from('institution')
          .select('id, name, type, slug')
          .eq('zone_id', zone_id)
          .order('name')

        if (institutionsError) throw institutionsError

        setInstitutions(institutionsData || [])
      } catch (err) {
        setError('Error al cargar las instituciones de la zona')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [zone_id])

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

  if (error || !zone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || 'Zona no encontrada'}</p>
          <Link
            href="/pantalla"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a zonas
          </Link>
        </div>
      </div>
    )
  }

  const getInstitutionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'caps': 'CAPS',
      'hospital_seccional': 'Hospital Seccional',
      'hospital_distrital': 'Hospital Distrital',
      'hospital_regional': 'Hospital Regional'
    }
    return labels[type] || type
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/pantalla"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Volver a zonas
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {zone.name}
          </h1>
          <p className="text-gray-600">
            Seleccione una institución para ver su pantalla pública
          </p>
        </div>

        {/* Institutions Grid */}
        {institutions.length === 0 ? (
          <div className="text-center py-12">
            <BuildingIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              No hay instituciones disponibles en esta zona
            </p>
            <Link
              href="/pantalla"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Volver a zonas
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {institutions.map((institution) => (
              <Link
                key={institution.id}
                href={`/pantalla/${institution.slug}`}
                className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-gray-200 hover:border-blue-400"
              >
                <div className="flex items-start mb-3">
                  <BuildingIcon className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {institution.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getInstitutionTypeLabel(institution.type)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-blue-600 font-medium">
                  Ver pantalla pública →
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Back button */}
        <div className="mt-8 text-center">
          <Link
            href="/pantalla"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Volver a zonas
          </Link>
        </div>
      </div>
    </div>
  )
}
