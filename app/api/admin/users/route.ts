import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { logAuthFailure, logApiError } from '@/lib/monitoring'
import { getClientIP } from '@/lib/headers'

/**
 * POST /api/admin/users
 *
 * Crea un nuevo usuario en el sistema (SUPER_ADMIN ONLY)
 *
 * Requiere:
 * - Bearer token del usuario autenticado
 * - Usuario debe tener rol super_admin
 *
 * Body:
 * {
 *   "email": "usuario@example.com",
 *   "password": "password123",
 *   "first_name": "Juan",
 *   "last_name": "Pérez",
 *   "is_active": true
 * }
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)

  try {
    // ============================================================================
    // PASO 1: Validar token Bearer
    // ============================================================================
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      await logAuthFailure(
        request,
        '/api/admin/users',
        'Missing or invalid Bearer token'
      )
      console.warn(`[SECURITY] Unauthorized attempt to create user from IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Bearer token' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)

    // ============================================================================
    // PASO 2: Verificar que el token sea válido
    // ============================================================================
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      await logAuthFailure(request, '/api/admin/users', 'Invalid or expired token')
      console.warn(`[SECURITY] Invalid token attempt from IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired token' },
        { status: 401 }
      )
    }

    // ============================================================================
    // PASO 3: Verificar que el usuario sea SUPER_ADMIN
    // ============================================================================
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('membership')
      .select('role, is_active')
      .eq('user_id', user.id)

    if (membershipError) {
      console.error('Error fetching memberships:', membershipError)
      await logApiError(request, '/api/admin/users', membershipError, user.id)
      return NextResponse.json(
        { error: 'Error validating permissions' },
        { status: 500 }
      )
    }

    const isSuperAdmin = memberships?.some(
      (m: any) => m.role === 'super_admin' && m.is_active === true
    )

    if (!isSuperAdmin) {
      await logAuthFailure(
        request,
        '/api/admin/users',
        `User ${user.id} attempted to create user without super_admin role`
      )
      console.warn(
        `[SECURITY] Forbidden: User ${user.id} (${user.email}) attempted unauthorized user creation from IP: ${clientIP}`
      )
      return NextResponse.json(
        { error: 'Forbidden: Super admin role required' },
        { status: 403 }
      )
    }

    // ============================================================================
    // PASO 4: Validar datos del request
    // ============================================================================
    const { email, password, first_name, last_name, is_active } = await request.json()

    // Validaciones básicas
    if (!email || !password || !first_name || !last_name) {
      await logAuthFailure(
        request,
        '/api/admin/users',
        'Missing required fields: email, password, first_name, last_name'
      )
      return NextResponse.json(
        {
          error: 'Missing required fields: email, password, first_name, last_name',
        },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validar longitud de password (mínimo 8 caracteres)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // ============================================================================
    // PASO 5: Crear usuario en Supabase Auth
    // ============================================================================
    const { data: authUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
      },
    })

    if (createAuthError) {
      console.error('Error creating auth user:', createAuthError)
      await logApiError(
        request,
        '/api/admin/users',
        createAuthError,
        user.id
      )
      return NextResponse.json(
        { error: createAuthError.message },
        { status: 400 }
      )
    }

    // ============================================================================
    // PASO 6: Crear registro en tabla users
    // ============================================================================
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        first_name,
        last_name,
        password_hash: '', // Manejado por Supabase Auth
        is_active: is_active !== false, // Default a true
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user record:', userError)
      // Intentar eliminar el usuario de auth si falla la creación en users
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      } catch (deleteError) {
        console.error('Error deleting auth user after users table failure:', deleteError)
      }
      await logApiError(request, '/api/admin/users', userError, user.id)
      return NextResponse.json(
        { error: userError.message },
        { status: 400 }
      )
    }

    // ============================================================================
    // PASO 7: Registrar creación exitosa
    // ============================================================================
    console.log(
      `[AUDIT] User ${user.id} (${user.email}) created new user: ${newUser.id} (${email})`
    )

    return NextResponse.json(
      {
        user: newUser,
        message: 'Usuario creado exitosamente'
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error in POST /api/admin/users:', error)
    await logApiError(request, '/api/admin/users', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
