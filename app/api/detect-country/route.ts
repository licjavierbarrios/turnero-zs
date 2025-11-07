import { NextRequest, NextResponse } from 'next/server';
import { getClientCountry, getClientIP } from '@/lib/headers';

/**
 * Endpoint para detectar el país del cliente
 * Usado por la página de error 403 para mostrar la ubicación detectada
 */
export async function GET(request: NextRequest) {
  try {
    const country = getClientCountry(request);
    const ip = getClientIP(request);

    return NextResponse.json(
      {
        country: country || 'Desconocido',
        ip: ip || 'Desconocida',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al detectar país' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
