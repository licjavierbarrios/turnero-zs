'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Shield, Trash2 } from 'lucide-react'

type User = {
  id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type Membership = {
  id: string
  user_id: string
  institution_id: string
  role: 'super_admin' | 'admin' | 'administrativo' | 'medico' | 'enfermeria' | 'pantalla'
  is_active: boolean
  created_at: string
  updated_at: string
  user?: User
  institution?: {
    id: string
    name: string
    zone_name: string
  }
}

type Institution = {
  id: string
  name: string
  zone_name: string
}

type Zone = {
  id: string
  name: string
}

const roleLabels = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  administrativo: 'Administrativo',
  medico: 'Médico',
  enfermeria: 'Enfermería',
  pantalla: 'Pantalla'
}

const roleColors = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-red-100 text-red-800',
  administrativo: 'bg-blue-100 text-blue-800',
  medico: 'bg-green-100 text-green-800',
  enfermeria: 'bg-yellow-100 text-yellow-800',
  pantalla: 'bg-orange-100 text-orange-800'
}

interface MembershipsTabProps {
  memberships: Membership[]
  zones: Zone[]
  institutions: Institution[]
  loading: boolean
  membershipSelectedZone: string
  membershipSelectedInstitution: string
  membershipSearch: string
  filteredMemberships: Membership[]
  filteredMembershipInstitutions: Institution[]
  onZoneChange: (zone: string) => void
  onInstitutionChange: (institution: string) => void
  onSearchChange: (search: string) => void
  onEditMembership: (membership: Membership) => void
  onDeleteMembership: (membership: Membership) => void
}

export function MembershipsTab({
  memberships,
  zones,
  institutions,
  loading,
  membershipSelectedZone,
  membershipSelectedInstitution,
  membershipSearch,
  filteredMemberships,
  filteredMembershipInstitutions,
  onZoneChange,
  onInstitutionChange,
  onSearchChange,
  onEditMembership,
  onDeleteMembership
}: MembershipsTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Membresías del Sistema
            </CardTitle>
            <CardDescription>
              Gestiona los roles de todos los usuarios en todas las instituciones
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between min-h-[20px]">
              <Label htmlFor="membership_zone_filter">Filtrar por Zona</Label>
              {membershipSelectedZone !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    onZoneChange('ALL')
                    onInstitutionChange('ALL')
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Limpiar
                </button>
              )}
            </div>
            <Select value={membershipSelectedZone} onValueChange={onZoneChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las zonas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las zonas</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.name}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between min-h-[20px]">
              <Label htmlFor="membership_institution_filter">Filtrar por Institución</Label>
              {membershipSelectedInstitution !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => onInstitutionChange('ALL')}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Limpiar
                </button>
              )}
            </div>
            <Select
              value={membershipSelectedInstitution}
              onValueChange={onInstitutionChange}
              disabled={membershipSelectedZone === 'ALL'}
            >
              <SelectTrigger>
                <SelectValue placeholder={membershipSelectedZone === 'ALL' ? 'Selecciona una zona primero' : 'Todas las instituciones'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las instituciones</SelectItem>
                {filteredMembershipInstitutions.map((institution) => (
                  <SelectItem key={institution.id} value={institution.name}>
                    {institution.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between min-h-[20px]">
              <Label htmlFor="membership_search_filter">Buscar por Usuario</Label>
              <div className="h-[20px]"></div>
            </div>
            <Input
              id="membership_search_filter"
              type="text"
              placeholder="Nombre, apellido o email..."
              value={membershipSearch}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Cargando membresías...</p>
          </div>
        ) : memberships.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No hay membresías registradas. Crea la primera membresía.
            </p>
          </div>
        ) : filteredMemberships.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No se encontraron membresías con los filtros aplicados.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Institución</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMemberships.map((membership) => (
                <TableRow key={membership.id}>
                  <TableCell className="font-medium">
                    {membership.user ? (
                      <div className="flex flex-col">
                        <span>{membership.user.first_name} {membership.user.last_name}</span>
                        <span className="text-sm text-muted-foreground">{membership.user.email}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Usuario eliminado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {membership.institution ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{membership.institution.name}</span>
                        <span className="text-sm text-muted-foreground">{membership.institution.zone_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Institución eliminada</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={roleColors[membership.role]}>
                      {roleLabels[membership.role]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={membership.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                      }
                    >
                      {membership.is_active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(membership.created_at).toLocaleDateString('es-AR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditMembership(membership)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteMembership(membership)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
