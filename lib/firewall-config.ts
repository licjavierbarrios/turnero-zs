/**
 * Configuración centralizada de Vercel Firewall
 * Define comportamiento y límites de rate limiting y geo-blocking
 */

/**
 * Configuración de Rate Limiting
 */
export const RATE_LIMIT_CONFIG = {
  // Estos valores coinciden con la configuración en Vercel Dashboard
  // NO cambiar sin actualizar también en Vercel Firewall
  ENABLED: true,
  REQUESTS_PER_WINDOW: 100,
  WINDOW_SECONDS: 60,

  // Endpoints excluidos de rate limiting (si existieran)
  EXCLUDED_ENDPOINTS: [] as string[],

  // Mensaje de error cuando se excede el límite
  ERROR_MESSAGE: 'Demasiadas solicitudes. Intente nuevamente en 1 minuto.',

  // URL de redireccionamiento cuando se excede el límite
  REDIRECT_URL: '/error/429',
};

/**
 * Configuración de Geo-Blocking
 */
export const GEO_BLOCK_CONFIG = {
  // Estos valores coinciden con la configuración en Vercel Dashboard
  // NO cambiar sin actualizar también en Vercel Firewall
  ENABLED: true,

  // Códigos ISO 2 de países permitidos
  ALLOWED_COUNTRIES: ['AR'] as string[],

  // Mensaje de error cuando el acceso es denegado
  ERROR_MESSAGE: 'Este servicio solo está disponible en Argentina.',

  // Url de redireccionamiento cuando se bloquea por país
  REDIRECT_URL: '/error/403',
};

/**
 * Configuración de Monitoreo y Logging
 */
export const MONITORING_CONFIG = {
  // Loguear todos los requests a /api/*
  LOG_API_REQUESTS: true,

  // Loguear eventos de seguridad en Supabase
  LOG_SECURITY_EVENTS: true,

  // Tipos de eventos a loguear
  LOG_LEVELS: {
    rate_limit: true,
    geo_block: true,
    auth_fail: true,
    invalid_token: true,
    suspicious_request: true,
    api_error: true,
  },
};

/**
 * Validación de la configuración
 * Asegura que los valores sean coherentes
 */
export function validateFirewallConfig(): boolean {
  // Validar que RATE_LIMIT_CONFIG.REQUESTS_PER_WINDOW sea válido
  if (RATE_LIMIT_CONFIG.REQUESTS_PER_WINDOW <= 0) {
    console.error(
      'Invalid RATE_LIMIT_CONFIG: REQUESTS_PER_WINDOW must be > 0'
    );
    return false;
  }

  // Validar que RATE_LIMIT_CONFIG.WINDOW_SECONDS sea válido
  if (RATE_LIMIT_CONFIG.WINDOW_SECONDS <= 0) {
    console.error(
      'Invalid RATE_LIMIT_CONFIG: WINDOW_SECONDS must be > 0'
    );
    return false;
  }

  // Validar que haya al menos un país permitido
  if (GEO_BLOCK_CONFIG.ALLOWED_COUNTRIES.length === 0) {
    console.error(
      'Invalid GEO_BLOCK_CONFIG: ALLOWED_COUNTRIES must have at least one country'
    );
    return false;
  }

  return true;
}

/**
 * Obtiene el resumen de configuración para logging
 */
export function getFirewallConfigSummary() {
  return {
    rateLimit: {
      enabled: RATE_LIMIT_CONFIG.ENABLED,
      requestsPerWindow: RATE_LIMIT_CONFIG.REQUESTS_PER_WINDOW,
      windowSeconds: RATE_LIMIT_CONFIG.WINDOW_SECONDS,
    },
    geoBlock: {
      enabled: GEO_BLOCK_CONFIG.ENABLED,
      allowedCountries: GEO_BLOCK_CONFIG.ALLOWED_COUNTRIES,
    },
    monitoring: {
      enabled: MONITORING_CONFIG.LOG_SECURITY_EVENTS,
    },
  };
}
