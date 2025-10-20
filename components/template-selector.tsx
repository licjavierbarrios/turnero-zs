'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { LayoutGridIcon, CheckCircle2Icon } from 'lucide-react'

interface DisplayTemplate {
  id: string
  name: string
  description: string
  layout_type: 'grid-2x2' | 'grid-3x2' | 'list' | 'carousel'
  service_filter_type: 'all' | 'specific'
  service_ids: string[]
  carousel_interval: number
}

interface TemplateSelectorProps {
  currentTemplateId?: string
  onTemplateChange: (template: DisplayTemplate) => void
}

export function TemplateSelector({ currentTemplateId, onTemplateChange }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<DisplayTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(currentTemplateId || '')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('display_template')
        .select('*')
        .eq('is_active', true)
        .order('is_predefined', { ascending: false })
        .order('name')

      if (error) throw error

      setTemplates(data || [])

      // Si no hay template seleccionado, usar el primero (Vista Completa)
      if (!currentTemplateId && data && data.length > 0) {
        setSelectedTemplateId(data[0].id)
      }
    } catch (error) {
      console.error('Error al cargar plantillas:', error)
    } finally {
      setLoading(false)
    }
  }, [currentTemplateId])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleApply = () => {
    const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
    if (selectedTemplate) {
      onTemplateChange(selectedTemplate)
      setOpen(false)
    }
  }

  const getLayoutIcon = (layoutType: string) => {
    switch (layoutType) {
      case 'grid-2x2':
        return '▦'
      case 'grid-3x2':
        return '▦▦'
      case 'list':
        return '☰'
      case 'carousel':
        return '⟳'
      default:
        return '□'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
        >
          <LayoutGridIcon className="h-4 w-4 mr-2" />
          Cambiar Vista
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Seleccionar Vista de Pantalla</DialogTitle>
          <DialogDescription>
            Elija cómo desea visualizar los servicios en esta pantalla
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="py-4">
            <RadioGroup value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`relative flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                      selectedTemplateId === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTemplateId(template.id)}
                  >
                    <RadioGroupItem
                      value={template.id}
                      id={template.id}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={template.id}
                        className="cursor-pointer font-medium text-sm flex items-center"
                      >
                        <span className="text-2xl mr-2">
                          {getLayoutIcon(template.layout_type)}
                        </span>
                        {template.name}
                        {selectedTemplateId === template.id && (
                          <CheckCircle2Icon className="h-4 w-4 ml-2 text-blue-600" />
                        )}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {template.layout_type}
                        </span>
                        {template.layout_type === 'carousel' && (
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                            Cada {template.carousel_interval}s
                          </span>
                        )}
                        {template.service_filter_type === 'specific' && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {template.service_ids.length} servicios
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleApply} disabled={!selectedTemplateId}>
            Aplicar Vista
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
