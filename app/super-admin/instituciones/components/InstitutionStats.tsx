'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, MapPin } from 'lucide-react'
import type { Institution, Zone } from '@/lib/types'

type InstitutionWithZone = Institution & {
  zone?: Zone
}

interface InstitutionStatsProps {
  institutions: InstitutionWithZone[]
}

export function InstitutionStats({ institutions }: InstitutionStatsProps) {
  const capsCount = institutions.filter(i => i.type === 'caps').length
  const hospitalsCount = institutions.filter(i => i.type !== 'caps').length

  const institutionsByZone = institutions.reduce((acc, inst) => {
    const zoneName = inst.zone?.name || 'Sin zona'
    if (!acc[zoneName]) acc[zoneName] = []
    acc[zoneName].push(inst)
    return acc
  }, {} as Record<string, InstitutionWithZone[]>)

  const activeZonesCount = Object.keys(institutionsByZone).length

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Instituciones</CardTitle>
          <Building2 className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{institutions.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CAPS</CardTitle>
          <Building2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{capsCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hospitales</CardTitle>
          <Building2 className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{hospitalsCount}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Zonas Activas</CardTitle>
          <MapPin className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeZonesCount}</div>
        </CardContent>
      </Card>
    </div>
  )
}
