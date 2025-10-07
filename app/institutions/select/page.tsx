'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  BuildingIcon,
  MapPinIcon,
  UserIcon,
  LogOutIcon,
  ShieldCheckIcon,
  Building2Icon,
  HomeIcon
} from 'lucide-react'

interface Institution {
  id: string
  name: string
  type: 'caps' | 'hospital_seccional' | 'hospital_distrital' | 'hospital_regional'
  zone_name: string
  address: string
  user_role: string
}

export default function InstitutionSelectPage() {
  const [user, setUser] = useState<any>(null)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [router])

  const loadUserData = async () => {
    try {
      // Verificar sesión de Supabase
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !authUser) {
        router.push('/')
        return
      }

      // Obtener datos del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError) {
        router.push('/')
        return
      }

      setUser(userData)

      // Cargar instituciones del usuario desde sus membresías
      await loadUserInstitutions(authUser.id)
    } catch (error) {
      console.error('Error en loadUserData:', error)
      router.push('/')
    }
  }

  const loadUserInstitutions = async (userId: string) => {
    try {
      // Obtener membresías activas del usuario
      const { data: memberships, error: membershipError } = await supabase
        .from('membership')
        .select(`
          id,
          role,
          is_active,
          institution:institution_id (
            id,
            name,
            type,
            address,
            zone:zone_id (
              id,
              name
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (membershipError) {
        console.error('Error al cargar membresías:', membershipError)
        setLoading(false)
        return
      }

      // Transformar a formato Institution
      const userInstitutions: Institution[] = memberships
        .filter(m => m.institution) // Solo membresías con institución válida
        .map(m => ({
          id: m.institution.id,
          name: m.institution.name,
          type: m.institution.type,
          zone_name: m.institution.zone?.name || 'Sin zona',
          address: m.institution.address || 'Sin dirección',
          user_role: m.role
        }))

      setInstitutions(userInstitutions)
      setLoading(false)
    } catch (error) {
      console.error('Error en loadUserInstitutions:', error)
      setLoading(false)
    }
  }

  const selectInstitution = (institution: Institution) => {
    // Guardar contexto institucional
    const institutionContext = {
      institution_id: institution.id,
      institution_name: institution.name,
      institution_type: institution.type,
      zone_name: institution.zone_name,
      user_role: institution.user_role
    }

    localStorage.setItem('institution_context', JSON.stringify(institutionContext))
    router.push('/dashboard')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('institution_context')
    router.push('/')
  }

  const getInstitutionIcon = (type: string) => {
    switch (type) {
      case 'caps':
        return <HomeIcon className="h-6 w-6" />
      case 'hospital_seccional':
        return <BuildingIcon className="h-6 w-6" />
      case 'hospital_distrital':
        return <Building2Icon className="h-6 w-6" />
      case 'hospital_regional':
        return <Building2Icon className="h-6 w-6" />
      default:
        return <BuildingIcon className="h-6 w-6" />
    }
  }

  const getInstitutionTypeLabel = (type: string) => {
    switch (type) {
      case 'caps':
        return 'CAPS'
      case 'hospital_seccional':
        return 'Hospital Seccional'
      case 'hospital_distrital':
        return 'Hospital Distrital'
      case 'hospital_regional':
        return 'Hospital Regional'
      default:
        return type
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'administrativo':
        return 'Administrativo'
      case 'medico':
        return 'Médico'
      case 'enfermeria':
        return 'Enfermería'
      case 'pantalla':
        return 'Pantalla'
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'medico':
        return 'bg-blue-100 text-blue-800'
      case 'enfermeria':
        return 'bg-green-100 text-green-800'
      case 'administrativo':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando instituciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Seleccionar Institución
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenido, {user?.first_name} {user?.last_name}. Selecciona la institución donde deseas trabajar.
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOutIcon className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Instituciones */}
        {institutions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <ShieldCheckIcon className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Sin instituciones asignadas</h3>
                <p>No tienes instituciones asignadas en el sistema.</p>
                <p className="text-sm mt-2">Contacta con el administrador para solicitar acceso.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {institutions.map((institution) => (
              <Card
                key={institution.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => selectInstitution(institution)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-600 group-hover:text-blue-700">
                        {getInstitutionIcon(institution.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-blue-700">
                          {institution.name}
                        </CardTitle>
                        <CardDescription>
                          {getInstitutionTypeLabel(institution.type)}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getRoleColor(institution.user_role)}>
                      <UserIcon className="h-3 w-3 mr-1" />
                      {getRoleLabel(institution.user_role)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {institution.zone_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {institution.address}
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4 group-hover:bg-blue-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      selectInstitution(institution)
                    }}
                  >
                    Acceder como {getRoleLabel(institution.user_role)}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Turnero ZS - Sistema de Gestión de Turnos para Centros de Salud</p>
        </div>
      </div>
    </div>
  )
}