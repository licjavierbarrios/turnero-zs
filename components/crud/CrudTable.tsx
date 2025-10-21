'use client'

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Edit, Trash2, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * Definición de una columna de la tabla
 */
export interface ColumnDef<T> {
  /**
   * Clave del campo (debe existir en T)
   */
  key: keyof T | string

  /**
   * Título de la columna
   */
  header: string

  /**
   * Función para renderizar el contenido de la celda
   * @param item - Item completo de la fila
   * @param value - Valor específico del campo
   * @returns Contenido a renderizar
   */
  render?: (item: T, value: any) => React.ReactNode

  /**
   * Clase CSS adicional para la celda
   */
  className?: string

  /**
   * Indica si esta columna debe ocultarse en móvil
   */
  hideOnMobile?: boolean
}

/**
 * Definición de una acción personalizada
 */
export interface CustomAction<T> {
  /**
   * Etiqueta de la acción
   */
  label: string

  /**
   * Icono de la acción (componente React)
   */
  icon?: React.ReactNode

  /**
   * Callback ejecutado al hacer clic
   */
  onClick: (item: T) => void

  /**
   * Variante del botón/menu item
   */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'

  /**
   * Condición para mostrar la acción (opcional)
   * @param item - Item de la fila
   * @returns true si la acción debe mostrarse
   */
  show?: (item: T) => boolean
}

/**
 * Props para el componente CrudTable
 */
export interface CrudTableProps<T extends { id: string }> {
  /**
   * Datos a mostrar en la tabla
   */
  data: T[]

  /**
   * Definición de las columnas
   */
  columns: ColumnDef<T>[]

  /**
   * Indica si los datos están cargando
   */
  isLoading?: boolean

  /**
   * Número de filas skeleton a mostrar cuando isLoading=true
   */
  skeletonRows?: number

  /**
   * Callback para editar un item
   */
  onEdit?: (item: T) => void

  /**
   * Callback para eliminar un item
   */
  onDelete?: (item: T) => void

  /**
   * Acciones personalizadas adicionales
   */
  customActions?: CustomAction<T>[]

  /**
   * Texto a mostrar cuando no hay datos
   */
  emptyMessage?: string

  /**
   * Si es true, muestra las acciones en un dropdown menu
   * Si es false, muestra botones inline
   * @default false
   */
  useDropdownActions?: boolean

  /**
   * Clase CSS adicional para la tabla
   */
  className?: string
}

/**
 * Componente genérico de tabla para operaciones CRUD.
 *
 * Proporciona:
 * - Renderizado de columnas configurables
 * - Acciones de edición/eliminación/personalizadas
 * - Loading skeleton
 * - Empty state
 * - Responsive (ocultar columnas en móvil)
 * - Dropdown de acciones opcional
 *
 * @example
 * ```tsx
 * <CrudTable
 *   data={patients}
 *   columns={[
 *     { key: 'patient_name', header: 'Nombre' },
 *     { key: 'dni', header: 'DNI' },
 *     {
 *       key: 'birth_date',
 *       header: 'Edad',
 *       render: (item) => calculateAge(item.birth_date),
 *       hideOnMobile: true
 *     }
 *   ]}
 *   isLoading={isLoading}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   customActions={[
 *     {
 *       label: 'Ver historial',
 *       icon: <FileText className="h-4 w-4" />,
 *       onClick: (patient) => router.push(`/historial/${patient.id}`)
 *     }
 *   ]}
 *   emptyMessage="No hay pacientes registrados"
 * />
 * ```
 */
export function CrudTable<T extends { id: string }>({
  data,
  columns,
  isLoading = false,
  skeletonRows = 5,
  onEdit,
  onDelete,
  customActions = [],
  emptyMessage = 'No hay datos para mostrar',
  useDropdownActions = false,
  className
}: CrudTableProps<T>) {

  // Verificar si hay acciones
  const hasActions = onEdit || onDelete || customActions.length > 0

  // Renderizar skeleton durante carga
  if (isLoading) {
    return (
      <div className={className}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={column.hideOnMobile ? 'hidden md:table-cell' : ''}
                >
                  {column.header}
                </TableHead>
              ))}
              {hasActions && <TableHead className="w-[100px]">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: skeletonRows }).map((_, index) => (
              <TableRow key={index}>
                {columns.map((column, colIndex) => (
                  <TableCell
                    key={colIndex}
                    className={column.hideOnMobile ? 'hidden md:table-cell' : ''}
                  >
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell>
                    <Skeleton className="h-8 w-20" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Renderizar empty state
  if (data.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className || ''}`}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  // Renderizar tabla con datos
  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead
                key={index}
                className={column.hideOnMobile ? 'hidden md:table-cell' : ''}
              >
                {column.header}
              </TableHead>
            ))}
            {hasActions && <TableHead className="w-[100px]">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              {/* Columnas de datos */}
              {columns.map((column, colIndex) => {
                const value = column.key in item ? item[column.key as keyof T] : null

                return (
                  <TableCell
                    key={colIndex}
                    className={`${column.className || ''} ${
                      column.hideOnMobile ? 'hidden md:table-cell' : ''
                    }`}
                  >
                    {column.render ? column.render(item, value) : String(value || '')}
                  </TableCell>
                )
              })}

              {/* Columna de acciones */}
              {hasActions && (
                <TableCell>
                  {useDropdownActions ? (
                    // Dropdown de acciones
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}

                        {customActions.map((action, actionIndex) => {
                          // Verificar si la acción debe mostrarse
                          if (action.show && !action.show(item)) {
                            return null
                          }

                          return (
                            <DropdownMenuItem
                              key={actionIndex}
                              onClick={() => action.onClick(item)}
                            >
                              {action.icon && <span className="mr-2">{action.icon}</span>}
                              {action.label}
                            </DropdownMenuItem>
                          )
                        })}

                        {onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(item)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    // Botones inline
                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(item)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}

                      {customActions.map((action, actionIndex) => {
                        // Verificar si la acción debe mostrarse
                        if (action.show && !action.show(item)) {
                          return null
                        }

                        return (
                          <Button
                            key={actionIndex}
                            variant={action.variant || 'ghost'}
                            size="icon"
                            onClick={() => action.onClick(item)}
                            title={action.label}
                          >
                            {action.icon || action.label}
                          </Button>
                        )
                      })}

                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(item)}
                          title="Eliminar"
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
