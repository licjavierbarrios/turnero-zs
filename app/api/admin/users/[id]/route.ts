import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { logAuthFailure, logApiError } from '@/lib/monitoring'
import { getClientIP } from '@/lib/headers'

/**
 * PATCH /api/admin/users/[id]
 *
 * Actualiza datos de un usuario existente: email, contraseña, nombre, apellido, is_active.
 * Todos los campos son opcionales — solo se actualizan los que se envíen.
 *
 * Requiere:
 * - Bearer token del usuario autenticado
 * - Usuario debe tener rol super_admin o admin
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params
  const clientIP = getClientIP(request)

  try {
    // =========================================================================
    // PASO 1: Validar token Bearer
    // =========================================================================
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      await logAuthFailure(request, '/api/admin/users/[id]', 'Missing or invalid Bearer token')
      console.warn(`[SECURITY] Unauthorized update attempt from IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Bearer token' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)

    // =========================================================================
    // PASO 2: Verificar que el token sea válido
    // =========================================================================
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      await logAuthFailure(request, '/api/admin/users/[id]', 'Invalid or expired token')
      console.warn(`[SECURITY] Invalid token update attempt from IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired token' },
        { status: 401 }
      )
    }

    // =========================================================================
    // PASO 3: Verificar que el usuario sea SUPER_ADMIN o ADMIN
    // =========================================================================
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('membership')
      .select('role, is_active')
      .eq('user_id', user.id)

    if (membershipError) {
      await logApiError(request, '/api/admin/users/[id]', membershipError, user.id)
      return NextResponse.json({ error: 'Error validating permissions' }, { status: 500 })
    }

    const hasPermission = memberships?.some(
      (m: any) => (m.role === 'super_admin' || m.role === 'admin') && m.is_active === true
    )

    if (!hasPermission) {
      await logAuthFailure(
        request,
        '/api/admin/users/[id]',
        `User ${user.id} attempted to update user without permission`
      )
      console.warn(
        `[SECURITY] Forbidden: User ${user.id} (${user.email}) attempted unauthorized user update from IP: ${clientIP}`
      )
      return NextResponse.json(
        { error: 'Forbidden: Se requiere rol de super_admin o admin' },
        { status: 403 }
      )
    }

    // =========================================================================
    // PASO 4: Leer y validar body
    // =========================================================================
    const body = await request.json()
    const { email, password, first_name, last_name, is_active } = body

    // Validar email si se envía
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Formato de email inválido' }, { status: 400 })
      }
    }

    // Validar contraseña si se envía
    if (password !== undefined) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 8 caracteres' },
          { status: 400 }
        )
      }
      if (!/[A-Z]/.test(password)) {
        return NextResponse.json(
          { error: 'La contraseña debe incluir al menos una mayúscula' },
          { status: 400 }
        )
      }
      if (!/[0-9]/.test(password)) {
        return NextResponse.json(
          { error: 'La contraseña debe incluir al menos un número' },
          { status: 400 }
        )
      }
    }

    // =========================================================================
    // PASO 5: Actualizar Supabase Auth (email y/o contraseña)
    // =========================================================================
    const authUpdate: Record<string, string> = {}
    if (email !== undefined) authUpdate.email = email
    if (password !== undefined) authUpdate.password = password

    if (Object.keys(authUpdate).length > 0) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
        targetUserId,
        authUpdate
      )
      if (authUpdateError) {
        await logApiError(request, '/api/admin/users/[id]', authUpdateError, user.id)
        return NextResponse.json({ error: authUpdateError.message }, { status: 400 })
      }
    }

    // =========================================================================
    // PASO 6: Actualizar tabla users
    // =========================================================================
    const tableUpdate: Record<string, unknown> = {}
    if (email !== undefined) tableUpdate.email = email
    if (first_name !== undefined) tableUpdate.first_name = first_name
    if (last_name !== undefined) tableUpdate.last_name = last_name
    if (is_active !== undefined) tableUpdate.is_active = is_active

    if (Object.keys(tableUpdate).length > 0) {
      const { error: userErr } = await supabaseAdmin
        .from('users')
        .update(tableUpdate)
        .eq('id', targetUserId)

      if (userErr) {
        await logApiError(request, '/api/admin/users/[id]', userErr, user.id)
        return NextResponse.json({ error: userErr.message }, { status: 400 })
      }
    }

    console.log(`[AUDIT] User ${user.id} (${user.email}) updated user ${targetUserId}`)

    return NextResponse.json({ message: 'Usuario actualizado exitosamente' })
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/users/[id]:', error)
    await logApiError(request, '/api/admin/users/[id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
