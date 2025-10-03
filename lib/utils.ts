import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utilidades para el sistema de salud
export function formatAppointmentStatus(status: string): string {
  const statusMap = {
    pendiente: 'Pendiente',
    esperando: 'En Espera',
    llamado: 'Llamado',
    en_consulta: 'En Consulta',
    finalizado: 'Finalizado',
    cancelado: 'Cancelado',
    ausente: 'Ausente'
  }
  return statusMap[status as keyof typeof statusMap] || status
}

export function getStatusBadgeClass(status: string): string {
  const classMap = {
    pendiente: 'status-badge status-pending',
    esperando: 'status-badge status-waiting',
    llamado: 'status-badge status-called',
    en_consulta: 'status-badge status-in-consultation',
    finalizado: 'status-badge status-completed',
    cancelado: 'status-badge status-cancelled',
    ausente: 'status-badge status-absent'
  }
  return classMap[status as keyof typeof classMap] || 'status-badge'
}

export function formatInstitutionType(type: string): string {
  const typeMap = {
    caps: 'CAPS',
    hospital_seccional: 'Hospital Seccional',
    hospital_distrital: 'Hospital Distrital',
    hospital_regional: 'Hospital Regional'
  }
  return typeMap[type as keyof typeof typeMap] || type
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}