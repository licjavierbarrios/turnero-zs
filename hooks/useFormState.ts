import { useState, useCallback, useMemo } from 'react'

/**
 * Opciones de configuración para useFormState
 */
export interface UseFormStateOptions<T> {
  /**
   * Valores iniciales del formulario
   */
  initialValues: T

  /**
   * Función de validación personalizada
   * @param data - Datos actuales del formulario
   * @returns Objeto con errores { campo: 'mensaje de error' } o {} si no hay errores
   */
  validate?: (data: T) => Partial<Record<keyof T, string>>

  /**
   * Callback ejecutado cuando el formulario cambia
   * @param data - Datos actuales del formulario
   * @param isDirty - Indica si el formulario ha cambiado
   */
  onChange?: (data: T, isDirty: boolean) => void
}

/**
 * Resultado del hook useFormState
 */
export interface UseFormStateResult<T> {
  /**
   * Datos actuales del formulario
   */
  formData: T

  /**
   * Establece todos los datos del formulario
   */
  setFormData: React.Dispatch<React.SetStateAction<T>>

  /**
   * Actualiza un campo específico del formulario
   * @param field - Nombre del campo
   * @param value - Nuevo valor
   */
  updateField: <K extends keyof T>(field: K, value: T[K]) => void

  /**
   * Actualiza múltiples campos a la vez
   * @param updates - Objeto con los campos a actualizar
   */
  updateFields: (updates: Partial<T>) => void

  /**
   * Resetea el formulario a sus valores iniciales
   */
  resetForm: () => void

  /**
   * Resetea el formulario a nuevos valores
   * @param newValues - Nuevos valores iniciales
   */
  resetToValues: (newValues: T) => void

  /**
   * Indica si el formulario ha cambiado respecto a los valores iniciales
   */
  isDirty: boolean

  /**
   * Errores de validación { campo: 'mensaje de error' }
   */
  errors: Partial<Record<keyof T, string>>

  /**
   * Establece los errores manualmente
   * @param errors - Objeto con errores
   */
  setErrors: React.Dispatch<React.SetStateAction<Partial<Record<keyof T, string>>>>

  /**
   * Establece el error de un campo específico
   * @param field - Nombre del campo
   * @param message - Mensaje de error
   */
  setFieldError: (field: keyof T, message: string) => void

  /**
   * Limpia el error de un campo específico
   * @param field - Nombre del campo
   */
  clearFieldError: (field: keyof T) => void

  /**
   * Limpia todos los errores
   */
  clearErrors: () => void

  /**
   * Indica si el formulario es válido (sin errores)
   */
  isValid: boolean

  /**
   * Indica si hay algún error
   */
  hasErrors: boolean

  /**
   * Valida el formulario manualmente
   * @returns true si es válido, false si hay errores
   */
  validateForm: () => boolean

  /**
   * Obtiene un handler para inputs controlados
   * @param field - Nombre del campo
   * @returns Handler onChange para el input
   *
   * @example
   * <Input {...getFieldProps('name')} />
   */
  getFieldProps: <K extends keyof T>(field: K) => {
    value: T[K]
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  }
}

/**
 * Hook para gestionar el estado de formularios con validación y helpers.
 *
 * @template T - Tipo del objeto de datos del formulario
 *
 * @example
 * ```typescript
 * const {
 *   formData,
 *   updateField,
 *   resetForm,
 *   errors,
 *   isValid,
 *   validateForm
 * } = useFormState({
 *   initialValues: {
 *     name: '',
 *     email: '',
 *     age: 0
 *   },
 *   validate: (data) => {
 *     const errors: any = {}
 *     if (!data.name) errors.name = 'El nombre es requerido'
 *     if (!data.email.includes('@')) errors.email = 'Email inválido'
 *     if (data.age < 18) errors.age = 'Debe ser mayor de 18 años'
 *     return errors
 *   },
 *   onChange: (data, isDirty) => {
 *     console.log('Formulario cambió:', data, isDirty)
 *   }
 * })
 *
 * // En el JSX
 * <Input
 *   value={formData.name}
 *   onChange={(e) => updateField('name', e.target.value)}
 *   error={errors.name}
 * />
 *
 * // O usando getFieldProps
 * <Input {...getFieldProps('name')} error={errors.name} />
 * ```
 */
export function useFormState<T extends Record<string, any>>({
  initialValues,
  validate,
  onChange
}: UseFormStateOptions<T>): UseFormStateResult<T> {

  const [formData, setFormData] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})

  // Detectar si el formulario ha cambiado
  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialValues)
  }, [formData, initialValues])

  // Detectar si hay errores
  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0
  }, [errors])

  // El formulario es válido si no tiene errores
  const isValid = useMemo(() => {
    return !hasErrors
  }, [hasErrors])

  /**
   * Actualiza un campo específico
   */
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // Ejecutar callback onChange
      if (onChange) {
        const willBeDirty = JSON.stringify(updated) !== JSON.stringify(initialValues)
        onChange(updated, willBeDirty)
      }

      return updated
    })

    // Limpiar error del campo al modificarlo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors, onChange, initialValues])

  /**
   * Actualiza múltiples campos a la vez
   */
  const updateFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => {
      const updated = { ...prev, ...updates }

      // Ejecutar callback onChange
      if (onChange) {
        const willBeDirty = JSON.stringify(updated) !== JSON.stringify(initialValues)
        onChange(updated, willBeDirty)
      }

      return updated
    })

    // Limpiar errores de los campos actualizados
    const fieldsToUpdate = Object.keys(updates) as (keyof T)[]
    setErrors(prev => {
      const newErrors = { ...prev }
      fieldsToUpdate.forEach(field => {
        delete newErrors[field]
      })
      return newErrors
    })
  }, [onChange, initialValues])

  /**
   * Resetea a valores iniciales
   */
  const resetForm = useCallback(() => {
    setFormData(initialValues)
    setErrors({})

    if (onChange) {
      onChange(initialValues, false)
    }
  }, [initialValues, onChange])

  /**
   * Resetea a nuevos valores
   */
  const resetToValues = useCallback((newValues: T) => {
    setFormData(newValues)
    setErrors({})

    if (onChange) {
      onChange(newValues, false)
    }
  }, [onChange])

  /**
   * Establece el error de un campo
   */
  const setFieldError = useCallback((field: keyof T, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }))
  }, [])

  /**
   * Limpia el error de un campo
   */
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  /**
   * Limpia todos los errores
   */
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  /**
   * Valida el formulario
   */
  const validateForm = useCallback((): boolean => {
    if (!validate) return true

    const validationErrors = validate(formData)
    setErrors(validationErrors)

    return Object.keys(validationErrors).length === 0
  }, [formData, validate])

  /**
   * Obtiene props para inputs controlados
   */
  const getFieldProps = useCallback(<K extends keyof T>(field: K) => {
    return {
      value: formData[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.value as T[K]
        updateField(field, value)
      }
    }
  }, [formData, updateField])

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    resetForm,
    resetToValues,
    isDirty,
    errors,
    setErrors,
    setFieldError,
    clearFieldError,
    clearErrors,
    isValid,
    hasErrors,
    validateForm,
    getFieldProps
  }
}
