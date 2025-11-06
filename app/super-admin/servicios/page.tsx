'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Briefcase } from 'lucide-react'
import { FilterBar } from './components/FilterBar'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Service {
  id: string
  institution_id: string
  name: string
  description: string | null
  duration_minutes: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  institution?: {
    id: string
    name: string
    zone?: {
      id: string
      name: string
    } | null
  }
}

interface Zone {
  id: string
  name: string
}

interface Institution {
  id: string
  name: string
  zone_id: string
}

export default function SuperAdminServiciosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [selectedZone, setSelectedZone] = useState('')
  const [selectedInstitution, setSelectedInstitution] = useState('')
  const [searchTerm, setSearchTerm] = useState('')


  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar zonas (excluyendo Sistema)
      const { data: zonesData, error: zonesError } = await supabase
        .from('zone')
        .select('id, name')
        .neq('name', 'Sistema')
        .order('name', { ascending: true })

      if (zonesError) throw zonesError
      setZones(zonesData || [])

      // Cargar instituciones (excluyendo Administración del Sistema)
      const { data: institutionsData, error: institutionsError } = await supabase
        .from('institution')
        .select('id, name, zone_id')
        .neq('name', 'Administración del Sistema')
        .order('name', { ascending: true })

      if (institutionsError) throw institutionsError
      setInstitutions(institutionsData || [])

      // Cargar servicios
      const { data: servicesData, error: servicesError } = await supabase
        .from('service')
        .select(`
          *,
          institution:institution_id (
            id,
            name,
            zone:zone_id (
              id,
              name
            )
          )
        `)
        .order('name', { ascending: true })

      if (servicesError) throw servicesError
      setServices(servicesData || [])
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar servicios
  const filteredServices = services.filter((service) => {
    // Buscar la institución en el array de instituciones
    const institution = institutions.find((inst) => inst.id === service.institution_id)

    // Normalizar 'all' a string vacío
    const normalizedSelectedInstitution = selectedInstitution === 'all' ? '' : selectedInstitution

    const matchesZone =
      !selectedZone || institution?.zone_id === selectedZone
    const matchesInstitution =
      !normalizedSelectedInstitution || service.institution_id === normalizedSelectedInstitution
    const matchesSearch =
      !searchTerm ||
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesZone && matchesInstitution && matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Briefcase className="h-8 w-8" />
          Gestión de Servicios
        </h1>
        <p className="text-muted-foreground mt-1">
          Consulta el listado de servicios ofrecidos por las instituciones
        </p>
      </div>

      {/* Filtros */}
      <FilterBar
        zones={zones}
        institutions={institutions}
        selectedZone={selectedZone}
        selectedInstitution={selectedInstitution}
        searchTerm={searchTerm}
        onZoneChange={setSelectedZone}
        onInstitutionChange={setSelectedInstitution}
        onSearchChange={setSearchTerm}
      />

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
          {error}
        </div>
      )}

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios Registrados</CardTitle>
          <CardDescription>
            Total: {filteredServices.length} servicio(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {services.length === 0
                  ? 'No hay servicios registrados en el sistema.'
                  : 'No hay servicios que coincidan con los filtros seleccionados.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Servicio</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Duración (minutos)</TableHead>
                    <TableHead>Institución</TableHead>
                    <TableHead>Zona</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => {
                    const institution = institutions.find((inst) => inst.id === service.institution_id)
                    return (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">
                          {service.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {service.description || '-'}
                        </TableCell>
                        <TableCell>
                          {service.duration_minutes || '-'}
                        </TableCell>
                        <TableCell>
                          {service.institution?.name || '-'}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const zone = zones.find((z) => z.id === institution?.zone_id)
                            return zone?.name || '-'
                          })()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(
                            new Date(service.created_at),
                            'd MMM yyyy',
                            { locale: es }
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={service.is_active ? 'default' : 'secondary'}>
                            {service.is_active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
