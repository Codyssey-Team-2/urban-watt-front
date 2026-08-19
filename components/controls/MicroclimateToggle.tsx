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
}

/** 데모의 핵심 인터랙션. 이 토글 하나가 지도·카드·차트를 동시에 바꾼다. */
export function MicroclimateToggle({
  scenario,
  onChange,
}: MicroclimateToggleProps) {
  return (
    <Panel className="flex items-center gap-1 self-stretch p-1">
      {OPTIONS.map((option) => {
        const active = scenario === option.key
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.key)}
            className={cn(
              'rounded-[10px] px-4 py-2 text-[13px] transition-colors duration-200',
              active
                ? 'bg-brand font-semibold text-white shadow-[0_1px_3px_rgba(23,145,92,0.3)]'
                : 'text-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </Panel>
  )
}
