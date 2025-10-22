'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Building2 } from 'lucide-react'
import type { Zone } from '@/lib/types'

interface ZoneStatsProps {
  zones: Zone[]
  institutionCounts: Record<string, number>
}

export function ZoneStats({ zones, institutionCounts }: ZoneStatsProps) {
  const totalInstitutions = Object.values(institutionCounts).reduce((a, b) => a + b, 0)
  const averageInstitutions = zones.length > 0 ? Math.round(totalInstitutions / zones.length) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Zonas</CardTitle>
          <MapPin className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{zones.length}</div>
          <p className="text-xs text-gray-500 mt-1">
            Zonas sanitarias registradas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Instituciones</CardTitle>
          <Building2 className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInstitutions}</div>
          <p className="text-xs text-gray-500 mt-1">
            Instituciones en todas las zonas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promedio</CardTitle>
          <Building2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageInstitutions}</div>
          <p className="text-xs text-gray-500 mt-1">
            Instituciones por zona
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
