'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
    // Verificar si el usuario está autenticado
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/')
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)

    // Cargar instituciones del usuario (datos de demo)
    loadUserInstitutions(parsedUser.email)
  }, [router])

  const loadUserInstitutions = (email: string) => {
    // Demo: Diferentes usuarios tienen diferentes instituciones
    const institutionsByUser: { [key: string]: Institution[] } = {
      'juan.paredes@salud.gov.ar': [
        {
          id: '1',
          name: 'CAPS San Lorenzo',
          type: 'caps',
          zone_name: 'Zona Norte',
          address: 'Av. San Martín 1234, San Lorenzo',
          user_role: 'medico'
        },
        {
          id: '2',
          name: 'Hospital Distrital Norte',
          type: 'hospital_distrital',
          zone_name: 'Zona Norte',
          address: 'Ruta Provincial 15 Km 12',
          user_role: 'medico'
        },
        {
          id: '3',
          name: 'CAPS Villa Nueva',
          type: 'caps',
          zone_name: 'Zona Centro',
          address: 'Calle Principal 567, Villa Nueva',
          user_role: 'medico'
        }
      ],
      'maria.lopez@salud.gov.ar': [
        {
          id: '1',
          name: 'CAPS San Lorenzo',
          type: 'caps',
          zone_name: 'Zona Norte',
          address: 'Av. San Martín 1234, San Lorenzo',
          user_role: 'enfermeria'
        }
      ],
      'admin@salud.gov.ar': [
        {
          id: '1',
          name: 'CAPS San Lorenzo',
          type: 'caps',
          zone_name: 'Zona Norte',
          address: 'Av. San Martín 1234, San Lorenzo',
          user_role: 'admin'
        },
        {
          id: '2',
          name: 'Hospital Distrital Norte',
          type: 'hospital_distrital',
          zone_name: 'Zona Norte',
          address: 'Ruta Provincial 15 Km 12',
          user_role: 'admin'
        },
        {
          id: '4',
          name: 'Hospital Regional Centro',
          type: 'hospital_regional',
          zone_name: 'Zona Centro',
          address: 'Av. Libertador 890, Ciudad Capital',
          user_role: 'admin'
        }
      ]
    }

    const userInstitutions = institutionsByUser[email] || []
    setInstitutions(userInstitutions)
    setLoading(false)

    // Si solo tiene una institución, redirigir automáticamente
    if (userInstitutions.length === 1) {
      setTimeout(() => {
        selectInstitution(userInstitutions[0])
      }, 1000)
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

  const handleLogout = () => {
    localStorage.removeItem('user')
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
              Bienvenido, {user?.name}. Selecciona la institución donde deseas trabajar.
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
        ) : institutions.length === 1 ? (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Redirigiendo automáticamente a tu institución asignada...
              </AlertDescription>
            </Alert>
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="text-blue-600">
                    {getInstitutionIcon(institutions[0].type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {institutions[0].name}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge className={getRoleColor(institutions[0].user_role)}>
                        <UserIcon className="h-3 w-3 mr-1" />
                        {getRoleLabel(institutions[0].user_role)}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {getInstitutionTypeLabel(institutions[0].type)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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