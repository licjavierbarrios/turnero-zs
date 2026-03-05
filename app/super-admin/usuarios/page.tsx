'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import {
  Plus, Edit, UserCheck, UserX, Users, Search, AlertCircle,
} from 'lucide-react'

// ============================================================
// Types
// ============================================================
type AllRole = 'admin' | 'administrativo' | 'profesional' | 'servicio' | 'pantalla'

type Zone = { id: string; name: string }
type Institution = { id: string; name: string; zone_id: string; zone_name: string }
type ServiceOption = { id: string; name: string; institution_id: string }

type StaffRow = {
  membershipId: string
  userId: string
  firstName: string
  lastName: string
  email: string
  userActive: boolean
  role: AllRole
  institutionId: string
  institutionName: string
  zoneId: string
  zoneName: string
  professional?: {
    id: string
    professionalType: string | null
    speciality: string | null
    licenseNumber: string | null
  }
  userService?: {
    id: string
    serviceId: string
    serviceName: string
  }
}

type FormState = {
  firstName: string
  lastName: string
  email: string
  password: string
  isActive: boolean
  zoneId: string
  institutionId: string
  role: AllRole | ''
  // profesional
  professionalType: string
  speciality: string
  licenseNumber: string
  // servicio
  serviceId: string
}

// ============================================================
// Constants
// ============================================================
const ROLE_LABELS: Record<AllRole, string> = {
  admin: 'Administrador',
  administrativo: 'Administrativo',
  profesional: 'Profesional',
  servicio: 'Servicio',
  pantalla: 'Pantalla',
}

const ROLE_COLORS: Record<AllRole, string> = {
  admin: 'bg-red-100 text-red-800',
  administrativo: 'bg-blue-100 text-blue-800',
  profesional: 'bg-green-100 text-green-800',
  servicio: 'bg-purple-100 text-purple-800',
  pantalla: 'bg-orange-100 text-orange-800',
}

const PROFESSIONAL_TYPES = [
  { value: 'medico', label: 'Médico/a' },
  { value: 'psicologo', label: 'Psicólogo/a' },
  { value: 'nutricionista', label: 'Nutricionista' },
  { value: 'odontologo', label: 'Odontólogo/a' },
  { value: 'enfermero', label: 'Enfermero/a' },
  { value: 'tecnico', label: 'Técnico/a' },
  { value: 'otro', label: 'Otro' },
]

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  isActive: true,
  zoneId: '',
  institutionId: '',
  role: '',
  professionalType: '',
  speciality: '',
  licenseNumber: '',
  serviceId: '',
}

