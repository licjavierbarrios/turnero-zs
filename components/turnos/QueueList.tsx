'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { PatientCard } from './PatientCard'

interface QueueListProps {
  filteredQueue: any[]
  callingId: string | null
  updateStatus: (id: string, status: any, extra?: any) => void
  currentUserId: string
}

const FINISHED_STATUSES = ['atendido', 'cancelado']

export function QueueList({ filteredQueue, callingId, updateStatus, currentUserId }: QueueListProps) {
  const [showFinished, setShowFinished] = useState(false)

  const activeItems = filteredQueue.filter(item => !FINISHED_STATUSES.includes(item.status))
  const finishedItems = filteredQueue.filter(item => FINISHED_STATUSES.includes(item.status))

  return (
    <div className="grid gap-2">
      {/* Turnos activos */}
      {activeItems.map((item: any) => (
        <PatientCard
          key={item.id}
          item={item}
          isOptimistic={item.id.startsWith('temp-')}
          callingId={callingId}
          onUpdateStatus={updateStatus}
          currentUserId={currentUserId}
          createdBy={item.created_by}
        />
      ))}

      {/* Acordión de turnos finalizados */}
      {finishedItems.length > 0 && (
        <div className="mt-1">
          <button
            onClick={() => setShowFinished(v => !v)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {showFinished
              ? <ChevronDown className="h-4 w-4 shrink-0" />
              : <ChevronRight className="h-4 w-4 shrink-0" />
            }
            <span>
              {finishedItems.length} turno{finishedItems.length !== 1 ? 's' : ''} finalizado{finishedItems.length !== 1 ? 's' : ''} (atendido{finishedItems.length !== 1 ? 's' : ''} / cancelado{finishedItems.length !== 1 ? 's' : ''})
            </span>
          </button>

          {showFinished && (
            <div className="grid gap-2 mt-1">
              {finishedItems.map((item: any) => (
                <PatientCard
                  key={item.id}
                  item={item}
                  isOptimistic={false}
                  callingId={callingId}
                  onUpdateStatus={updateStatus}
                  currentUserId={currentUserId}
                  createdBy={item.created_by}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
