import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Opciones de configuración para useCrudOperation
 */
export interface UseCrudOperationOptions<T extends { id: string }> {
  /**
   * Nombre de la tabla en Supabase
   */
  tableName: string

  /**
   * Valores iniciales para el formulario
   */
  initialFormData: Omit<T, 'id' | 'created_at' | 'updated_at'>

  /**
   * Función para transformar la respuesta de Supabase al formato esperado
   * @param raw - Datos crudos de Supabase
   * @returns Item transformado del tipo T
   */
  transformFn?: (raw: any) => T

  /**
   * Condiciones WHERE para filtrar los datos (ej: { institution_id: 'xxx' })
   */
  filterConditions?: Record<string, any>

  /**
   * Campos adicionales a incluir en SELECT (ej: 'institution(name,slug)')
   */
  selectFields?: string

  /**
   * Callback ejecutado después de una operación exitosa
   * @param operation - Tipo de operación: 'create' | 'update' | 'delete'
   * @param data - Datos afectados
   */
  onSuccess?: (operation: 'create' | 'update' | 'delete', data?: any) => void

  /**
   * Callback ejecutado cuando ocurre un error
   * @param operation - Tipo de operación donde ocurrió el error
   * @param error - Error capturado
   */
  onError?: (operation: 'create' | 'update' | 'delete', error: any) => void

  /**
   * Si es true, automáticamente carga los datos al montar el componente
   * @default true
   */
  autoFetch?: boolean
}

/**
 * Resultado de una operación CRUD
 */
export interface CRUDResult<T = any> {
  success: boolean
  error?: any
  data?: T
}

/**
 * Hook completo para gestionar operaciones CRUD con:
 * - Gestión de estado (items, formulario, dialogs)
 * - Operaciones optimistas (create, update, delete)
 * - Manejo de loading states
 * - Callbacks de success/error
 * - Integración con dialogs de UI
 *
 * @template T - Tipo del item (debe extender { id: string })
 *
 * @example
 * ```typescript
 * const {
 *   items,
 *   formData,
 *   isLoading,
 *   isSaving,
 *   isDialogOpen,
 *   editingItem,
 *   openCreateDialog,
 *   openEditDialog,
 *   closeDialog,
 *   updateFormField,
 *   resetForm,
 *   handleSubmit,
 *   handleDelete,
 *   refreshData
 * } = useCrudOperation<Patient>({
 *   tableName: 'patient',
 *   initialFormData: {
 *     patient_name: '',
 *     dni: '',
 *     birth_date: '',
 *     institution_id: ''
 *   },
 *   filterConditions: { institution_id: context.institution_id },
 *   selectFields: 'id, patient_name, dni, birth_date, created_at, institution(name)',
 *   transformFn: (raw) => ({
 *     ...raw,
 *     institution_name: raw.institution?.name || 'Sin institución'
 *   }),
 *   onSuccess: (operation) => {
 *     toast({ title: `Paciente ${operation === 'create' ? 'creado' : operation === 'update' ? 'actualizado' : 'eliminado'}` })
 *   }
 * })
 * ```
 */
