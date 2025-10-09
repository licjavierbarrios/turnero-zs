'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'

interface InstitutionSettingsTabProps {
  institutionId: string
  institutionName: string
}

interface Institution {
  id: string
  name: string
  slug: string | null
  type: string
}

export function InstitutionSettingsTab({ institutionId, institutionName }: InstitutionSettingsTabProps) {
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadInstitution()
  }, [institutionId])

  const loadInstitution = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('institution')
        .select('id, name, slug, type')
        .eq('id', institutionId)
        .single()

      if (error) throw error

      setInstitution(data)
      setSlug(data.slug || '')
    } catch (err: any) {
      console.error('Error loading institution:', err)
      setError('Error al cargar la institución')
    } finally {
      setLoading(false)
    }
  }

  const validateSlug = (value: string): boolean => {
    // Slug debe ser lowercase, sin espacios, solo letras, números y guiones
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    return slugRegex.test(value)
  }

  const handleSlugChange = (value: string) => {
    // Convertir a lowercase y reemplazar espacios por guiones
    const formatted = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    setSlug(formatted)
  }

  const handleSave = async () => {
    setError(null)
    setSuccess(null)

    if (!slug) {
      setError('El slug no puede estar vacío')
      return
    }

    if (!validateSlug(slug)) {
      setError('El slug solo puede contener letras minúsculas, números y guiones')
      return
    }

    try {
      setSaving(true)

      // Verificar que el slug no esté en uso por otra institución
      const { data: existing } = await supabase
        .from('institution')
        .select('id')
        .eq('slug', slug)
        .neq('id', institutionId)
        .single()

      if (existing) {
        setError('Este slug ya está en uso por otra institución')
        return
      }

      // Actualizar el slug
      const { error: updateError } = await supabase
        .from('institution')
        .update({ slug })
        .eq('id', institutionId)

      if (updateError) throw updateError

      setSuccess('Slug actualizado correctamente')
      setInstitution(prev => prev ? { ...prev, slug } : null)
    } catch (err: any) {
      console.error('Error saving slug:', err)
      setError('Error al guardar el slug')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const publicUrl = slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/pantalla/${slug}`
    : 'Sin slug configurado'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            Información de la Institución
          </CardTitle>
          <CardDescription>
            Configura el identificador público (slug) de tu institución
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Nombre de la Institución</Label>
            <Input
              value={institution?.name || ''}
              disabled
              className="bg-gray-50"
            />
            <p className="text-sm text-gray-500">
              El nombre de la institución no se puede editar desde aquí
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug (Identificador en URL)
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="caps-norte"
              disabled={saving}
            />
            <p className="text-sm text-gray-500">
              Solo minúsculas, números y guiones. Ejemplo: caps-norte, hospital-central
            </p>
          </div>

          <div className="space-y-2">
            <Label>URL Pública de Pantalla</Label>
            <div className="flex items-center gap-2">
              <Input
                value={publicUrl}
                disabled
                className="bg-gray-50"
              />
              {slug && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(publicUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Esta URL se usa para acceder a la pantalla pública de turnos
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={loadInstitution}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !slug || slug === institution?.slug}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de Tipo</CardTitle>
          <CardDescription>
            Detalles sobre el tipo de institución
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Tipo de Institución</Label>
            <Input
              value={institution?.type || ''}
              disabled
              className="bg-gray-50"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
