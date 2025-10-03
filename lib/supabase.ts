import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)

// Tipos para el sistema
export type Database = {
  public: {
    Tables: {
      zone: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          updated_at?: string
        }
      }
      institution: {
        Row: {
          id: string
          zone_id: string
          name: string
          type: 'caps' | 'hospital_seccional' | 'hospital_distrital' | 'hospital_regional'
          address: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          zone_id: string
          name: string
          type: 'caps' | 'hospital_seccional' | 'hospital_distrital' | 'hospital_regional'
          address?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          zone_id?: string
          name?: string
          type?: 'caps' | 'hospital_seccional' | 'hospital_distrital' | 'hospital_regional'
          address?: string | null
          phone?: string | null
          updated_at?: string
        }
      }
      appointment: {
        Row: {
          id: string
          patient_id: string
          professional_id: string
          service_id: string
          room_id: string | null
          institution_id: string
          scheduled_at: string
          status: 'pendiente' | 'esperando' | 'llamado' | 'en_consulta' | 'finalizado' | 'cancelado' | 'ausente'
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          professional_id: string
          service_id: string
          room_id?: string | null
          institution_id: string
          scheduled_at: string
          status?: 'pendiente' | 'esperando' | 'llamado' | 'en_consulta' | 'finalizado' | 'cancelado' | 'ausente'
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          professional_id?: string
          service_id?: string
          room_id?: string | null
          institution_id?: string
          scheduled_at?: string
          status?: 'pendiente' | 'esperando' | 'llamado' | 'en_consulta' | 'finalizado' | 'cancelado' | 'ausente'
          notes?: string | null
          created_by?: string | null
          updated_at?: string
        }
      }
    }
  }
}

export type AppointmentStatus = Database['public']['Tables']['appointment']['Row']['status']
export type InstitutionType = Database['public']['Tables']['institution']['Row']['type']