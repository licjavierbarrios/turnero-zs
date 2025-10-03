'use client'

import { useState, useEffect } from 'react'
import { ServiceGroup } from './grid-layout'
import { ServiceCard } from '@/components/service-card'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

interface CarouselLayoutProps {
  services: ServiceGroup[]
  intervalSeconds: number
}

export function CarouselLayout({ services, intervalSeconds }: CarouselLayoutProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Auto-rotate carousel
  useEffect(() => {
    if (services.length <= 1 || isPaused) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % services.length)
    }, intervalSeconds * 1000)

    return () => clearInterval(interval)
  }, [services.length, intervalSeconds, isPaused])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + services.length) % services.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % services.length)
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No hay servicios activos en este momento</p>
      </div>
    )
  }

  const currentService = services[currentIndex]

  return (
    <div className="relative">
      {/* Indicador de progreso */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">
            Servicio {currentIndex + 1} de {services.length}
          </span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {isPaused ? '▶️ Reanudar' : '⏸️ Pausar'}
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / services.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Servicio Actual */}
      <div className="relative min-h-[400px]">
        <div
          className="transition-opacity duration-500"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <ServiceCard
            serviceName={currentService.serviceName}
            appointments={currentService.appointments}
            compact={false}
          />
        </div>

        {/* Controles de navegación */}
        {services.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-all"
              aria-label="Servicio anterior"
            >
              <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-all"
              aria-label="Siguiente servicio"
            >
              <ChevronRightIcon className="h-6 w-6 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Dots de navegación */}
      {services.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {services.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all ${
                idx === currentIndex
                  ? 'bg-blue-600 w-8'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Ir a servicio ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Tiempo hasta siguiente rotación */}
      {!isPaused && services.length > 1 && (
        <div className="text-center mt-4">
          <p className="text-xs text-gray-500">
            Próximo servicio en {intervalSeconds}s
          </p>
        </div>
      )}
    </div>
  )
}
