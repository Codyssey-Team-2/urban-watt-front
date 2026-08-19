'use client'

import { Panel } from '@/components/layout/Panel'
import { cn } from '@/lib/cn'
import { AlertIcon, RefreshIcon, SparklesIcon } from '@/components/ui/icons'
import type { Briefing } from '@/lib/types'

/**
 * 브리핑은 외부 LLM 호출로 채워질 자리라 실패할 수 있다.
 * 상태를 유니온으로 분리해서, 실패해도 이 카드 안에서만 끝나고
 * 나머지 화면은 그대로 동작하게 한다.
 */
export type BriefingState =
  | { status: 'loading' }
  | { status: 'error'; message?: string }
  | { status: 'success'; briefing: Briefing }

interface BriefingCardProps {
  state: BriefingState
  source?: string
  onRetry?: () => void
  className?: string
}

function Skeleton({ width }: { width: string }) {
  return (
    <div
      className="h-3 animate-pulse rounded-full bg-track"
      style={{ width }}
    />
  )
}

export function BriefingCard({
  state,
  source = 'Gemini',
  onRetry,
  className,
}: BriefingCardProps) {
  return (
    <Panel className={cn('px-5 py-4', className)}>
      <div className="flex items-center gap-2">
        <SparklesIcon size={16} className="flex-none text-brand" />
        <span className="text-[13px] font-semibold text-muted">AI 브리핑</span>
        <span className="tnum ml-auto text-[13px] text-faint">{source}</span>
      </div>

      {state.status === 'loading' && (
        <div className="mt-3 flex flex-col gap-2" aria-busy="true">
          <Skeleton width="100%" />
          <Skeleton width="92%" />
          <Skeleton width="64%" />
        </div>
      )}

      {state.status === 'error' && (
        <div className="mt-3 flex items-start gap-2.5">
          <AlertIcon size={16} className="mt-0.5 flex-none text-faint" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] leading-relaxed text-muted">
              {state.message ?? '브리핑을 불러오지 못했습니다.'}
            </p>
            <p className="mt-0.5 text-[13px] text-faint">
              다른 지표는 정상적으로 표시됩니다.
            </p>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              aria-label="브리핑 다시 불러오기"
              className="flex-none rounded-md p-1 text-faint hover:bg-hair hover:text-muted"
            >
              <RefreshIcon size={16} />
            </button>
          )}
        </div>
      )}

      {state.status === 'success' && (
        <>
          <p className="mt-3 text-[15px] leading-relaxed text-ink">
            {state.briefing.summary}
          </p>
          {state.briefing.evidence.length > 0 && (
            <ul className="mt-3 space-y-1 border-t border-hair pt-3">
              {state.briefing.evidence.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-[13px] leading-relaxed text-muted"
                >
                  <span aria-hidden className="text-faint">
                    ·
                  </span>
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          )}
          {state.briefing.caveat && (
            <p className="mt-2.5 border-t border-hair pt-2.5 text-[13px] leading-relaxed text-faint">
              {state.briefing.caveat}
            </p>
          )}
        </>
      )}
    </Panel>
  )
}
