'use client'

import { useEffect, type Dispatch, type SetStateAction } from 'react'
import { PauseIcon, PlayIcon } from '@/components/ui/icons'
import { clampHour } from '@/lib/mock'

interface TimeScrubberProps {
  hour: number
  onHourChange: Dispatch<SetStateAction<number>>
  playing: boolean
  onPlayingChange: (playing: boolean) => void
  source?: string
  /** 한 시간이 흐르는 데 걸리는 실제 시간(ms) */
  stepMs?: number
}

/** 시각을 HH:MM으로. 정시 사이 값도 그대로 보여야 흐르는 느낌이 난다. */
function formatTime(hour: number) {
  const t = clampHour(hour)
  const h = Math.floor(t)
  const m = Math.floor((t - h) * 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function TimeScrubber({
  hour,
  onHourChange,
  playing,
  onPlayingChange,
  source = '서울 열린데이터광장 · S-DoT',
  stepMs = 620,
}: TimeScrubberProps) {
  // setInterval로 한 시간씩 올리면 값이 계단처럼 튄다.
  // 프레임마다 경과 시간만큼 밀어 연속적으로 흐르게 한다.
  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      const elapsed = now - last
      last = now
      onHourChange((prev) => clampHour(prev + elapsed / stepMs))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, stepMs, onHourChange])

  const progress = (clampHour(hour) / 24) * 100

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
        max={24}
        step={0.05}
        value={clampHour(hour)}
        onChange={(e) => onHourChange(Number(e.target.value))}
        aria-label="시각 선택"
        aria-valuetext={formatTime(hour)}
        className="h-1.5 min-w-10 flex-1 cursor-pointer appearance-none rounded-full accent-brand"
        style={{
          background: `linear-gradient(to right, var(--color-brand) 0%, var(--color-brand) ${progress}%, var(--color-track) ${progress}%, var(--color-track) 100%)`,
        }}
      />

      <span className="tnum w-[52px] flex-none text-[15px] font-semibold text-ink">
        {formatTime(hour)}
      </span>
      <span className="flex-none border-l border-hair pl-3 text-[13px] text-faint">
        {source}
      </span>
    </div>
  )
}
