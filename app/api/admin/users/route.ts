import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password, first_name, last_name, is_active } = await request.json()

    // Validar que el usuario actual sea super_admin
    // TODO: Agregar validación de sesión aquí

    // Crear usuario en Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Crear registro en tabla users
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        first_name,
        last_name,
        password_hash: '', // Manejado por Supabase Auth
        is_active
      })
      .select()
      .single()

    if (userError) {
      console.error('Error creating user record:', userError)
      // Intentar eliminar el usuario de auth si falla la creación en users
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/admin/users:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
