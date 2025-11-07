/**
 * Utilidades para manejo de headers de seguridad (Vercel Firewall)
 * Detecta país, IP y proporciona funciones para validar requests
 */

import { NextRequest } from 'next/server';

/**
 * Obtiene el país del cliente desde el header de Vercel
 * @param request - NextRequest del servidor
 * @returns Código ISO 2 del país (ej: 'AR', 'BR') o null
 */
export function getClientCountry(request: NextRequest | Request): string | null {
  if (request instanceof NextRequest) {
    return request.headers.get('x-vercel-ip-country');
  }
  // Para requests normales (sin NextRequest)
  return request.headers.get('x-vercel-ip-country');
}

/**
 * Obtiene la IP del cliente
 * @param request - NextRequest del servidor
 * @returns IP del cliente o null
 */
export function getClientIP(request: NextRequest | Request): string | null {
  if (request instanceof NextRequest) {
    // Intentar diferentes headers en orden de confiabilidad
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') || // Cloudflare
      null
    );
  }
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    null
  );
}

/**
 * Verifica si el cliente es de un país permitido
 * @param request - NextRequest del servidor
 * @param allowedCountries - Array de códigos ISO permitidos (default: ['AR'])
 * @returns true si el país es permitido, false si no
 */
export function isCountryAllowed(
  request: NextRequest | Request,
  allowedCountries: string[] = ['AR']
): boolean {
  const country = getClientCountry(request);
  if (!country) return true; // Si no hay info de país, permitir (puede ser en desarrollo)
  return allowedCountries.includes(country.toUpperCase());
}

/**
 * Estructura de información de seguridad del request
 */
export interface SecurityInfo {
  country: string | null;
  ip: string | null;
  isCountryAllowed: boolean;
  timestamp: Date;
}

/**
 * Obtiene información de seguridad completa del request
 * @param request - NextRequest del servidor
 * @returns Objeto con información de seguridad
 */
export function getSecurityInfo(request: NextRequest | Request): SecurityInfo {
  return {
    country: getClientCountry(request),
    ip: getClientIP(request),
    isCountryAllowed: isCountryAllowed(request),
    timestamp: new Date(),
  };
}

/**
 * Valida si un request debe ser permitido por geo-blocking
 * Nota: Vercel ya bloquea en el edge, pero esta función es útil para logging
 * @param request - NextRequest del servidor
 * @returns objeto con validación y motivo
 */
export function validateGeoAccess(request: NextRequest | Request) {
  const securityInfo = getSecurityInfo(request);

  return {
    allowed: securityInfo.isCountryAllowed,
    reason: securityInfo.isCountryAllowed
      ? 'Country allowed'
      : `Country ${securityInfo.country} is not allowed`,
    ...securityInfo,
  };
}
