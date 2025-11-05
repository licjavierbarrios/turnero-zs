'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface UserMembership {
  user_id: string
  institution_id: string
  role: string
  institution_name?: string
  zone_name?: string | undefined
}

export function useUserMembership() {
  const [userMembership, setUserMembership] = useState<UserMembership | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchUserMembership = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setUserMembership(null)
          return
        }

        // Buscar membresía del usuario
        const { data: membership, error: membershipError } = await supabase
          .from('membership')
          .select('user_id, institution_id, role')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()

        if (membershipError) {
          if (membershipError.code === 'PGRST116') {
            // No membership found
            setUserMembership(null)
            setError('No se encontró membresía activa para este usuario')
          } else {
            throw membershipError
          }
          return
        }

        if (isMounted && membership) {
          const membershipData: UserMembership = {
            user_id: membership.user_id,
            institution_id: membership.institution_id,
            role: membership.role
          }
          setUserMembership(membershipData)
        }
      } catch (err) {
        console.error('Error fetching user membership:', err)
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchUserMembership()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserMembership()
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { userMembership, loading, error }
}