export function useCrudOperation<T extends { id: string }>({
  tableName,
  initialFormData,
  transformFn = (raw) => raw as T,
  filterConditions = {},
  selectFields = '*',
  onSuccess,
  onError,
  autoFetch = true
}: UseCrudOperationOptions<T>) {

  // Estados de datos
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Estados de UI
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [itemToDelete, setItemToDelete] = useState<T | null>(null)

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<T>>(initialFormData as Partial<T>)

  /**
   * Carga todos los items de la tabla aplicando filtros
   */
  const fetchAll = useCallback(async (): Promise<CRUDResult<T[]>> => {
    try {
      setIsLoading(true)
      setError(null)

      let query = supabase
        .from(tableName)
        .select(selectFields)

      // Aplicar filtros
      Object.entries(filterConditions).forEach(([key, value]) => {
        query = query.eq(key, value)
      })

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const transformedData = (data || []).map(transformFn)
      setItems(transformedData)

      return { success: true, data: transformedData }

    } catch (err: any) {
      const error = new Error(err.message || 'Error al cargar datos')
      setError(error)
      if (onError) onError('create', err)
      return { success: false, error: err }
    } finally {
      setIsLoading(false)
    }
  }, [tableName, selectFields, filterConditions, transformFn, onError])

  /**
   * Efecto para cargar datos automáticamente al montar el componente
   * Solo ejecuta una vez para evitar bucles infinitos
   */
  useEffect(() => {
    if (autoFetch) {
      fetchAll()
    }
    // Intencionalmente vacío: solo ejecutar al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Carga un item específico por ID
   */
  const fetchOne = useCallback(async (id: string): Promise<CRUDResult<T>> => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select(selectFields)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const transformedItem = transformFn(data)

      // Actualizar en la lista si existe
      setItems(prev => prev.map(item =>
        item.id === id ? transformedItem : item
      ))

      return { success: true, data: transformedItem }

    } catch (err: any) {
      const error = new Error(err.message || 'Error al cargar item')
      setError(error)
      return { success: false, error: err }
    } finally {
      setIsLoading(false)
    }
  }, [tableName, selectFields, transformFn])

  /**
   * Crea un nuevo item con actualización optimista
   */
  const create = useCallback(async (data: Omit<T, 'id'>): Promise<CRUDResult<T>> => {
    const tempId = `temp-${Date.now()}`

    try {
      setIsSaving(true)
      setError(null)

      // 1️⃣ Actualización optimista
      const optimisticItem = { id: tempId, ...data } as T
      setItems(prev => [...prev, optimisticItem])

      // 2️⃣ Insertar en Supabase
      const { data: inserted, error: insertError } = await supabase
        .from(tableName)
        .insert(data as any)
        .select(selectFields)
        .single()

      if (insertError) throw insertError

      // 3️⃣ Reemplazar temporal con real
      const transformedItem = transformFn(inserted)
      setItems(prev => prev.map(item =>
        item.id === tempId ? transformedItem : item
      ))

      if (onSuccess) onSuccess('create', transformedItem)

      return { success: true, data: transformedItem }

    } catch (err: any) {
      // Rollback: eliminar item temporal
      setItems(prev => prev.filter(item => item.id !== tempId))

      const error = new Error(err.message || 'Error al crear item')
      setError(error)
      if (onError) onError('create', err)

      return { success: false, error: err }
    } finally {
      setIsSaving(false)
    }
  }, [tableName, selectFields, transformFn, onSuccess, onError])

  /**
   * Actualiza un item existente con actualización optimista
   */
  const update = useCallback(async (id: string, updates: Partial<T>): Promise<CRUDResult<T>> => {
    const previousItems = [...items]

    try {
      setIsSaving(true)
      setError(null)

      // 1️⃣ Actualización optimista
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ))

      // 2️⃣ Actualizar en Supabase
      const { data: updated, error: updateError } = await supabase
        .from(tableName)
        .update(updates as any)
        .eq('id', id)
        .select(selectFields)
        .single()

      if (updateError) throw updateError

      // 3️⃣ Actualizar con datos reales
      const transformedItem = transformFn(updated)
      setItems(prev => prev.map(item =>
        item.id === id ? transformedItem : item
      ))

      if (onSuccess) onSuccess('update', transformedItem)

      return { success: true, data: transformedItem }

    } catch (err: any) {
      // Rollback
      setItems(previousItems)

      const error = new Error(err.message || 'Error al actualizar item')
      setError(error)
      if (onError) onError('update', err)

      return { success: false, error: err }
    } finally {
      setIsSaving(false)
    }
  }, [tableName, selectFields, items, transformFn, onSuccess, onError])

  /**
   * Elimina un item con actualización optimista
   */
  const deleteItem = useCallback(async (id: string): Promise<CRUDResult> => {
    const previousItems = [...items]

    try {
      setIsSaving(true)
      setError(null)

      // 1️⃣ Actualización optimista
      setItems(prev => prev.filter(item => item.id !== id))

      // 2️⃣ Eliminar de Supabase
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      if (onSuccess) onSuccess('delete')

      return { success: true }

    } catch (err: any) {
      // Rollback
      setItems(previousItems)

      const error = new Error(err.message || 'Error al eliminar item')
      setError(error)
      if (onError) onError('delete', err)

      return { success: false, error: err }
    } finally {
      setIsSaving(false)
    }
  }, [tableName, items, onSuccess, onError])

  // ========================================
  // Helpers de UI para dialogs y formularios
  // ========================================

  /**
   * Abre el dialog en modo creación
   */
  const openCreateDialog = useCallback(() => {
    setEditingItem(null)
    setFormData(initialFormData as Partial<T>)
    setIsDialogOpen(true)
  }, [initialFormData])

  /**
   * Abre el dialog en modo edición
   */
  const openEditDialog = useCallback((item: T) => {
    setEditingItem(item)
    setFormData(item)
    setIsDialogOpen(true)
  }, [])

  /**
   * Cierra el dialog y resetea el formulario
   */
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false)
    setEditingItem(null)
    setFormData(initialFormData as Partial<T>)
  }, [initialFormData])

  /**
   * Actualiza un campo del formulario
   */
  const updateFormField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  /**
   * Resetea el formulario a sus valores iniciales
   */
  const resetForm = useCallback(() => {
    setFormData(initialFormData as Partial<T>)
  }, [initialFormData])

  /**
   * Maneja el submit del formulario (crea o actualiza)
   */
  const handleSubmit = useCallback(async (): Promise<CRUDResult> => {
    if (editingItem) {
      // Actualizar
      const result = await update(editingItem.id, formData)
      if (result.success) {
        closeDialog()
      }
      return result
    } else {
      // Crear
      const result = await create(formData as Omit<T, 'id'>)
      if (result.success) {
        closeDialog()
      }
      return result
    }
  }, [editingItem, formData, create, update, closeDialog])

  /**
   * Abre el dialog de confirmación de eliminación
   */
  const openDeleteDialog = useCallback((item: T) => {
    setItemToDelete(item)
    setIsDeleteDialogOpen(true)
  }, [])

  /**
   * Cierra el dialog de eliminación
   */
  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false)
    setItemToDelete(null)
  }, [])

  /**
   * Maneja la eliminación confirmada
   */
  const handleDelete = useCallback(async (): Promise<CRUDResult> => {
    if (!itemToDelete) {
      return { success: false, error: new Error('No hay item para eliminar') }
    }

    const result = await deleteItem(itemToDelete.id)
    if (result.success) {
      closeDeleteDialog()
    }
    return result
  }, [itemToDelete, deleteItem, closeDeleteDialog])

  /**
   * Refresca los datos (alias de fetchAll)
   */
  const refreshData = fetchAll

  return {
    // Datos
    items,
    setItems,
    error,

    // Loading states
    isLoading,
    isSaving,

    // Estado de UI
    isDialogOpen,
    isDeleteDialogOpen,
    editingItem,
    itemToDelete,

    // Estado del formulario
    formData,
    setFormData,
    updateFormField,
    resetForm,

    // Operaciones CRUD
    create,
    update,
    delete: deleteItem,
    fetchAll,
    fetchOne,
    refreshData,

    // Helpers de UI
    openCreateDialog,
    openEditDialog,
    closeDialog,
    openDeleteDialog,
    closeDeleteDialog,
    handleSubmit,
    handleDelete
  }
}
