import { NextRequest, NextResponse } from 'next/server'

/**
 * TTS (Text-to-Speech) endpoint usando Google Translate TTS
 * 
 * Genera un archivo de audio MP3 a partir de texto
 * Alternativa confiable al Web Speech API que no funciona en Android TV
 * 
 * Query params:
 * - text: Texto a sintetizar (requerido)
 * - lang: Idioma (default: es-AR para español argentino)
 */
export async function GET(request: NextRequest) {
  try {
    const text = request.nextUrl.searchParams.get('text')
    const lang = request.nextUrl.searchParams.get('lang') || 'es-AR'

    if (!text) {
      return NextResponse.json(
        { error: 'El parámetro "text" es requerido' },
        { status: 400 }
      )
    }

    // Validar longitud del texto (Google Translate tiene límites)
    if (text.length > 200) {
      return NextResponse.json(
        { error: 'El texto es demasiado largo (máximo 200 caracteres)' },
        { status: 400 }
      )
    }

    // Usar Google Translate TTS (API pública, sin key requerida)
    // Formato: https://translate.google.com/translate_tts?client=gtx&tl={lang}&q={text}
    const ttsUrl = new URL('https://translate.google.com/translate_tts')
    ttsUrl.searchParams.set('client', 'gtx')
    ttsUrl.searchParams.set('tl', lang)
    ttsUrl.searchParams.set('q', text)

    // Hacer request a Google Translate TTS
    const ttsResponse = await fetch(ttsUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      // No seguir redirecciones automáticas para mejor control
      redirect: 'follow',
    })

    if (!ttsResponse.ok) {
      console.error(`Google Translate TTS error: ${ttsResponse.status}`)
      return NextResponse.json(
        { error: 'Error al generar audio' },
        { status: 500 }
      )
    }

    // Obtener el audio como Buffer
    const audioBuffer = await ttsResponse.arrayBuffer()

    // Si la respuesta está vacía, algo salió mal
    if (audioBuffer.byteLength === 0) {
      console.error('Empty audio buffer from Google Translate TTS')
      return NextResponse.json(
        { error: 'No se pudo generar el audio' },
        { status: 500 }
      )
    }

    // Retornar el audio con headers apropiados
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400, immutable', // Cachear por 24 horas
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error en endpoint TTS:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
