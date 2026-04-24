import type { ReactNode } from 'react'

import { FixedSliceFrame } from './fixed-slice-frame'

export type LineFrameProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  contentPadding?: number
  frameSize?: number
}

export function LineFrame({
  children,
  className,
  contentClassName,
  contentPadding = 20,
  frameSize = 96,
}: LineFrameProps) {
  return (
    <FixedSliceFrame
      className={className}
      contentClassName={contentClassName}
      contentPadding={contentPadding}
      edgeOverlap={1}
      fill="#0d0d0d"
      frameSize={frameSize}
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
