'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

interface Zone {
  id: string
  name: string
}

interface Institution {
  id: string
  name: string
  zone_id: string
}

interface FilterBarProps {
  zones: Zone[]
  institutions: Institution[]
  selectedZone: string
  selectedInstitution: string
  searchTerm: string
  onZoneChange: (zoneId: string) => void
  onInstitutionChange: (institutionId: string) => void
  onSearchChange: (term: string) => void
}

export function FilterBar({
  zones,
  institutions,
  selectedZone,
  selectedInstitution,
  searchTerm,
  onZoneChange,
  onInstitutionChange,
  onSearchChange,
}: FilterBarProps) {
  const filteredInstitutions = selectedZone
    ? institutions.filter((inst) => inst.zone_id === selectedZone)
    : institutions

  const handleZoneChange = (value: string) => {
    const zoneId = value === 'all' ? '' : value
    onZoneChange(zoneId)
    // Reset institution filter when zone changes
    onInstitutionChange('all')
  }

  const handleInstitutionChange = (value: string) => {
    const institutionId = value === 'all' ? '' : value
    onInstitutionChange(institutionId)
  }

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Zona */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Zona
            </label>
            <Select value={selectedZone || 'all'} onValueChange={handleZoneChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las zonas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las zonas</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Institución */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Institución
            </label>
            <Select value={selectedInstitution || 'all'} onValueChange={handleInstitutionChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las instituciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las instituciones</SelectItem>
                {filteredInstitutions.map((institution) => (
                  <SelectItem key={institution.id} value={institution.id}>
                    {institution.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
