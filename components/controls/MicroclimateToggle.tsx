'use client'

import { Panel } from '@/components/layout/Panel'
import { cn } from '@/lib/cn'
import type { ScenarioKey } from '@/lib/types'

const OPTIONS: { key: ScenarioKey; label: string }[] = [
  { key: 'b', label: '기상만' },
  { key: 'c', label: '미기후 반영' },
]

interface MicroclimateToggleProps {
  scenario: ScenarioKey
  onChange: (scenario: ScenarioKey) => void
  /**
   * 서버에 기상만·미기후 예측이 아직 없을 때의 안내 문구.
   * 값이 있으면 토글을 잠그고 이유를 함께 보여준다 — 눌리는데 아무 일도
   * 일어나지 않는 것보다 낫다.
   */
  disabledNote?: string | null
}

/** 데모의 핵심 인터랙션. 이 토글 하나가 지도·카드·차트를 동시에 바꾼다. */
export function MicroclimateToggle({
  scenario,
  onChange,
  disabledNote,
}: MicroclimateToggleProps) {
  const locked = Boolean(disabledNote)

  return (
    <Panel className="self-stretch px-1 py-1">
      <div className="flex items-center gap-1">
        {OPTIONS.map((option) => {
          const active = scenario === option.key
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={active}
              disabled={locked}
              title={disabledNote ?? undefined}
              onClick={() => onChange(option.key)}
              className={cn(
                'rounded-[10px] px-4 py-2 text-[13px] transition-colors duration-200',
                active
                  ? 'bg-brand font-semibold text-white shadow-[0_1px_3px_rgba(23,145,92,0.3)]'
                  : 'text-muted hover:text-ink',
                locked && 'cursor-not-allowed opacity-45 hover:text-muted',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {disabledNote && (
        <p className="max-w-[260px] px-3 pb-1 pt-0.5 text-[13px] leading-snug text-faint">
          {disabledNote}
        </p>
      )}
    </Panel>
  )
}
