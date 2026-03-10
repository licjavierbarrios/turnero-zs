import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { statusConfig } from '@/lib/turnos/config'
import type { Service, Professional, Room } from '@/lib/turnos/types'

interface QueueFiltersProps {
  // Valores de filtros
  selectedServiceFilter: string
  selectedProfessionalFilter: string
  selectedRoomFilter: string
  selectedStatusFilter: string

  // Setters de filtros
  onServiceFilterChange: (value: string) => void
  onProfessionalFilterChange: (value: string) => void
  onRoomFilterChange: (value: string) => void
  onStatusFilterChange: (value: string) => void

  // Datos para las opciones
  services: Service[]
  professionals: Professional[]
  rooms: Room[]
  userServices: Service[]

  // Función para limpiar filtros
  onClearFilters: () => void
}

/**
 * Componente de filtros para la cola del día.
 *
 * Maneja filtros por servicio, profesional, consultorio y estado.
 * Respeta la lógica de roles: admin/administrativo ven todos los servicios,
 * otros roles ven solo servicios asignados.
 *
 * @param selectedServiceFilter - ID del servicio seleccionado o 'ALL'
 * @param selectedProfessionalFilter - ID del profesional seleccionado o 'ALL'
 * @param selectedRoomFilter - ID del consultorio seleccionado o 'ALL'
 * @param selectedStatusFilter - Estado seleccionado o 'ALL'
 * @param onServiceFilterChange - Callback cuando cambia filtro de servicio
 * @param onProfessionalFilterChange - Callback cuando cambia filtro de profesional
 * @param onRoomFilterChange - Callback cuando cambia filtro de consultorio
 * @param onStatusFilterChange - Callback cuando cambia filtro de estado
 * @param services - Lista de servicios disponibles
 * @param professionals - Lista de profesionales disponibles
 * @param rooms - Lista de consultorios disponibles
 * @param userServices - Servicios asignados al usuario actual
 * @param onClearFilters - Callback para limpiar todos los filtros
 *
 * @example
 * ```tsx
 * <QueueFilters
 *   selectedServiceFilter={selectedServiceFilter}
 *   selectedProfessionalFilter={selectedProfessionalFilter}
 *   selectedRoomFilter={selectedRoomFilter}
 *   selectedStatusFilter={selectedStatusFilter}
 *   onServiceFilterChange={setSelectedServiceFilter}
 *   onProfessionalFilterChange={setSelectedProfessionalFilter}
 *   onRoomFilterChange={setSelectedRoomFilter}
 *   onStatusFilterChange={setSelectedStatusFilter}
 *   services={services}
 *   professionals={professionals}
 *   rooms={rooms}
 *   userServices={userServices}
 *   onClearFilters={() => {
 *     setSelectedServiceFilter('ALL')
 *     setSelectedProfessionalFilter('ALL')
 *     setSelectedRoomFilter('ALL')
 *     setSelectedStatusFilter('ALL')
 *   }}
 * />
 * ```
 */
export function QueueFilters({
  selectedServiceFilter,
  selectedProfessionalFilter,
  selectedRoomFilter,
  selectedStatusFilter,
  onServiceFilterChange,
  onProfessionalFilterChange,
  onRoomFilterChange,
  onStatusFilterChange,
  services,
  professionals,
  rooms,
  userServices,
  onClearFilters
}: QueueFiltersProps) {
  // Determinar rol del usuario desde localStorage
  const getUserRole = () => {
    const contextData = localStorage.getItem('institution_context')
    if (contextData) {
      const context = JSON.parse(contextData)
      return context.user_role
    }
    return null
  }

  const userRole = getUserRole()
  const isAdminOrAdministrativo = userRole === 'admin' || userRole === 'administrativo'

  // Determinar descripción según rol
  const getDescription = () => {
    if (!isAdminOrAdministrativo && userServices.length > 0) {
      return `Mostrando solo turnos de: ${userServices.map(s => s.name).join(', ')}`
    }
    return 'Filtra la cola por servicio, profesional, consultorio o estado'
  }

  // Determinar número de columnas del grid
  const getGridCols = () => {
    // Si no es admin/administrativo, usar 3 columnas (sin filtro de servicio)
    return isAdminOrAdministrativo ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
  }

  // Verificar si hay filtros activos
  const hasActiveFilters =
    selectedServiceFilter !== 'ALL' ||
    selectedProfessionalFilter !== 'ALL' ||
    selectedRoomFilter !== 'ALL' ||
    selectedStatusFilter !== 'ALL'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filtro por Servicio - Solo para admin y administrativo */}
      {isAdminOrAdministrativo && (
        <Select value={selectedServiceFilter} onValueChange={onServiceFilterChange}>
          <SelectTrigger className="h-8 text-sm w-auto min-w-40">
            <SelectValue placeholder="Todos los servicios" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los servicios</SelectItem>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Filtro por Profesional */}
      <Select value={selectedProfessionalFilter} onValueChange={onProfessionalFilterChange}>
        <SelectTrigger className="h-8 text-sm w-auto min-w-44">
          <SelectValue placeholder="Todos los profesionales" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los profesionales</SelectItem>
          {professionals.map((prof) => (
            <SelectItem key={prof.id} value={prof.id}>
              {prof.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtro por Consultorio */}
      <Select value={selectedRoomFilter} onValueChange={onRoomFilterChange}>
        <SelectTrigger className="h-8 text-sm w-auto min-w-44">
          <SelectValue placeholder="Todos los consultorios" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los consultorios</SelectItem>
          {rooms.map((room) => (
            <SelectItem key={room.id} value={room.id}>
              {room.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Filtro por Estado */}
      <Select value={selectedStatusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="h-8 text-sm w-auto min-w-36">
          <SelectValue placeholder="Todos los estados" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos los estados</SelectItem>
          {Object.entries(statusConfig).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Limpiar filtros */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onClearFilters}>
          × Limpiar
        </Button>
      )}
    </div>
  )
}
