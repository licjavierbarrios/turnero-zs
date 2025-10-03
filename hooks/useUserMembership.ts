'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface UserMembership {
  user_id: string
  institution_id: string
  role: string
  institution_name?: string
  zone_name?: string
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
          .select(`
            user_id,
            institution_id,
            role,
            institution:institution_id (
              name,
              zone:zone_id (
                name
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('active', true)
          .single()

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
            role: membership.role,
            institution_name: (membership.institution as any)?.name,
            zone_name: (membership.institution as any)?.zone?.name
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