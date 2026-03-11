'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function TVPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit)
      setError('')
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setError('')
  }

  const handleConfirm = async () => {
    if (pin.length !== 4) return
    setLoading(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('screen')
      .select('id')
      .eq('pin', pin)
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

  // Auto-confirm when 4 digits entered
  const handleDigitWithAutoConfirm = (digit: string) => {
    if (pin.length === 3) {
      const fullPin = pin + digit
      setPin(fullPin)
      setError('')
      // Confirm after brief delay so user sees the 4th digit
      setTimeout(async () => {
        setLoading(true)
        const { data, error: dbError } = await supabase
          .from('screen')
          .select('id')
          .eq('pin', fullPin)
          .eq('is_active', true)
          .single()
        setLoading(false)
        if (dbError || !data) {
          setError('PIN incorrecto. Verificá el número con el administrador.')
          setPin('')
          return
        }
        router.push(`/pantalla/${data.id}`)
      }, 300)
    } else {
      handleDigit(digit)
    }
  }

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '']

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-8 select-none">
      {/* Título */}
      <div className="text-center">
        <h1 className="text-white text-3xl font-light tracking-widest uppercase">
          Sistema de Turnos
        </h1>
        <p className="text-gray-400 text-lg mt-2">Ingresá el PIN de esta pantalla</p>
      </div>

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
            // Posición vacía o botón borrar
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
              onClick={() => handleDigitWithAutoConfirm(digit)}
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
    </div>
  )
}
