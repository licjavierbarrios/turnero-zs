"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { MapPinIcon } from 'lucide-react'

interface Zone {
  id: string
  name: string
  institution_count: number
}

export default function PantallaSelectionPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchZones() {
      try {
        // Obtener todas las instituciones agrupadas por zona
        const { data: institutions, error: instError } = await supabase
          .from('institution')
          .select('zone_id, zone:zone_id(id, name)')

        if (instError) throw instError

        // Agrupar por zona y contar
        const zoneMap = new Map<string, { id: string; name: string; count: number }>()

        institutions?.forEach((inst: any) => {
          if (inst.zone) {
            const zoneId = inst.zone.id
            if (zoneMap.has(zoneId)) {
              zoneMap.get(zoneId)!.count++
            } else {
              zoneMap.set(zoneId, {
                id: inst.zone.id,
                name: inst.zone.name,
                count: 1
              })
            }
          }
        })

        // Convertir a array y ordenar por nombre
        const zonesArray = Array.from(zoneMap.values())
          .map(z => ({
            id: z.id,
            name: z.name,
            institution_count: z.count
          }))
          .sort((a, b) => a.name.localeCompare(b.name))

        setZones(zonesArray)
      } catch (err) {
        setError('Error al cargar las zonas sanitarias')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchZones()
  }, [])

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Pantalla Pública - Selección de Zona
          </h1>
          <p className="text-gray-600">
            Seleccione la zona sanitaria para ver sus instituciones
          </p>
        </div>

        {zones.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-500 mb-4">No hay zonas con instituciones disponibles</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Volver al inicio
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
              <Link
                key={zone.id}
                href={`/pantalla/zona/${zone.id}`}
                className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-all border-2 border-gray-200 hover:border-blue-400"
              >
                <div className="flex items-start mb-3">
                  <MapPinIcon className="h-6 w-6 text-blue-600 mr-3 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {zone.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {zone.institution_count} {zone.institution_count === 1 ? 'institución' : 'instituciones'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 text-sm text-blue-600 font-medium">
                  Ver instituciones →
                </div>
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