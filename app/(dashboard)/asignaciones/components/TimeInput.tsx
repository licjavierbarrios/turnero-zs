'use client'

import { cn } from '@/lib/utils'

interface TimeInputProps {
  hh: string
  mm: string
  onChangeHH: (v: string) => void
  onChangeMM: (v: string) => void
  disabled?: boolean
}

export function TimeInput({ hh, mm, onChangeHH, onChangeMM, disabled }: TimeInputProps) {
  const segmentClass =
    'w-7 text-center bg-transparent outline-none tabular-nums placeholder:text-muted-foreground disabled:cursor-not-allowed'

  return (
    <div
      className={cn(
        'flex items-center h-9 rounded-md border border-input px-2 gap-0.5 text-sm',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="--"
        value={hh}
        onChange={(e) => onChangeHH(e.target.value)}
        onFocus={(e) => e.target.select()}
        disabled={disabled}
        className={segmentClass}
        aria-label="horas"
      />
      <span className="text-muted-foreground select-none">:</span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        placeholder="--"
        value={mm}
        onChange={(e) => onChangeMM(e.target.value)}
        onFocus={(e) => e.target.select()}
        disabled={disabled}
        className={segmentClass}
        aria-label="minutos"
      />
    </div>
  )
}
