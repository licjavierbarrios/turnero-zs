'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function TVSlugPage() {
  const router = useRouter()
  const params = useParams()
  const slug = params.slug as string

  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [institutionId, setInstitutionId] = useState<string | null>(null)
  const [institutionName, setInstitutionName] = useState<string>('')
  const [resolving, setResolving] = useState(true)

  // Resolver slug → institution_id al montar
  useEffect(() => {
    const resolveInstitution = async () => {
      const { data, error: instError } = await supabase
        .from('institution')
        .select('id, name')
        .eq('slug', slug)
        .single()

      if (instError || !data) {
        setError('Institución no encontrada. Verificá la URL.')
        setResolving(false)
        return
      }

      setInstitutionId(data.id)
      setInstitutionName(data.name)
      setResolving(false)
    }

    resolveInstitution()
  }, [slug])

  const confirmPin = async (fullPin: string) => {
    if (!institutionId) return
    setLoading(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('screen')
      .select('id')
      .eq('pin', fullPin)
      .eq('institution_id', institutionId)
      .eq('is_active', true)
      .single()

    setLoading(false)

    if (dbError || !data) {
      setError('PIN incorrecto. Verificá el número con el administrador.')
      setPin('')
      return
    }

    router.push(`/pantalla/${data.id}`)
  }

  const handleDigit = (digit: string) => {
    if (pin.length < 4 && !loading) {
      const newPin = pin + digit
      setPin(newPin)
      setError('')
      if (newPin.length === 4) {
        setTimeout(() => confirmPin(newPin), 300)
      }
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setError('')
  }

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '']

  if (resolving) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-blue-400 text-lg animate-pulse">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-8 select-none">
      {/* Título */}
      <div className="text-center">
        {institutionName && (
          <p className="text-blue-400 text-base uppercase tracking-widest mb-1">
            {institutionName}
          </p>
        )}
        <h1 className="text-white text-3xl font-light tracking-widest uppercase">
          Sistema de Turnos
        </h1>
        <p className="text-gray-400 text-lg mt-2">
          {institutionId
            ? 'Ingresá el PIN de esta pantalla'
            : 'Institución no encontrada'}
        </p>
      </div>

      {institutionId && (
        <>
          {/* Display del PIN */}
          <div className="flex gap-4">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-16 h-20 rounded-xl flex items-center justify-center text-4xl font-bold border-2 transition-all
                  ${pin.length > i
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-600'
                  }`}
              >
                {pin[i] ?? '·'}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-base text-center max-w-xs">{error}</p>
          )}

          {/* Teclado numérico */}
          <div className="grid grid-cols-3 gap-3">
            {digits.map((digit, i) => {
              if (digit === '') {
                if (i === 11) {
                  return (
                    <button
                      key={i}
                      onClick={handleDelete}
                      disabled={pin.length === 0 || loading}
                      className="w-24 h-16 rounded-xl bg-gray-700 text-white text-xl font-medium
                        hover:bg-gray-600 active:bg-gray-500 disabled:opacity-30 transition-colors
                        flex items-center justify-center"
                    >
                      ⌫
                    </button>
                  )
                }
                return <div key={i} className="w-24 h-16" />
              }
              return (
                <button
                  key={i}
                  onClick={() => handleDigit(digit)}
                  disabled={pin.length >= 4 || loading}
                  className="w-24 h-16 rounded-xl bg-gray-700 text-white text-2xl font-semibold
                    hover:bg-gray-600 active:bg-gray-500 disabled:opacity-30 transition-colors"
                >
                  {digit}
                </button>
              )
            })}
          </div>

          {/* Estado de carga */}
          {loading && (
            <p className="text-blue-400 text-base animate-pulse">Verificando...</p>
          )}
        </>
      )}

      {/* Error de institución */}
      {!institutionId && error && (
        <p className="text-red-400 text-base text-center max-w-xs">{error}</p>
      )}
    </div>
  )
}
