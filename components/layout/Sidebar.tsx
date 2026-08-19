'use client'

import type { ComponentType } from 'react'
import { Panel } from './Panel'
import { cn } from '@/lib/cn'
import { NAV_SECTIONS, type ViewKey } from '@/lib/nav'
import {
  ChartLineIcon,
  ChevronLeftIcon,
  CirclesIcon,
  DatabaseIcon,
  LeafIcon,
  MapIcon,
  SettingsIcon,
} from '@/components/ui/icons'

type IconComponent = ComponentType<{ size?: number; className?: string }>

const ICONS: Record<ViewKey, IconComponent> = {
  comparison: CirclesIcon,
  map: MapIcon,
  chart: ChartLineIcon,
  data: DatabaseIcon,
  settings: SettingsIcon,
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  activeView: ViewKey
  onViewChange: (view: ViewKey) => void
}

/**
 * 사이드바. 펼침 260px / 접힘 72px.
 *
 * 1600px 미만에서는 사용자 선택과 무관하게 접힌다. 이 자동 접힘은 JS가 아니라
 * `wide:` 브레이크포인트로 처리한다 — 화면 폭을 JS로 읽으면 서버 렌더 결과와
 * 어긋나 hydration 불일치가 난다.
 */
export function Sidebar({
  collapsed,
  onToggle,
  activeView,
  onViewChange,
}: SidebarProps) {
  // 접힘 상태에서는 라벨을 항상 숨기고, 펼침 상태여도 1600px 미만이면 숨긴다.
  const label = collapsed ? 'hidden' : 'hidden wide:block'
  const width = collapsed ? 'w-[72px]' : 'w-[72px] wide:w-[260px]'

  return (
    <Panel
      className={cn(
        'flex flex-none flex-col px-3 pb-3 pt-4 transition-[width] duration-200',
        width,
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-hair px-2 pb-3">
        <div className="flex size-9 flex-none items-center justify-center rounded-xl bg-brand text-white">
          <LeafIcon size={20} />
        </div>
        <div className={cn('min-w-0', label)}>
          <div className="truncate text-[15px] font-semibold text-ink">
            UrbanWatt
          </div>
          <div className="truncate text-[13px] text-faint">전력피크 예측</div>
        </div>
      </div>

      <nav className="mt-3 flex-1">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <div
              className={cn(
                'mb-1.5 px-2 text-[13px] tracking-[0.04em] text-faint',
                label,
              )}
            >
              {section.title}
            </div>
            {section.items.map((item) => {
              const Icon = ICONS[item.key]
              const active = activeView === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  title={item.label}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => onViewChange(item.key)}
                  className={cn(
                    'mb-0.5 flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[15px] transition-colors duration-200',
                    collapsed && 'justify-center px-0',
                    active
                      ? 'bg-brand-light font-semibold text-brand-dark'
                      : 'text-muted hover:bg-hair',
                  )}
                >
                  <Icon
                    size={20}
                    className={cn(
                      'flex-none',
                      active ? 'text-brand' : 'text-faint',
                    )}
                  />
                  <span className={cn('truncate', label)}>{item.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-hair px-2 pt-3">
        <div className="flex size-8 flex-none items-center justify-center rounded-full bg-brand-light text-[13px] font-semibold text-cool-deep">
          빈
        </div>
        <span className={cn('flex-1 truncate text-[15px] text-muted', label)}>
          정빈
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          className={cn(
            'flex-none rounded-md p-1 text-faint transition-transform duration-200 hover:bg-hair hover:text-muted',
            collapsed && 'rotate-180',
          )}
        >
          <ChevronLeftIcon size={18} />
        </button>
      </div>
    </Panel>
  )
}
