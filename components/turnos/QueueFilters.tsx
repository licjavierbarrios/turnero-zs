import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Filtros</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${getGridCols()} gap-4`}>
          {/* Filtro por Servicio - Solo para admin y administrativo */}
          {isAdminOrAdministrativo && (
            <div className="space-y-2">
              <Label htmlFor="service_filter">Servicio</Label>
              <Select value={selectedServiceFilter} onValueChange={onServiceFilterChange}>
                <SelectTrigger id="service_filter">
                  <SelectValue placeholder="Todos" />
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
            </div>
          )}

          {/* Filtro por Profesional */}
          <div className="space-y-2">
            <Label htmlFor="professional_filter">Profesional</Label>
            <Select value={selectedProfessionalFilter} onValueChange={onProfessionalFilterChange}>
              <SelectTrigger id="professional_filter">
                <SelectValue placeholder="Todos" />
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
          </div>

          {/* Filtro por Consultorio */}
          <div className="space-y-2">
            <Label htmlFor="room_filter">Consultorio</Label>
            <Select value={selectedRoomFilter} onValueChange={onRoomFilterChange}>
              <SelectTrigger id="room_filter">
                <SelectValue placeholder="Todos" />
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
          </div>

          {/* Filtro por Estado */}
          <div className="space-y-2">
            <Label htmlFor="status_filter">Estado</Label>
            <Select value={selectedStatusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger id="status_filter">
                <SelectValue placeholder="Todos" />
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
          </div>
        </div>

        {/* Resumen de filtros activos y botón limpiar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {selectedServiceFilter !== 'ALL' && (
                <Badge variant="secondary">
                  Servicio: {services.find(s => s.id === selectedServiceFilter)?.name}
                </Badge>
              )}
              {selectedProfessionalFilter !== 'ALL' && (
                <Badge variant="secondary">
                  Profesional: {professionals.find(p => p.id === selectedProfessionalFilter)?.name}
                </Badge>
              )}
              {selectedRoomFilter !== 'ALL' && (
                <Badge variant="secondary">
                  Consultorio: {rooms.find(r => r.id === selectedRoomFilter)?.name}
                </Badge>
              )}
              {selectedStatusFilter !== 'ALL' && (
                <Badge variant="secondary">
                  Estado: {statusConfig[selectedStatusFilter as keyof typeof statusConfig].label}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
            >
              Limpiar filtros
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
