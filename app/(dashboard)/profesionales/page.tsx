'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { UserCheck, UserX, Stethoscope, AlertCircle } from 'lucide-react'
import { useRequirePermission } from '@/hooks/use-permissions'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Professional = {
  id: string
  institution_id: string
  first_name: string
  last_name: string
  speciality: string | null
  license_number: string | null
  email: string | null
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  institution?: {
    id: string
    name: string
    zone?: {
      name: string
    } | null
  }
}

export default function ProfesionalesPage() {
  const { hasAccess, loading: permissionLoading } = useRequirePermission('/profesionales')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchProfessionals = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('professional')
        .select(`
          *,
          institution:institution_id (
            id,
            name,
            zone:zone_id (
              name
            )
          )
        `)
        .order('last_name', { ascending: true })

      if (error) throw error
      setProfessionals(data || [])
    } catch (error) {
      console.error('Error fetching professionals:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar los profesionales",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProfessionals()
  }, [fetchProfessionals])


  const handleToggleActive = async (professional: Professional) => {
    try {
      const { error } = await supabase
        .from('professional')
        .update({
          is_active: !professional.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', professional.id)

      if (error) throw error
      
      toast({
        title: professional.is_active ? "Profesional desactivado" : "Profesional activado",
        description: `El profesional ha sido ${professional.is_active ? 'desactivado' : 'activado'} correctamente.`,
      })
      
      fetchProfessionals()
    } catch (error) {
      console.error('Error toggling professional status:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cambiar el estado del profesional",
      })
    }
  }


  if (permissionLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold">Profesionales</h1>
          <p className="text-muted-foreground">
            Visualiza los profesionales de tu institución y gestiona su disponibilidad
          </p>
        </div>
      </div>

      {/* Aviso informativo para admins */}
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Nota:</strong> Solo puedes activar/desactivar profesionales. Para crear, editar o eliminar profesionales, contacta al Super Administrador del sistema.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Stethoscope className="mr-2 h-5 w-5" />
            Profesionales de tu Institución
          </CardTitle>
          <CardDescription>
            Lista de profesionales asignados a tu institución
          </CardDescription>
        </CardHeader>
        <CardContent>
          {professionals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No hay profesionales registrados en tu institución. Contacta al Super Administrador para agregar profesionales.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre Completo</TableHead>
                  <TableHead>Institución</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professionals.map((professional) => (
                  <TableRow key={professional.id}>
                    <TableCell className="font-medium">
                      {professional.first_name} {professional.last_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{professional.institution?.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {professional.institution?.zone?.name || 'Sin zona'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {professional.speciality || (
                        <span className="text-muted-foreground">Sin especialidad</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {professional.license_number || (
                        <span className="text-muted-foreground">Sin matrícula</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {professional.email || (
                        <span className="text-muted-foreground">Sin email</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {professional.phone || (
                        <span className="text-muted-foreground">Sin teléfono</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={professional.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                        }
                      >
                        {professional.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={professional.is_active ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleActive(professional)}
                        title={professional.is_active ? 'Desactivar profesional' : 'Activar profesional'}
                      >
                        {professional.is_active ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activar
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}