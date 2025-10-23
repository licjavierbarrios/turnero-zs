import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Crear cliente server-side para Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(request: Request) {
  try {
    // Obtener el user_id del header de autorización
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.slice(7)

    // Verificar token y obtener usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Obtener membresías con institución y zona (optimizado con select específico)
    const { data: memberships, error: membershipError } = await supabase
      .from('membership')
      .select(`
        id,
        role,
        is_active,
        institution:institution_id (
          id,
          name,
          type,
          address,
          zone:zone_id (
            id,
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (membershipError) {
      console.error('Error fetching memberships:', membershipError)
      return NextResponse.json(
        { error: 'Error fetching memberships' },
        { status: 500 }
      )
    }

    // Obtener datos del usuario también
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user data:', userError)
      return NextResponse.json(
        { error: 'Error fetching user data' },
        { status: 500 }
      )
    }

    // Transformar membresías al formato que espera el frontend
    const transformedMemberships = memberships
      .filter((m: any) => m.institution)
      .map((m: any) => ({
        id: m.institution.id,
        name: m.institution.name,
        type: m.institution.type,
        zone_name: m.institution.zone?.name || 'Sin zona',
        address: m.institution.address || 'Sin dirección',
        user_role: m.role
      }))

    return NextResponse.json({
      user: userData,
      institutions: transformedMemberships,
      hasMultipleInstitutions: transformedMemberships.length > 1
    })
  } catch (error) {
    console.error('Error in memberships API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
