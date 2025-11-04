// Types para Turnero ZS
// Sistema de gestión de turnos multi-zona

// ============================================================================
// ENUMS
// ============================================================================

export type InstitutionType =
  | 'caps'
  | 'hospital_seccional'
  | 'hospital_distrital'
  | 'hospital_regional';

export type AppointmentStatus =
  | 'pendiente'
  | 'esperando'
  | 'llamado'
  | 'en_consulta'
  | 'finalizado'
  | 'cancelado'
  | 'ausente';

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'administrativo'
  | 'profesional'
  | 'servicio'
  | 'pantalla';

// ============================================================================
// ENTIDADES BASE
// ============================================================================

export interface Zone {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Institution {
  id: string;
  zone_id: string;
  name: string;
  type: InstitutionType;
  address?: string;
  phone?: string;
  slug: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  zone?: Zone;
}

export interface Room {
  id: string;
  institution_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  institution?: Institution;
}

export interface Service {
  id: string;
  institution_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  institution?: Institution;
}

export interface Professional {
  id: string;
  institution_id: string;
  first_name: string;
  last_name: string;
  speciality?: string;
  license_number?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  institution?: Institution;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  dni?: string;
  email?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  institution_id: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones
  user?: User;
  institution?: Institution;
}

export interface UserProfessional {
  id: string;
  user_id: string;
  professional_id: string;
  institution_id: string;
  professional_role: 'profesional' | 'servicio' | 'otro';
  is_active: boolean;
  assigned_at: string;
  assigned_by?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  user?: User;
  professional?: Professional;
  institution?: Institution;
}

export interface Appointment {
  id: string;
  patient_id: string;
  professional_id: string;
  service_id: string;
  room_id?: string;
  institution_id: string;
  scheduled_at: string;
  status: AppointmentStatus;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  patient?: Patient;
  professional?: Professional;
  service?: Service;
  room?: Room;
  institution?: Institution;
}

// ============================================================================
// TIPOS EXTENDIDOS PARA UI
// ============================================================================

export interface InstitutionWithZone extends Institution {
  zone: Zone;
}

export interface MembershipWithRelations extends Membership {
  user: User;
  institution: InstitutionWithZone;
}

export interface AppointmentWithRelations extends Appointment {
  patient: Patient;
  professional: Professional;
  service: Service;
  room?: Room;
  institution: InstitutionWithZone;
}

// ============================================================================
// CONTEXTO DE USUARIO
// ============================================================================

export interface UserContext {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  memberships: MembershipWithRelations[];
  current_role?: UserRole;
  current_institution?: Institution;
}

// Helper para verificar roles
export interface RoleCheck {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isAdministrativo: boolean;
  isMedico: boolean;
  isEnfermeria: boolean;
  isPantalla: boolean;
}

// ============================================================================
// TIPOS PARA FORMULARIOS
// ============================================================================

export interface ZoneFormData {
  name: string;
  description?: string;
}

export interface InstitutionFormData {
  zone_id: string;
  name: string;
  type: InstitutionType;
  address?: string;
  phone?: string;
  slug: string;
}

export interface RoomFormData {
  institution_id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface ServiceFormData {
  institution_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  is_active: boolean;
}

export interface ProfessionalFormData {
  institution_id: string;
  first_name: string;
  last_name: string;
  speciality?: string;
  license_number?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}

export interface PatientFormData {
  first_name: string;
  last_name: string;
  dni?: string;
  email?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
}

export interface UserFormData {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

export interface MembershipFormData {
  user_id: string;
  institution_id: string;
  role: UserRole;
  is_active: boolean;
}

// ============================================================================
// TIPOS PARA RESPUESTAS DE API
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// TIPOS PARA SUPABASE
// ============================================================================

export interface SupabaseUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: SupabaseUser;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  caps: 'CAPS',
  hospital_seccional: 'Hospital Seccional',
  hospital_distrital: 'Hospital Distrital',
  hospital_regional: 'Hospital Regional',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pendiente: 'Pendiente',
  esperando: 'En Espera',
  llamado: 'Llamado',
  en_consulta: 'En Consulta',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  ausente: 'Ausente',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Administrador',
  admin: 'Administrador',
  administrativo: 'Administrativo',
  profesional: 'Profesional',
  servicio: 'Servicio',
  pantalla: 'Pantalla',
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  pendiente: 'bg-gray-100 text-gray-800',
  esperando: 'bg-yellow-100 text-yellow-800',
  llamado: 'bg-blue-100 text-blue-800',
  en_consulta: 'bg-green-100 text-green-800',
  finalizado: 'bg-gray-100 text-gray-500',
  cancelado: 'bg-red-100 text-red-800',
  ausente: 'bg-orange-100 text-orange-800',
};

export const USER_ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  administrativo: 'bg-green-100 text-green-800',
  profesional: 'bg-indigo-100 text-indigo-800',
  servicio: 'bg-pink-100 text-pink-800',
  pantalla: 'bg-gray-100 text-gray-800',
};
