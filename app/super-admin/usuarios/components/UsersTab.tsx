'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit, Trash2, User, Eye, EyeOff } from 'lucide-react'

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

interface UsersTabProps {
  users: User[]
  memberships: Membership[]
  institutions: Institution[]
  zones: Zone[]
  loading: boolean
  selectedZone: string
  selectedInstitution: string
  userSearch: string
  filteredUsers: User[]
  filteredInstitutionsForFilter: Institution[]
  onZoneChange: (zone: string) => void
  onInstitutionChange: (institution: string) => void
  onSearchChange: (search: string) => void
  onEditUser: (user: User) => void
  onDeleteUser: (user: User) => void
}

export function UsersTab({
  users,
  memberships,
  institutions,
  zones,
  loading,
  selectedZone,
  selectedInstitution,
  userSearch,
  filteredUsers,
  filteredInstitutionsForFilter,
  onZoneChange,
  onInstitutionChange,
  onSearchChange,
  onEditUser,
  onDeleteUser
}: UsersTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Usuarios del Sistema
            </CardTitle>
            <CardDescription>
              Lista de todos los usuarios registrados en el sistema
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between min-h-[20px]">
              <Label htmlFor="zone_filter">Filtrar por Zona</Label>
              {selectedZone !== 'ALL' && (
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
            <Select value={selectedZone} onValueChange={onZoneChange}>
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
              <Label htmlFor="institution_filter">Filtrar por Institución</Label>
              {selectedInstitution !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => onInstitutionChange('ALL')}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Limpiar
                </button>
              )}
            </div>
            <Select value={selectedInstitution} onValueChange={onInstitutionChange} disabled={selectedZone === 'ALL'}>
              <SelectTrigger>
                <SelectValue placeholder={selectedZone === 'ALL' ? 'Selecciona una zona primero' : 'Todas las instituciones'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las instituciones</SelectItem>
                {filteredInstitutionsForFilter.map((institution) => (
                  <SelectItem key={institution.id} value={institution.name}>
                    {institution.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between min-h-[20px]">
              <Label htmlFor="user_search_filter">Buscar Usuario</Label>
              <div className="h-[20px]"></div>
            </div>
            <Input
              id="user_search_filter"
              type="text"
              placeholder="Nombre, apellido o email..."
              value={userSearch}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No hay usuarios registrados. Crea el primer usuario.
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No se encontraron usuarios con los filtros aplicados.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Instituciones</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const userMemberships = memberships.filter(m => m.user_id === user.id)
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {userMemberships.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">Sin instituciones</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {userMemberships.map((m) => (
                            <Badge key={m.id} variant="outline" className="text-xs">
                              {m.institution?.name} ({roleLabels[m.role]})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }
                      >
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteUser(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
