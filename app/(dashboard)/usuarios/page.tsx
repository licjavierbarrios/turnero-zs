'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
import { useInstitutionContext } from '@/hooks/useInstitutionContext'
import {
  Plus, Edit, UserCheck, UserX, Users, AlertCircle, Eye, EyeOff, Wand2,
} from 'lucide-react'

// ============================================================
// Types
// ============================================================
type AssignableRole = 'administrativo' | 'profesional' | 'servicio'

type ServiceOption = { id: string; name: string }

type StaffRow = {
  membershipId: string
  userId: string
  firstName: string
  lastName: string
  email: string
  userActive: boolean
  membershipActive: boolean
  role: AssignableRole
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
  dni: string
  email: string
  password: string
  isActive: boolean
  role: AssignableRole | ''
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
const ROLE_LABELS: Record<AssignableRole, string> = {
  administrativo: 'Administrativo',
  profesional: 'Profesional',
  servicio: 'Servicio',
}

const ROLE_COLORS: Record<AssignableRole, string> = {
  administrativo: 'bg-blue-100 text-blue-800',
  profesional: 'bg-green-100 text-green-800',
  servicio: 'bg-purple-100 text-purple-800',
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
  dni: '',
  email: '',
  password: '',
  isActive: true,
  role: '',
  professionalType: '',
  speciality: '',
  licenseNumber: '',
  serviceId: '',
}

// ============================================================
// Credential generation helpers
// ============================================================
function normalizeWord(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function generateEmail(firstName: string, lastName: string): string {
  return `${normalizeWord(firstName)}.${normalizeWord(lastName)}@evita.com`
}

function generatePassword(dni: string, lastName: string): string {
  const clean = lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '')
  const c1 = clean.charAt(0).toUpperCase()
  const c2 = clean.charAt(1)?.toLowerCase() ?? ''
  return `${dni}${c1}${c2}`
}

// ============================================================
// Component
// ============================================================
export default function UsuariosPage() {
  const router = useRouter()
  const { context, isAdmin } = useInstitutionContext()
  const { toast } = useToast()

  const [staff, setStaff] = useState<StaffRow[]>([])
  const [services, setServices] = useState<ServiceOption[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRow, setEditingRow] = useState<StaffRow | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [roleChangeWarning, setRoleChangeWarning] = useState(false)

  // Toggle active confirmation
  const [toggleTarget, setToggleTarget] = useState<StaffRow | null>(null)

  const institutionId = context?.institution_id

  // Redirect if not admin
  useEffect(() => {
    if (context !== null && !isAdmin) {
      router.push('/dashboard')
    }
  }, [context, isAdmin, router])

  // ============================================================
  // Data fetching
  // ============================================================
  const fetchData = useCallback(async () => {
    if (!institutionId) return
    setLoading(true)
    try {
      // Parallel: memberships+users, professionals, user_services, services
      const [membRes, profRes, usRes, svcRes] = await Promise.all([
        supabase
          .from('membership')
          .select('id, user_id, role, is_active, user:user_id(id, email, first_name, last_name, is_active)')
          .eq('institution_id', institutionId)
          .in('role', ['administrativo', 'profesional', 'servicio'])
          .order('created_at', { ascending: false }),

        supabase
          .from('professional')
          .select('id, user_id, professional_type, speciality, license_number')
          .eq('institution_id', institutionId),

        supabase
          .from('user_service')
          .select('id, user_id, service_id, service:service_id(name)')
          .eq('institution_id', institutionId)
          .eq('is_active', true),

        supabase
          .from('service')
          .select('id, name')
          .eq('institution_id', institutionId)
          .eq('is_active', true)
          .order('name'),
      ])

      if (membRes.error) throw membRes.error

      // Build lookup maps
      const profMap = new Map(
        (profRes.data || []).map((p: any) => [p.user_id, p])
      )
      const usMap = new Map(
        (usRes.data || []).map((us: any) => [us.user_id, us])
      )

      // Build staff rows
      const rows: StaffRow[] = (membRes.data || []).map((m: any) => {
        const u = m.user || {}
        const prof = profMap.get(m.user_id) as any
        const us = usMap.get(m.user_id) as any

        return {
          membershipId: m.id,
          userId: m.user_id,
          firstName: u.first_name || '',
          lastName: u.last_name || '',
          email: u.email || '',
          userActive: u.is_active ?? true,
          membershipActive: m.is_active,
          role: m.role as AssignableRole,
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
      setServices(
        (svcRes.data || []).map((s: any) => ({ id: s.id, name: s.name }))
      )
    } catch (err: any) {
      console.error('Error fetching staff:', err)
      toast({ title: 'Error al cargar el personal', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [institutionId, toast])

  useEffect(() => {
    if (institutionId) fetchData()
  }, [institutionId, fetchData])

  // ============================================================
  // Helpers
  // ============================================================
  const generateCredentials = () => {
    if (!form.firstName || !form.lastName) {
      setError('Ingresá nombre y apellido antes de generar')
      return
    }
    if (!form.dni) {
      setError('Ingresá el DNI antes de generar')
      return
    }
    setError(null)
    setForm((prev) => ({
      ...prev,
      email: generateEmail(prev.firstName, prev.lastName),
      password: generatePassword(prev.dni, prev.lastName),
    }))
    setShowPassword(true)
  }

  const openCreate = () => {
    setEditingRow(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowPassword(false)
    setRoleChangeWarning(false)
    setDialogOpen(true)
  }

  const openEdit = (row: StaffRow) => {
    setEditingRow(row)
    setShowPassword(false)
    setForm({
      firstName: row.firstName,
      lastName: row.lastName,
      dni: '',
      email: row.email,
      password: '',
      isActive: row.userActive,
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
      // Warn about role change when editing
      if (key === 'role' && editingRow && value !== editingRow.role) {
        setRoleChangeWarning(true)
      } else if (key === 'role' && editingRow && value === editingRow.role) {
        setRoleChangeWarning(false)
      }
      return next
    })
  }

  // ============================================================
  // Create user
  // ============================================================
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
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
      // 1. Crear usuario vía API route
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Sin sesión activa') // token para API, validado server-side

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

      // 2. Membresía
      const { error: membErr } = await supabase.from('membership').insert({
        user_id: newUser.id,
        institution_id: institutionId,
        role: form.role,
        is_active: true,
      })
      if (membErr) throw membErr

      // 3. Registro de rol específico
      await createRoleRecord(newUser.id, form)

      toast({
        title: 'Personal creado',
        description: `${form.firstName} ${form.lastName} fue agregado como ${ROLE_LABELS[form.role as AssignableRole]}.`,
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
  // Edit user
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
      // 1. Actualizar datos del usuario
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
        // 2a. Borrar registro del rol anterior
        await deleteRoleRecord(editingRow)

        // 2b. Actualizar membresía
        const { error: membErr } = await supabase
          .from('membership')
          .update({ role: form.role })
          .eq('id', editingRow.membershipId)
        if (membErr) throw membErr

        // 2c. Crear registro del nuevo rol
        await createRoleRecord(editingRow.userId, form)
      } else {
        // 3. Mismo rol: actualizar registro existente
        await updateRoleRecord(editingRow, form)
      }

      toast({ title: 'Personal actualizado' })
      closeDialog()
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el usuario')
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
        institution_id: institutionId,
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
        institution_id: institutionId,
        is_active: true,
      })
      if (error) throw error
    }
  }

  const deleteRoleRecord = async (row: StaffRow) => {
    if (row.role === 'profesional' && row.professional) {
      const { error } = await supabase
        .from('professional')
        .delete()
        .eq('id', row.professional.id)
      if (error) throw error
    } else if (row.role === 'servicio' && row.userService) {
      const { error } = await supabase
        .from('user_service')
        .delete()
        .eq('id', row.userService.id)
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
    } else if (f.role !== 'administrativo') {
      // El rol indica profesional/servicio pero no hay registro aún → crearlo
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
    } catch (err: any) {
      toast({ title: 'Error al cambiar el estado', variant: 'destructive' })
    }
  }

  // ============================================================
  // Detail cell helper
  // ============================================================
  const renderDetail = (row: StaffRow) => {
    if (row.role === 'profesional' && row.professional) {
      const type = PROFESSIONAL_TYPES.find(
        (t) => t.value === row.professional!.professionalType
      )?.label || row.professional.professionalType
      const parts = [type, row.professional.speciality].filter(Boolean)
      return (
        <span className="text-sm text-gray-700">
          {parts.length ? parts.join(' · ') : '—'}
        </span>
      )
    }
    if (row.role === 'servicio' && row.userService) {
      return (
        <span className="text-sm text-gray-700">{row.userService.serviceName}</span>
      )
    }
    return <span className="text-sm text-gray-400">—</span>
  }

  // ============================================================
  // Loading / guard
  // ============================================================
  if (!context) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Personal</h1>
          <p className="text-muted-foreground">
            {context.institution_name} — usuarios con acceso al sistema
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Personal
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Personal de la Institución
          </CardTitle>
          <CardDescription>
            {staff.length} {staff.length === 1 ? 'persona' : 'personas'} registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Cargando personal...
            </div>
          ) : staff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay personal registrado. Creá el primero con el botón &quot;Nuevo Personal&quot;.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((row) => (
                  <TableRow key={row.membershipId}>
                    <TableCell className="font-medium">
                      {row.firstName} {row.lastName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {row.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={ROLE_COLORS[row.role]}>
                        {ROLE_LABELS[row.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>{renderDetail(row)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          row.userActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {row.userActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(row)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* Create / Edit Dialog                                          */}
      {/* ============================================================ */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog() }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRow ? 'Editar Personal' : 'Nuevo Personal'}
            </DialogTitle>
            <DialogDescription>
              {editingRow
                ? 'Modificá los datos del usuario y su rol en la institución'
                : `Creá un nuevo usuario y asignalo a ${context.institution_name}`}
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

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => setField('firstName', e.target.value)}
                  placeholder="Nombre"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => setField('lastName', e.target.value)}
                  placeholder="Apellido"
                  required
                />
              </div>
            </div>

            {/* DNI + botón Generar (solo creación) */}
            {!editingRow && (
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    value={form.dni}
                    onChange={(e) => setField('dni', e.target.value.replace(/\D/g, ''))}
                    placeholder="12345678"
                    maxLength={8}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateCredentials}
                  className="shrink-0"
                  title="Generar email y contraseña automáticamente"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generar
                </Button>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="nombre.apellido@evita.com"
                required
              />
            </div>

            {/* Contraseña (solo creación) */}
            {!editingRow && (
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña * (mínimo 8 caracteres)</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    placeholder="Contraseña"
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {showPassword && form.password && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    Contraseña visible — recordá comunicársela al usuario
                  </p>
                )}
              </div>
            )}

            {/* Rol */}
            <div className="space-y-1.5">
              <Label>Rol *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setField('role', v as AssignableRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrativo">Administrativo</SelectItem>
                  <SelectItem value="profesional">Profesional</SelectItem>
                  <SelectItem value="servicio">Servicio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advertencia cambio de rol */}
            {roleChangeWarning && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Al cambiar el rol se eliminarán los datos asociados al rol anterior
                  (registro de profesional o asignación de servicio) y se crearán los del nuevo rol.
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
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="speciality">Especialidad</Label>
                  <Input
                    id="speciality"
                    value={form.speciality}
                    onChange={(e) => setField('speciality', e.target.value)}
                    placeholder="Ej: Cardiología, Pediatría"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="licenseNumber">Matrícula</Label>
                  <Input
                    id="licenseNumber"
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

                <div className="space-y-1.5">
                  <Label>Servicio *</Label>
                  {services.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay servicios activos en esta institución.{' '}
                      <a href="/servicios" className="underline">
                        Crear servicios →
                      </a>
                    </p>
                  ) : (
                    <Select
                      value={form.serviceId}
                      onValueChange={(v) => setField('serviceId', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná el servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}

            {/* Usuario activo */}
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

      {/* ============================================================ */}
      {/* Toggle active confirmation                                    */}
      {/* ============================================================ */}
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
              {toggleTarget && (
                toggleTarget.userActive
                  ? `¿Desactivar a ${toggleTarget.firstName} ${toggleTarget.lastName}? No podrá iniciar sesión en ninguna institución.`
                  : `¿Activar a ${toggleTarget.firstName} ${toggleTarget.lastName}?`
              )}
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
