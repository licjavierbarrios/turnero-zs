'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { UsersManagementTab } from '@/components/UsersManagementTab'
import { InstitutionSettingsTab } from '@/components/InstitutionSettingsTab'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Users, Shield } from 'lucide-react'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [currentInstitution, setCurrentInstitution] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Obtener contexto institucional del admin
      const contextData = localStorage.getItem('institution_context')
      if (contextData) {
        const context = JSON.parse(contextData)
        setCurrentInstitution(context)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Settings className="mr-3 h-8 w-8" />
          Panel de Administración
        </h1>
        <p className="mt-2 text-gray-600">
          Gestiona usuarios, asignaciones y configuraciones del sistema
        </p>
        {currentInstitution && (
          <p className="mt-1 text-sm text-blue-600">
            Administrando: {currentInstitution.institution_name}
          </p>
        )}
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Gestión de Usuarios
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6">
          {currentInstitution && (
            <UsersManagementTab
              institutionId={currentInstitution.institution_id}
              institutionName={currentInstitution.institution_name}
            />
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          {currentInstitution && (
            <InstitutionSettingsTab
              institutionId={currentInstitution.institution_id}
              institutionName={currentInstitution.institution_name}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
