import type { CSSProperties, ReactNode } from 'react'

import { cn } from '@/lib/utils'

import styles from './fixed-slice-frame.module.css'

type SlicePaths = {
  bottom: string
  bottomLeft: string
  bottomRight: string
  left: string
  right: string
  top: string
  topLeft: string
  topRight: string
}

type CenterFill =
  | {
      image: string
      mode?: 'repeat' | 'stretch'
    }
  | undefined

export type FixedSliceFrameProps = {
  children: ReactNode
  className?: string
  contentClassName?: string
  contentPadding?: number
  edgeOverlap?: number
  fill?: string
  frameSize: number
  slices: SlicePaths
  centerFill?: CenterFill
}

export function FixedSliceFrame({
  children,
  className,
  contentClassName,
  contentPadding = 0,
  edgeOverlap = 0,
  fill,
  frameSize,
  slices,
  centerFill,
}: FixedSliceFrameProps) {
  const containerStyle = {
    '--fixed-slice-content-padding': `${contentPadding}px`,
    '--fixed-slice-edge-overlap': `${edgeOverlap}px`,
    '--fixed-slice-size': `${frameSize}px`,
    ...(fill ? { background: fill } : {}),
  } as CSSProperties

  const centerStyle = centerFill
    ? ({
        backgroundImage: `url('${centerFill.image}')`,
        backgroundRepeat: centerFill.mode === 'repeat' ? 'repeat' : 'no-repeat',
        backgroundSize: centerFill.mode === 'repeat' ? `${frameSize}px ${frameSize}px` : '100% 100%',
      } as CSSProperties)
    : undefined

  return (
    <div className={cn(styles.frame, className)} style={containerStyle}>
      {centerFill ? <div aria-hidden="true" className={styles.centerFill} style={centerStyle} /> : null}

      <div aria-hidden="true" className={styles.frameLayer}>
        <span className={cn(styles.slice, styles.cornerTopLeft)} style={{ backgroundImage: `url('${slices.topLeft}')` }} />
        <span className={cn(styles.slice, styles.cornerTopRight)} style={{ backgroundImage: `url('${slices.topRight}')` }} />
        <span className={cn(styles.slice, styles.cornerBottomLeft)} style={{ backgroundImage: `url('${slices.bottomLeft}')` }} />
        <span className={cn(styles.slice, styles.cornerBottomRight)} style={{ backgroundImage: `url('${slices.bottomRight}')` }} />
        <span className={cn(styles.slice, styles.edgeTop)} style={{ backgroundImage: `url('${slices.top}')` }} />
        <span className={cn(styles.slice, styles.edgeBottom)} style={{ backgroundImage: `url('${slices.bottom}')` }} />
        <span className={cn(styles.slice, styles.edgeLeft)} style={{ backgroundImage: `url('${slices.left}')` }} />
        <span className={cn(styles.slice, styles.edgeRight)} style={{ backgroundImage: `url('${slices.right}')` }} />
      </div>

      <div className={cn(styles.content, contentClassName)}>{children}</div>
    </div>
  )
}
