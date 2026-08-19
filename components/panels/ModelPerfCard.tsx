import { Panel } from '@/components/layout/Panel'
import { cn } from '@/lib/cn'
import type { ModelKey } from '@/lib/types'

const MODEL_NOTE: Record<ModelKey, string> = {
  a: '달력·부하 패턴',
  b: '+ 서울 대표 기상',
  c: '+ 미기후·도시공간',
}

interface ModelPerfCardProps {
  mape: Record<ModelKey, number>
}

export function ModelPerfCard({ mape }: ModelPerfCardProps) {
  const worst = Math.max(mape.a, mape.b, mape.c)
  // B(기상만) 대비 C(미기후)가 얼마나 줄었는지 — 이 프로젝트의 주장 그 자체다.
  const improvement = Math.round(((mape.b - mape.c) / mape.b) * 100)

  return (
    <Panel className="px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-muted">
          모델 성능 · MAPE
        </span>
        <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-[13px] font-semibold text-brand-dark">
          ▼{improvement}%
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        {(['a', 'b', 'c'] as const).map((key) => {
          const best = key === 'c'
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-3 text-[13px] font-semibold text-faint uppercase">
                {key}
              </span>
              <span className="w-[104px] flex-none truncate text-[13px] text-faint">
                {MODEL_NOTE[key]}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-track">
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-200',
                    best ? 'bg-brand' : 'bg-neutral-line',
                  )}
                  style={{ width: `${(mape[key] / worst) * 100}%` }}
                />
              </div>
              <span
                className={cn(
                  'tnum w-10 text-right text-[15px]',
                  best ? 'font-semibold text-brand-dark' : 'text-ink',
                )}
              >
                {mape[key].toFixed(1)}
              </span>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
