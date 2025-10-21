import { useMemo } from 'react'

/**
 * Estructura del contexto institucional almacenado en localStorage
 */
export interface InstitutionContext {
  institution_id: string
  institution_name: string
  institution_slug: string
  institution_type: 'caps' | 'hospital_seccional' | 'hospital_distrital' | 'hospital_regional'
  user_id: string
  user_email: string
  user_role: 'admin' | 'administrativo' | 'medico' | 'enfermeria' | 'pantalla'
  membership_id: string
}

/**
 * Resultado del hook useInstitutionContext
 */
export interface UseInstitutionContextResult {
  /**
   * Contexto institucional parseado, o null si no existe
   */
  context: InstitutionContext | null

  /**
   * Indica si el usuario tiene rol de admin
   */
  isAdmin: boolean

  /**
   * Indica si el usuario tiene rol de administrativo
   */
  isAdministrativo: boolean

  /**
   * Indica si el usuario tiene rol de médico
   */
  isMedico: boolean

  /**
   * Indica si el usuario tiene rol de enfermería
   */
  isEnfermeria: boolean

  /**
   * Indica si el usuario tiene rol de pantalla
   */
  isPantalla: boolean

  /**
   * Indica si el usuario es admin o administrativo (roles con permisos de gestión)
   */
  canManage: boolean

  /**
   * Verifica si el usuario tiene un rol específico
   * @param role - Rol a verificar
   * @returns true si el usuario tiene ese rol
   */
  hasRole: (role: InstitutionContext['user_role']) => boolean

  /**
   * Verifica que exista el contexto, lanza error si no existe
   * @throws Error si no hay contexto institucional
   * @returns El contexto institucional
   */
  requireContext: () => InstitutionContext

  /**
   * Verifica que el usuario sea admin, lanza error si no lo es
   * @throws Error si el usuario no es admin
   */
  requireAdmin: () => void

  /**
   * Verifica que el usuario pueda gestionar (admin o administrativo)
   * @throws Error si el usuario no puede gestionar
   */
  requireManagePermission: () => void
}

/**
 * Hook para acceder al contexto institucional del usuario autenticado.
 *
 * Lee el contexto de localStorage y proporciona helpers para verificar roles y permisos.
 *
 * @example
 * ```typescript
 * const { context, isAdmin, requireContext } = useInstitutionContext()
 *
 * // Verificar que existe contexto
 * useEffect(() => {
 *   try {
 *     requireContext()
 *     // Continuar con lógica
 *   } catch {
 *     router.push('/login')
 *   }
 * }, [])
 *
 * // Verificar rol
 * if (isAdmin) {
 *   // Mostrar opciones de admin
 * }
 * ```
 */
export function useInstitutionContext(): UseInstitutionContextResult {
  const context = useMemo(() => {
    try {
      const contextData = localStorage.getItem('institution_context')
      if (!contextData) return null
      return JSON.parse(contextData) as InstitutionContext
    } catch (error) {
      console.error('Error al parsear institution_context:', error)
      return null
    }
  }, [])

  const isAdmin = useMemo(
    () => context?.user_role === 'admin',
    [context]
  )

  const isAdministrativo = useMemo(
    () => context?.user_role === 'administrativo',
    [context]
  )

  const isMedico = useMemo(
    () => context?.user_role === 'medico',
    [context]
  )

  const isEnfermeria = useMemo(
    () => context?.user_role === 'enfermeria',
    [context]
  )

  const isPantalla = useMemo(
    () => context?.user_role === 'pantalla',
    [context]
  )

  const canManage = useMemo(
    () => isAdmin || isAdministrativo,
    [isAdmin, isAdministrativo]
  )

  const hasRole = useMemo(
    () => (role: InstitutionContext['user_role']) => {
      return context?.user_role === role
    },
    [context]
  )

  const requireContext = useMemo(
    () => (): InstitutionContext => {
      if (!context) {
        throw new Error('No hay contexto institucional. El usuario debe iniciar sesión.')
      }
      return context
    },
    [context]
  )

  const requireAdmin = useMemo(
    () => (): void => {
      if (!context) {
        throw new Error('No hay contexto institucional.')
      }
      if (!isAdmin) {
        throw new Error('Se requiere rol de administrador.')
      }
    },
    [context, isAdmin]
  )

  const requireManagePermission = useMemo(
    () => (): void => {
      if (!context) {
        throw new Error('No hay contexto institucional.')
      }
      if (!canManage) {
        throw new Error('Se requiere rol de administrador o administrativo.')
      }
    },
    [context, canManage]
  )

  return {
    context,
    isAdmin,
    isAdministrativo,
    isMedico,
    isEnfermeria,
    isPantalla,
    canManage,
    hasRole,
    requireContext,
    requireAdmin,
    requireManagePermission
  }
}
