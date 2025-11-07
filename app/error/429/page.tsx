'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function TooManyRequestsPage() {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-orange-600 mb-4">429</h1>
          <p className="text-gray-600 text-lg">Demasiadas solicitudes</p>
        </div>

        {/* Message */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ⏸️ Por favor, espera
          </h2>
          <p className="text-gray-600 mb-6">
            Has realizado demasiadas solicitudes en poco tiempo. Por razones de seguridad,
            tu IP ha sido temporalmente limitada.
          </p>

          {/* Countdown */}
          {countdown > 0 && (
            <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-4 mb-6">
              <p className="text-orange-900 font-semibold">
                Intenta nuevamente en:
              </p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {countdown}s
              </p>
            </div>
          )}

          {countdown === 0 && (
            <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4 mb-6">
              <p className="text-green-900 font-semibold">
                ✅ Ya puedes intentar nuevamente
              </p>
            </div>
          )}
        </div>

        {/* Recommendations */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-8">
          <h3 className="font-bold text-blue-900 mb-3">💡 Recomendaciones:</h3>
          <ul className="text-left text-sm text-blue-800 space-y-2">
            <li>✓ Espera 1 minuto antes de reintentar</li>
            <li>✓ Actualiza la página (F5 o Ctrl+R)</li>
            <li>✓ Evita hacer múltiples solicitudes rápidas</li>
            <li>✓ Si el problema persiste, contacta con soporte</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            disabled={countdown > 0}
            className={`w-full py-3 rounded-lg font-semibold transition-all ${
              countdown > 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-95'
            }`}
          >
            {countdown > 0 ? `Espera ${countdown}s` : 'Reintentar'}
          </button>

          <Link
            href="/"
            className="block w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all"
          >
            Volver al inicio
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-8">
          Error 429 • Vercel Firewall • Rate Limit
        </p>
      </div>
    </div>
  );
}
