'use client'

import { Panel } from '@/components/layout/Panel'
import { FocusIcon, MinusIcon, PlusIcon } from '@/components/ui/icons'

interface ZoomControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

const BUTTON =
  'flex size-11 items-center justify-center text-[#4E6157] transition-colors duration-200 hover:bg-hair'

export function ZoomControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  return (
    <Panel accent={null} className="flex self-end overflow-hidden">
      <button
        type="button"
        onClick={onZoomIn}
        aria-label="확대"
        className={`${BUTTON} border-r border-hair`}
      >
        <PlusIcon size={18} />
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        aria-label="축소"
        className={`${BUTTON} border-r border-hair`}
      >
        <MinusIcon size={18} />
      </button>
      <button
        type="button"
        onClick={onReset}
        aria-label="전체 보기로 되돌리기"
        className={BUTTON}
      >
        <FocusIcon size={18} />
      </button>
    </Panel>
  )
}