// ============================================================
// Component
// ============================================================
export default function SuperAdminUsuariosPage() {
  const { toast } = useToast()

  // Data
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterZone, setFilterZone] = useState('ALL')
  const [filterInstitution, setFilterInstitution] = useState('ALL')
  const [filterRole, setFilterRole] = useState<AllRole | 'ALL'>('ALL')

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<StaffRow | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [roleChangeWarning, setRoleChangeWarning] = useState(false)

  // Toggle active confirmation
  const [toggleTarget, setToggleTarget] = useState<StaffRow | null>(null)

  // ============================================================
  // Computed: institutions filtered by selected zone (for filter bar)
  // ============================================================
  const filteredZoneInstitutions = useMemo(() => {
    if (filterZone === 'ALL') return institutions
    return institutions.filter((i) => i.zone_id === filterZone)
  }, [filterZone, institutions])

  // Computed: institutions filtered by form zone
  const formInstitutions = useMemo(() => {
    if (!form.zoneId) return []
    return institutions.filter((i) => i.zone_id === form.zoneId)
  }, [form.zoneId, institutions])

  // Computed: services filtered by form institution
  const formServices = useMemo(() => {
    if (!form.institutionId) return []
    return services.filter((s) => s.institution_id === form.institutionId)
  }, [form.institutionId, services])

  // ============================================================
  // Filtered staff rows
  // ============================================================
  const filteredStaff = useMemo(() => {
    let rows = staff

    if (filterZone !== 'ALL') {
      rows = rows.filter((r) => r.zoneId === filterZone)
    }
    if (filterInstitution !== 'ALL') {
      rows = rows.filter((r) => r.institutionId === filterInstitution)
    }
    if (filterRole !== 'ALL') {
      rows = rows.filter((r) => r.role === filterRole)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (r) =>
          r.firstName.toLowerCase().includes(q) ||
          r.lastName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q)
      )
    }

    return rows
  }, [staff, filterZone, filterInstitution, filterRole, search])

  // Reset institution filter when zone changes
  useEffect(() => {
    setFilterInstitution('ALL')
  }, [filterZone])

  // Reset institution in form when zone changes
  useEffect(() => {
    setForm((prev) => ({ ...prev, institutionId: '', serviceId: '' }))
  }, [form.zoneId])

  // Reset serviceId in form when institution changes
  useEffect(() => {
    setForm((prev) => ({ ...prev, serviceId: '' }))
  }, [form.institutionId])

  // ============================================================
  // Data fetching
  // ============================================================
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [membRes, profRes, usRes, zoneRes, instRes, svcRes] = await Promise.all([
        // All memberships excluding super_admin
        supabase
          .from('membership')
          .select(`
            id, user_id, role, is_active,
            user:user_id (id, email, first_name, last_name, is_active),
            institution:institution_id (id, name, zone_id, zone:zone_id(id, name))
          `)
          .neq('role', 'super_admin')
          .order('created_at', { ascending: false }),

        // All professionals
        supabase
          .from('professional')
          .select('id, user_id, institution_id, professional_type, speciality, license_number'),

        // All user_services (active only)
        supabase
          .from('user_service')
          .select('id, user_id, service_id, institution_id, service:service_id(name)')
          .eq('is_active', true),

        // Zones
        supabase.from('zone').select('id, name').order('name'),

        // Institutions
        supabase
          .from('institution')
          .select('id, name, zone_id, zone:zone_id(id, name)')
          .order('name'),

        // All services (for form dropdown)
        supabase.from('service').select('id, name, institution_id').eq('is_active', true).order('name'),
      ])

      if (membRes.error) throw membRes.error

      // Build lookup maps (by user_id + institution_id for professionals and user_services)
      const profMap = new Map<string, any>()
      for (const p of profRes.data || []) {
        profMap.set(`${p.user_id}:${p.institution_id}`, p)
      }

      const usMap = new Map<string, any>()
      for (const us of usRes.data || []) {
        usMap.set(`${us.user_id}:${us.institution_id}`, us)
      }

      // Build staff rows
      const rows: StaffRow[] = (membRes.data || []).map((m: any) => {
        const u = m.user || {}
        const inst = m.institution || {}
        const zone = inst.zone || {}
        const key = `${m.user_id}:${inst.id}`
        const prof = profMap.get(key)
        const us = usMap.get(key)

        return {
          membershipId: m.id,
          userId: m.user_id,
          firstName: u.first_name || '',
          lastName: u.last_name || '',
          email: u.email || '',
          userActive: u.is_active ?? true,
          role: m.role as AllRole,
          institutionId: inst.id || '',
          institutionName: inst.name || '',
          zoneId: zone.id || '',
          zoneName: zone.name || '',
          professional: prof
            ? {
                id: prof.id,
                professionalType: prof.professional_type,
                speciality: prof.speciality,
                licenseNumber: prof.license_number,
              }
            : undefined,
          userService: us
            ? {
                id: us.id,
                serviceId: us.service_id,
                serviceName: (us.service as any)?.name || '',
              }
            : undefined,
        }
      })

      setStaff(rows)
      setZones((zoneRes.data || []).map((z: any) => ({ id: z.id, name: z.name })))
      setInstitutions(
        (instRes.data || []).map((i: any) => ({
          id: i.id,
          name: i.name,
          zone_id: i.zone_id,
          zone_name: i.zone?.name || '',
        }))
      )
      setServices(svcRes.data || [])
    } catch (err: any) {
      console.error('Error fetching staff:', err)
      toast({ title: 'Error al cargar el personal', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ============================================================
  // Dialog helpers
  // ============================================================
  const openCreate = () => {
    setEditingRow(null)
    setForm(EMPTY_FORM)
    setError(null)
    setRoleChangeWarning(false)
    setDialogOpen(true)
  }

  const openEdit = (row: StaffRow) => {
    setEditingRow(row)
    const inst = institutions.find((i) => i.id === row.institutionId)
    setForm({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      password: '',
      isActive: row.userActive,
      zoneId: inst?.zone_id || '',
      institutionId: row.institutionId,
      role: row.role,
      professionalType: row.professional?.professionalType || '',
      speciality: row.professional?.speciality || '',
      licenseNumber: row.professional?.licenseNumber || '',
      serviceId: row.userService?.serviceId || '',
    })
    setError(null)
    setRoleChangeWarning(false)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingRow(null)
    setForm(EMPTY_FORM)
    setError(null)
    setRoleChangeWarning(false)
  }

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'role' && editingRow) {
        setRoleChangeWarning(value !== editingRow.role)
      }
      return next
    })
  }

  // ============================================================
  // Create
  // ============================================================
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.institutionId) { setError('Seleccioná una institución'); return }
    if (!form.role) { setError('Seleccioná un rol'); return }
    if (form.role === 'profesional' && !form.professionalType) {
      setError('Seleccioná el tipo de profesional'); return
    }
    if (form.role === 'servicio' && !form.serviceId) {
      setError('Seleccioná el servicio'); return
    }

    setIsSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sin sesión activa')

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          first_name: form.firstName,
          last_name: form.lastName,
          is_active: form.isActive,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al crear usuario')
      }
      const { user: newUser } = await res.json()

      // Membresía
      const { error: membErr } = await supabase.from('membership').insert({
        user_id: newUser.id,
        institution_id: form.institutionId,
        role: form.role,
        is_active: true,
      })
      if (membErr) throw membErr

      // Registro de rol específico
      await createRoleRecord(newUser.id, form)

      toast({
        title: 'Personal creado',
        description: `${form.firstName} ${form.lastName} creado como ${ROLE_LABELS[form.role as AllRole]}.`,
      })
      closeDialog()
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Error al crear el usuario')
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================================
  // Edit
  // ============================================================
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRow) return
    setError(null)

    if (!form.role) { setError('Seleccioná un rol'); return }
    if (form.role === 'profesional' && !form.professionalType) {
      setError('Seleccioná el tipo de profesional'); return
    }
    if (form.role === 'servicio' && !form.serviceId) {
      setError('Seleccioná el servicio'); return
    }

    setIsSaving(true)
    try {
      // Actualizar usuario
      const { error: userErr } = await supabase
        .from('users')
        .update({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          is_active: form.isActive,
        })
        .eq('id', editingRow.userId)
      if (userErr) throw userErr

      const roleChanged = form.role !== editingRow.role

      if (roleChanged) {
        await deleteRoleRecord(editingRow)
        const { error: membErr } = await supabase
          .from('membership')
          .update({ role: form.role })
          .eq('id', editingRow.membershipId)
        if (membErr) throw membErr
        await createRoleRecord(editingRow.userId, form)
      } else {
        await updateRoleRecord(editingRow, form)
      }

      toast({ title: 'Personal actualizado' })
      closeDialog()
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Error al actualizar')
    } finally {
      setIsSaving(false)
    }
  }

  // ============================================================
  // Role record helpers
  // ============================================================
  const createRoleRecord = async (userId: string, f: FormState) => {
    if (f.role === 'profesional') {
      const { error } = await supabase.from('professional').insert({
        user_id: userId,
        institution_id: f.institutionId,
        first_name: f.firstName,
        last_name: f.lastName,
        email: f.email,
        professional_type: f.professionalType,
        speciality: f.speciality || null,
        license_number: f.licenseNumber || null,
        is_active: true,
      })
      if (error) throw error
    } else if (f.role === 'servicio') {
      const { error } = await supabase.from('user_service').insert({
        user_id: userId,
        service_id: f.serviceId,
        institution_id: f.institutionId,
        is_active: true,
      })
      if (error) throw error
    }
  }

  const deleteRoleRecord = async (row: StaffRow) => {
    if (row.role === 'profesional' && row.professional) {
      const { error } = await supabase.from('professional').delete().eq('id', row.professional.id)
      if (error) throw error
    } else if (row.role === 'servicio' && row.userService) {
      const { error } = await supabase.from('user_service').delete().eq('id', row.userService.id)
      if (error) throw error
    }
  }

  const updateRoleRecord = async (row: StaffRow, f: FormState) => {
    if (f.role === 'profesional' && row.professional) {
      const { error } = await supabase
        .from('professional')
        .update({
          professional_type: f.professionalType,
          speciality: f.speciality || null,
          license_number: f.licenseNumber || null,
          first_name: f.firstName,
          last_name: f.lastName,
          email: f.email,
        })
        .eq('id', row.professional.id)
      if (error) throw error
    } else if (f.role === 'servicio' && row.userService) {
      const { error } = await supabase
        .from('user_service')
        .update({ service_id: f.serviceId })
        .eq('id', row.userService.id)
      if (error) throw error
    } else if ((f.role === 'profesional' || f.role === 'servicio') && !row.professional && !row.userService) {
      await createRoleRecord(row.userId, f)
    }
  }

  // ============================================================
  // Toggle active
  // ============================================================
  const handleToggleActive = async () => {
    if (!toggleTarget) return
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !toggleTarget.userActive })
        .eq('id', toggleTarget.userId)
      if (error) throw error

      toast({
        title: toggleTarget.userActive ? 'Usuario desactivado' : 'Usuario activado',
      })
      setToggleTarget(null)
      fetchData()
    } catch {
      toast({ title: 'Error al cambiar el estado', variant: 'destructive' })
    }
  }

  // ============================================================
  // Detail cell
  // ============================================================
  const renderDetail = (row: StaffRow) => {
    if (row.role === 'profesional' && row.professional) {
      const type =
        PROFESSIONAL_TYPES.find((t) => t.value === row.professional!.professionalType)?.label ||
        row.professional.professionalType
      const parts = [type, row.professional.speciality].filter(Boolean)
      return <span className="text-sm text-gray-700">{parts.join(' · ') || '—'}</span>
    }
    if (row.role === 'servicio' && row.userService) {
      return <span className="text-sm text-gray-700">{row.userService.serviceName}</span>
    }
    return <span className="text-sm text-gray-400">—</span>
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personal del Sistema</h1>
          <p className="text-muted-foreground">
            Todos los usuarios con acceso a instituciones — {filteredStaff.length} resultado{filteredStaff.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Personal
        </Button>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Zone filter */}
        <Select value={filterZone} onValueChange={setFilterZone}>
          <SelectTrigger>
            <SelectValue placeholder="Todas las zonas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las zonas</SelectItem>
            {zones.map((z) => (
              <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Institution filter */}
        <Select
          value={filterInstitution}
          onValueChange={setFilterInstitution}
          disabled={filteredZoneInstitutions.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas las instituciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las instituciones</SelectItem>
            {filteredZoneInstitutions.map((i) => (
              <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Role filter */}
        <Select value={filterRole} onValueChange={(v) => setFilterRole(v as AllRole | 'ALL')}>
          <SelectTrigger>
            <SelectValue placeholder="Todos los roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los roles</SelectItem>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Personal
          </CardTitle>
          <CardDescription>
            {staff.length} total · {filteredStaff.length} mostrado{filteredStaff.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Cargando...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {staff.length === 0
                ? 'No hay personal registrado. Creá el primero.'
                : 'Sin resultados para los filtros aplicados.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Nombre</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Email</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Institución</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Rol</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Detalle</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Estado</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredStaff.map((row) => (
                    <tr key={row.membershipId} className="hover:bg-gray-50">
                      <td className="py-3 px-2 font-medium">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="py-3 px-2 text-gray-600">{row.email}</td>
                      <td className="py-3 px-2">
                        <div className="flex flex-col">
                          <span className="text-gray-800">{row.institutionName}</span>
                          <span className="text-xs text-gray-400">{row.zoneName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={ROLE_COLORS[row.role]}>
                          {ROLE_LABELS[row.role]}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">{renderDetail(row)}</td>
                      <td className="py-3 px-2">
                        <Badge
                          className={
                            row.userActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {row.userActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(row)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setToggleTarget(row)}
                            title={row.userActive ? 'Desactivar' : 'Activar'}
                          >
                            {row.userActive ? (
                              <UserX className="h-4 w-4 text-red-500" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Create / Edit Dialog                                          */}
      {/* ============================================================ */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRow ? 'Editar Personal' : 'Nuevo Personal'}</DialogTitle>
            <DialogDescription>
              {editingRow
                ? 'Modificá los datos del usuario'
                : 'Creá un nuevo usuario y asignalo a una institución'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={editingRow ? handleEdit : handleCreate}
            className="space-y-4 mt-2"
          >
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Nombre / Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  placeholder="Nombre"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  placeholder="Apellido"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="email@ejemplo.com"
                required
              />
            </div>

            {/* Contraseña (solo creación) */}
            {!editingRow && (
              <div className="space-y-1.5">
                <Label>Contraseña * (mínimo 8 caracteres)</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder="Contraseña"
                  required
                  minLength={8}
                />
              </div>
            )}

            {/* Zona */}
            <div className="space-y-1.5">
              <Label>Zona Sanitaria *</Label>
              <Select
                value={form.zoneId}
                onValueChange={(v) => setField('zoneId', v)}
                disabled={!!editingRow}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná una zona" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editingRow && (
                <p className="text-xs text-muted-foreground">
                  La institución no puede cambiarse desde aquí.
                </p>
              )}
            </div>

            {/* Institución */}
            {form.zoneId && !editingRow && (
              <div className="space-y-1.5">
                <Label>Institución *</Label>
                <Select
                  value={form.institutionId}
                  onValueChange={(v) => setField('institutionId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná una institución" />
                  </SelectTrigger>
                  <SelectContent>
                    {formInstitutions.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No hay instituciones en esta zona
                      </div>
                    ) : (
                      formInstitutions.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Institución (edición — solo lectura) */}
            {editingRow && (
              <div className="space-y-1.5">
                <Label>Institución</Label>
                <div className="p-2 rounded-md border bg-gray-50 text-sm text-gray-700">
                  {editingRow.institutionName}
                  <span className="text-gray-400 ml-1">· {editingRow.zoneName}</span>
                </div>
              </div>
            )}

            {/* Rol */}
            <div className="space-y-1.5">
              <Label>Rol *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setField('role', v as AllRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                  <SelectItem value="profesional">Profesional</SelectItem>
                  <SelectItem value="servicio">Servicio</SelectItem>
                  <SelectItem value="pantalla">Pantalla</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advertencia cambio de rol */}
            {roleChangeWarning && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Al cambiar el rol se eliminarán los datos asociados al rol anterior
                  y se crearán los del nuevo rol.
                </AlertDescription>
              </Alert>
            )}

            {/* Campos para PROFESIONAL */}
            {form.role === 'profesional' && (
              <div className="space-y-3 rounded-lg border p-3 bg-green-50">
                <p className="text-xs font-medium text-green-800 uppercase tracking-wide">
                  Datos del Profesional
                </p>

                <div className="space-y-1.5">
                  <Label>Tipo de Profesional *</Label>
                  <Select
                    value={form.professionalType}
                    onValueChange={(v) => setField('professionalType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccioná el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFESSIONAL_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Especialidad</Label>
                  <Input
                    value={form.speciality}
                    onChange={(e) => setField('speciality', e.target.value)}
                    placeholder="Ej: Cardiología, Pediatría"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Matrícula</Label>
                  <Input
                    value={form.licenseNumber}
                    onChange={(e) => setField('licenseNumber', e.target.value)}
                    placeholder="Ej: MP 12345"
                  />
                </div>
              </div>
            )}

            {/* Campos para SERVICIO */}
            {form.role === 'servicio' && (
              <div className="space-y-3 rounded-lg border p-3 bg-purple-50">
                <p className="text-xs font-medium text-purple-800 uppercase tracking-wide">
                  Asignación de Servicio
                </p>

                {!form.institutionId ? (
                  <p className="text-sm text-muted-foreground">
                    Seleccioná una institución primero para ver sus servicios.
                  </p>
                ) : formServices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay servicios activos en esta institución.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <Label>Servicio *</Label>
                    <Select
                      value={form.serviceId}
                      onValueChange={(v) => setField('serviceId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná el servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {formServices.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Activo */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => setField('isActive', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="isActive">Usuario activo</Label>
            </div>

            {/* Acciones */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? 'Guardando...'
                  : editingRow
                  ? 'Actualizar'
                  : 'Crear Personal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toggle active confirmation */}
      <AlertDialog
        open={!!toggleTarget}
        onOpenChange={(open) => { if (!open) setToggleTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.userActive ? 'Desactivar usuario' : 'Activar usuario'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget &&
                (toggleTarget.userActive
                  ? `¿Desactivar a ${toggleTarget.firstName} ${toggleTarget.lastName}? No podrá iniciar sesión en ninguna institución.`
                  : `¿Activar a ${toggleTarget.firstName} ${toggleTarget.lastName}?`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              className={toggleTarget?.userActive ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {toggleTarget?.userActive ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
