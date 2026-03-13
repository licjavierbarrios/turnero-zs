import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getMidnightExpiry(): Date {
  const midnight = new Date()
  midnight.setHours(23, 59, 59, 999)
  return midnight
}

export async function POST(request: NextRequest) {
  try {
    const { pin, slug } = await request.json()

    if (!pin || !slug) {
      return NextResponse.json({ error: 'PIN y slug requeridos' }, { status: 400 })
    }

    // Resolver slug → institution_id
    const { data: institution, error: instError } = await supabaseAdmin
      .from('institution')
      .select('id')
      .eq('slug', slug)
      .single()

    if (instError || !institution) {
      return NextResponse.json({ error: 'Institución no encontrada' }, { status: 404 })
    }

    // Validar PIN para esa institución
    const { data: screen, error: screenError } = await supabaseAdmin
      .from('screen')
      .select('id, name')
      .eq('pin', pin)
      .eq('institution_id', institution.id)
      .eq('is_active', true)
      .single()

    if (screenError || !screen) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
    }

    // Generar JWT firmado
    const secret = new TextEncoder().encode(process.env.SCREEN_SESSION_SECRET!)
    const midnight = getMidnightExpiry()

    const token = await new SignJWT({
      screenId: screen.id,
      screenName: screen.name,
      tvPath: `/tv/${slug}`,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(Math.floor(midnight.getTime() / 1000))
      .sign(secret)

    // Respuesta con cookie httpOnly
    const response = NextResponse.json({ screenId: screen.id })

    response.cookies.set('screen_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: midnight,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[screen-session] Error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
