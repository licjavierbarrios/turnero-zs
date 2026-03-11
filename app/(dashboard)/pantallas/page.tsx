'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useInstitutionContext } from '@/hooks/useInstitutionContext'
import { useRequirePermission } from '@/hooks/use-permissions'
import { ScreenConfigDialog } from './components/ScreenConfigDialog'
import { Monitor, Plus, Trash2, Settings2, Copy, Check, AlertCircle } from 'lucide-react'

type ScreenMode = 'all' | 'exclude' | 'include'

type Screen = {
  id: string
  institution_id: string
  name: string
  mode: ScreenMode
  is_active: boolean
  pin: string
  created_at: string
}

const modeLabels: Record<ScreenMode, string> = {
  all: 'Todo',
  exclude: 'Todo excepto...',
  include: 'Solo seleccionados',
}

const modeBadgeVariant: Record<ScreenMode, 'default' | 'secondary' | 'outline'> = {
  all: 'default',
  exclude: 'secondary',
  include: 'outline',
}

export default function PantallasPage() {
  const { hasAccess, loading: permissionLoading } = useRequirePermission('/pantallas')
  const { context, requireContext } = useInstitutionContext()
  requireContext()
  const institutionId = context!.institution_id

  const { toast } = useToast()
  const [screens, setScreens] = useState<Screen[]>([])
  const [loading, setLoading] = useState(true)

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  // Config dialog
  const [configScreen, setConfigScreen] = useState<Screen | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  // Delete confirmation
  const [deletingScreen, setDeletingScreen] = useState<Screen | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchScreens = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('screen')
        .select('*')
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: true })
      if (error) throw error
      setScreens(data || [])
    } catch (error) {
      console.error('Error al cargar pantallas:', error)
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las pantallas.' })
    } finally {
      setLoading(false)
    }
  }, [institutionId, toast])

  useEffect(() => {
    if (!permissionLoading && hasAccess) {
      fetchScreens()
    }
  }, [fetchScreens, permissionLoading, hasAccess])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const { error } = await supabase
        .from('screen')
        .insert({ institution_id: institutionId, name: newName.trim(), mode: 'all' })
      if (error) throw error
      toast({ title: 'Pantalla creada', description: `"${newName.trim()}" creada correctamente.` })
      setIsCreateOpen(false)
      setNewName('')
      fetchScreens()
    } catch (error) {
      console.error('Error al crear pantalla:', error)
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la pantalla.' })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingScreen) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('screen').delete().eq('id', deletingScreen.id)
      if (error) throw error
      toast({ title: 'Pantalla eliminada', description: `"${deletingScreen.name}" eliminada.` })
      setIsDeleteOpen(false)
      setDeletingScreen(null)
      fetchScreens()
    } catch (error) {
      console.error('Error al eliminar pantalla:', error)
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la pantalla.' })
    } finally {
      setDeleting(false)
    }
  }

  const handleCopyUrl = (screen: Screen) => {
    const url = `${window.location.origin}/pantalla/${screen.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(screen.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  if (permissionLoading) return null
  if (!hasAccess) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Pantallas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestioná las pantallas públicas de la institución. Cada pantalla tiene una URL única y puede mostrar un subconjunto de turnos.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva pantalla
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pantallas configuradas</CardTitle>
          <CardDescription>
            Copiá la URL de cada pantalla para abrirla en el televisor de sala de espera.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>
          ) : screens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay pantallas configuradas.</p>
              <p className="text-xs mt-1">Creá una pantalla para obtener su URL única.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>PIN TV</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {screens.map(screen => (
                  <TableRow key={screen.id}>
                    <TableCell className="font-medium">{screen.name}</TableCell>
                    <TableCell>
                      <Badge variant={modeBadgeVariant[screen.mode]}>
                        {modeLabels[screen.mode]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xl font-bold tracking-widest text-blue-600">
                          {screen.pin}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">
                        /pantalla/{screen.id.slice(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyUrl(screen)}
                          title="Copiar URL"
                        >
                          {copiedId === screen.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setConfigScreen(screen)
                            setIsConfigOpen(true)
                          }}
                          title="Configurar filtros"
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setDeletingScreen(screen)
                            setIsDeleteOpen(true)
                          }}
                          title="Eliminar pantalla"
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

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva pantalla</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="screen-name">Nombre</Label>
              <Input
                id="screen-name"
                placeholder="Ej: Admisión, Laboratorio, Sala de espera"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
              />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Se generará una URL única para esta pantalla. Podés configurar qué turnos muestra después.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? 'Creando...' : 'Crear pantalla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar pantalla</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            ¿Estás seguro que querés eliminar la pantalla <strong>{deletingScreen?.name}</strong>?
            La URL dejará de funcionar.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config dialog */}
      <ScreenConfigDialog
        open={isConfigOpen}
        onClose={() => {
          setIsConfigOpen(false)
          setConfigScreen(null)
        }}
        screen={configScreen}
        institutionId={institutionId}
        onSaved={() => {
          fetchScreens()
          toast({ title: 'Configuración guardada', description: 'Los filtros de la pantalla fueron actualizados.' })
        }}
      />
    </div>
  )
}
