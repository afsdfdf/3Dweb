import type { ReactNode } from 'react'

import { FixedSliceFrame } from '@/components/ui/fixed-slice-frame'

type AuthFrameProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function AuthFrame({ children, className, contentClassName }: AuthFrameProps) {
  return (
    <FixedSliceFrame
      className={className}
      contentClassName={contentClassName}
      edgeOverlap={1}
      fill="#040405"
      frameSize={96}
      slices={{
        bottom: '/ui/frames/workbench-panel-9slice/images/model-card-frame_08.png',
        bottomLeft: '/ui/frames/workbench-panel-9slice/images/model-card-frame_07.png',
        bottomRight: '/ui/frames/workbench-panel-9slice/images/model-card-frame_09.png',
        left: '/ui/frames/workbench-panel-9slice/images/model-card-frame_04.png',
        right: '/ui/frames/workbench-panel-9slice/images/model-card-frame_06.png',
        top: '/ui/frames/workbench-panel-9slice/images/model-card-frame_02.png',
        topLeft: '/ui/frames/workbench-panel-9slice/images/model-card-frame_01.png',
        topRight: '/ui/frames/workbench-panel-9slice/images/model-card-frame_03.png',
      }}
    >
      {children}
    </FixedSliceFrame>
  )
}
