'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ForbiddenPage() {
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    // Intentar obtener el país del cliente desde headers
    // (en el cliente, esto solo es informativo)
    const detectCountry = async () => {
      try {
        const response = await fetch('/api/detect-country');
        if (response.ok) {
          const data = await response.json();
          setCountry(data.country);
        }
      } catch (error) {
        console.log('No se pudo detectar el país');
      }
    };

    detectCountry();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-600 mb-4">403</h1>
          <p className="text-gray-600 text-lg">Acceso denegado</p>
        </div>

        {/* Message */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🌍 Servicio no disponible en tu región
          </h2>
          <p className="text-gray-600 mb-6">
            Este servicio solo está disponible en{' '}
            <span className="font-bold text-blue-600">Argentina</span>.
          </p>

          {country && (
            <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">
                Tu ubicación: <span className="font-bold">{country}</span>
              </p>
            </div>
          )}

          <p className="text-sm text-gray-500">
            Si crees que esto es un error, contacta con soporte.
          </p>
        </div>

        {/* Why this restriction */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-8">
          <h3 className="font-bold text-blue-900 mb-3">ℹ️ ¿Por qué?</h3>
          <p className="text-left text-sm text-blue-800">
            Turnero ZS está diseñado específicamente para centros de salud argentinos
            (CAPS, hospitales). Por razones de regulación y seguridad, el acceso está
            restringido a Argentina.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="https://www.argentina.gob.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-3 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-all active:scale-95"
          >
            Ir a Argentina.gob.ar
          </Link>

          <button
            onClick={() => window.location.href = '/'}
            className="block w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all"
          >
            Volver atrás
          </button>
        </div>

        {/* Support */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">
            ¿Necesitas ayuda?
          </p>
          <a
            href="mailto:soporte@turneroszs.com.ar"
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Contactar con soporte
          </a>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-8">
          Error 403 • Vercel Firewall • Geo-Blocking
        </p>
      </div>
    </div>
  );
}
