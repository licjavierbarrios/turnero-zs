/**
 * Utilidades para monitoreo y logging de eventos de seguridad
 * Registra intentos de rate limit, geo-blocking y otros eventos
 */

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest } from 'next/server';
import { getClientCountry, getClientIP } from '@/lib/headers';

export type SecurityEventType =
  | 'rate_limit'
  | 'geo_block'
  | 'auth_fail'
  | 'invalid_token'
  | 'suspicious_request'
  | 'api_error';

export interface SecurityLogEntry {
  event_type: SecurityEventType;
  ip_address: string | null;
  country: string | null;
  endpoint: string;
  method: string;
  status_code: number;
  user_id?: string | null;
  details: Record<string, any>;
  created_at?: string;
}

/**
 * Registra un evento de seguridad en la base de datos
 * @param entry - Información del evento de seguridad
 */
export async function logSecurityEvent(entry: SecurityLogEntry): Promise<void> {
  try {
    // Log en consola primero (para debugging local)
    console.log(`[SECURITY] ${entry.event_type.toUpperCase()}:`, {
      ip: entry.ip_address,
      country: entry.country,
      endpoint: entry.endpoint,
      method: entry.method,
      status: entry.status_code,
      details: entry.details,
    });

    // Si no está configurada la BD o no estamos en producción, solo loguear en consola
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return;
    }

    // Intentar guardar en Supabase (tabla security_logs)
    // NOTA: Esta tabla debe ser creada con RLS policy para que solo super_admin la vea
    const { error } = await supabaseAdmin.from('security_logs').insert({
      event_type: entry.event_type,
      ip_address: entry.ip_address,
      country: entry.country,
      endpoint: entry.endpoint,
      method: entry.method,
      status_code: entry.status_code,
      user_id: entry.user_id || null,
      details: entry.details,
    });

    if (error) {
      console.error('[SECURITY] Error logging event:', error.message);
      // No lanzar error - el logging de seguridad no debe romper la aplicación
    }
  } catch (error) {
    console.error('[SECURITY] Unexpected error logging event:', error);
    // No lanzar error - el logging de seguridad no debe romper la aplicación
  }
}

/**
 * Registra un intento de rate limit (HTTP 429)
 * @param request - NextRequest del servidor
 * @param endpoint - Ruta del endpoint
 */
export async function logRateLimit(
  request: NextRequest | Request,
  endpoint: string
): Promise<void> {
  const country = getClientCountry(request);
  const ip = getClientIP(request);

  await logSecurityEvent({
    event_type: 'rate_limit',
    ip_address: ip,
    country: country,
    endpoint: endpoint,
    method: request.method,
    status_code: 429,
    details: {
      message: 'Too many requests from this IP',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Registra un intento de acceso bloqueado por país
 * @param request - NextRequest del servidor
 * @param endpoint - Ruta del endpoint
 */
export async function logGeoBlock(
  request: NextRequest | Request,
  endpoint: string
): Promise<void> {
  const country = getClientCountry(request);
  const ip = getClientIP(request);

  await logSecurityEvent({
    event_type: 'geo_block',
    ip_address: ip,
    country: country,
    endpoint: endpoint,
    method: request.method,
    status_code: 403,
    details: {
      message: `Access blocked: Country ${country} is not allowed`,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Registra un fallo de autenticación
 * @param request - NextRequest del servidor
 * @param endpoint - Ruta del endpoint
 * @param reason - Razón del fallo
 */
export async function logAuthFailure(
  request: NextRequest | Request,
  endpoint: string,
  reason: string
): Promise<void> {
  const country = getClientCountry(request);
  const ip = getClientIP(request);

  await logSecurityEvent({
    event_type: 'auth_fail',
    ip_address: ip,
    country: country,
    endpoint: endpoint,
    method: request.method,
    status_code: 401,
    details: {
      reason: reason,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Registra un token inválido
 * @param request - NextRequest del servidor
 * @param endpoint - Ruta del endpoint
 */
export async function logInvalidToken(
  request: NextRequest | Request,
  endpoint: string
): Promise<void> {
  const country = getClientCountry(request);
  const ip = getClientIP(request);

  await logSecurityEvent({
    event_type: 'invalid_token',
    ip_address: ip,
    country: country,
    endpoint: endpoint,
    method: request.method,
    status_code: 401,
    details: {
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Registra un request sospechoso
 * @param request - NextRequest del servidor
 * @param endpoint - Ruta del endpoint
 * @param reason - Razón de la sospecha
 */
export async function logSuspiciousRequest(
  request: NextRequest | Request,
  endpoint: string,
  reason: string
): Promise<void> {
  const country = getClientCountry(request);
  const ip = getClientIP(request);

  await logSecurityEvent({
    event_type: 'suspicious_request',
    ip_address: ip,
    country: country,
    endpoint: endpoint,
    method: request.method,
    status_code: 400,
    details: {
      reason: reason,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Registra un error de API
 * @param request - NextRequest del servidor
 * @param endpoint - Ruta del endpoint
 * @param error - Error que ocurrió
 * @param userId - ID del usuario (opcional)
 */
export async function logApiError(
  request: NextRequest | Request,
  endpoint: string,
  error: Error | string,
  userId?: string | null
): Promise<void> {
  const country = getClientCountry(request);
  const ip = getClientIP(request);
  const errorMessage = error instanceof Error ? error.message : String(error);

  await logSecurityEvent({
    event_type: 'api_error',
    ip_address: ip,
    country: country,
    endpoint: endpoint,
    method: request.method,
    status_code: 500,
    user_id: userId,
    details: {
      error: errorMessage,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Obtiene un resumen de eventos de seguridad recientes (último 1 hora)
 * Solo para super_admin en dashboard
 * @returns Conteo de eventos por tipo en la última hora
 */
export async function getSecurityEventsSummary() {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('security_logs')
      .select('event_type')
      .gte('created_at', oneHourAgo);

    if (error) {
      console.error('Error fetching security events:', error);
      return null;
    }

    // Contar eventos por tipo
    const summary: Record<SecurityEventType, number> = {
      rate_limit: 0,
      geo_block: 0,
      auth_fail: 0,
      invalid_token: 0,
      suspicious_request: 0,
      api_error: 0,
    };

    data?.forEach((event: any) => {
      if (event.event_type in summary) {
        summary[event.event_type as SecurityEventType]++;
      }
    });

    return summary;
  } catch (error) {
    console.error('Error in getSecurityEventsSummary:', error);
    return null;
  }
}
