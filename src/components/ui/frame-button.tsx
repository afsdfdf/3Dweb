import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

import styles from './frame-button.module.css'

type FrameButtonVariant = 'gold' | 'slate'
type FrameButtonSize = 'compact' | 'regular'

export type FrameButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean
  children: ReactNode
  fullWidth?: boolean
  height?: number
  selected?: boolean
  size?: FrameButtonSize
  variant?: FrameButtonVariant
  width?: number | string
}

export function FrameButton({
  asChild = false,
  children,
  className,
  fullWidth = false,
  height,
  selected = false,
  size = 'regular',
  style,
  variant = 'slate',
  width,
  ...props
}: FrameButtonProps) {
  const mergedStyle = {
    ...(height ? { '--frame-button-height': `${height}px` } : {}),
    ...(typeof width === 'number' ? { '--frame-button-width': `${width}px` } : width ? { '--frame-button-width': width } : {}),
    ...style,
  } as CSSProperties

  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      className={cn(styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, className)}
      data-selected={selected ? 'true' : 'false'}
      style={mergedStyle}
      {...props}
    >
      <span className={styles.label}>{children}</span>
    </Comp>
  )
}
