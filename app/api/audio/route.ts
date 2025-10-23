import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    // Obtener el parámetro 'file' de la query string
    const file = request.nextUrl.searchParams.get('file') || 'dingdong.mp3'

    // Por seguridad, solo permitir archivos de audio específicos
    if (!['dingdong.mp3'].includes(file)) {
      return NextResponse.json(
        { error: 'Archivo no permitido' },
        { status: 403 }
      )
    }

    // Leer el archivo desde la carpeta public/sounds
    const filePath = join(process.cwd(), 'public', 'sounds', file)
    const audioBuffer = await readFile(filePath)

    // Convertir Buffer a Uint8Array para evitar tipo issues con NextResponse
    const uint8Array = new Uint8Array(audioBuffer)

    // Retornar el archivo con headers CORS correctos
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': uint8Array.length.toString(),
        'Cache-Control': 'public, max-age=3600, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error sirviendo archivo de audio:', error)
    return NextResponse.json(
      { error: 'Error al cargar el archivo de audio' },
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
