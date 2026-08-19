'use client'

import { useEffect } from 'react'
import { PauseIcon, PlayIcon } from '@/components/ui/icons'

interface TimeScrubberProps {
  hour: number
  onHourChange: (hour: number) => void
  playing: boolean
  onPlayingChange: (playing: boolean) => void
  source?: string
}

/** 재생 시 한 시간당 머무는 시간(ms). 24시간을 약 15초에 훑는다. */
const STEP_MS = 620

export function TimeScrubber({
  hour,
  onHourChange,
  playing,
  onPlayingChange,
  source = '서울 열린데이터광장 · S-DoT',
}: TimeScrubberProps) {
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      onHourChange((hour + 1) % 24)
    }, STEP_MS)
    return () => clearInterval(id)
  }, [playing, hour, onHourChange])

  return (
    <div className="flex items-center gap-3 border-t border-hair pt-3">
      <button
        type="button"
        onClick={() => onPlayingChange(!playing)}
        aria-label={playing ? '재생 멈춤' : '시간대 재생'}
        className="flex-none rounded-md p-1 text-brand transition-colors duration-200 hover:bg-brand-light"
      >
        {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
      </button>

      <input
        type="range"
        min={0}
        max={23}
        step={1}
        value={hour}
        onChange={(e) => onHourChange(Number(e.target.value))}
        aria-label="시각 선택"
        className="h-1.5 min-w-10 flex-1 cursor-pointer appearance-none rounded-full bg-track accent-brand"
        style={{
          background: `linear-gradient(to right, var(--color-brand) 0%, var(--color-brand) ${(hour / 23) * 100}%, var(--color-track) ${(hour / 23) * 100}%, var(--color-track) 100%)`,
        }}
      />

      <span className="tnum flex-none text-[15px] font-semibold text-ink">
        {String(hour).padStart(2, '0')}:00
      </span>
      <span className="flex-none border-l border-hair pl-3 text-[13px] text-faint">
        {source}
      </span>
    </div>
  )
}
