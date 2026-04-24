import { AuthFrame } from './AuthFrame'
import styles from './auth-runtime.module.css'

type AuthCardShellProps = {
  actionButton: React.ReactNode
  children: React.ReactNode
  footerLink?: React.ReactNode
  modeSwitcher?: React.ReactNode
}

function AuthCornerMotif({
  variant,
}: {
  variant: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
}) {
  const shapes = {
    'top-left': (
      <>
        <rect fill="#262626" height="1" width="14" x="10" y="10" />
        <rect fill="#262626" height="14" width="1" x="10" y="10" />
        <rect fill="#262626" height="14" width="1" x="23" y="10" />
        <rect fill="#262626" height="1" width="14" x="10" y="23" />
        <rect fill="#262626" height="1" width="25" x="23" y="23" />
        <rect fill="#262626" height="25" width="1" x="23" y="23" />
      </>
    ),
    'top-right': (
      <>
        <rect fill="#262626" height="1" width="14" x="24" y="10" />
        <rect fill="#262626" height="14" width="1" x="24" y="10" />
        <rect fill="#262626" height="14" width="1" x="37" y="10" />
        <rect fill="#262626" height="1" width="14" x="24" y="23" />
        <rect fill="#262626" height="1" width="25" x="0" y="23" />
        <rect fill="#262626" height="25" width="1" x="24" y="23" />
      </>
    ),
    'bottom-left': (
      <>
        <rect fill="#262626" height="1" width="14" x="10" y="24" />
        <rect fill="#262626" height="14" width="1" x="10" y="24" />
        <rect fill="#262626" height="14" width="1" x="23" y="24" />
        <rect fill="#262626" height="1" width="14" x="10" y="37" />
        <rect fill="#262626" height="1" width="25" x="23" y="24" />
        <rect fill="#262626" height="25" width="1" x="23" y="0" />
      </>
    ),
    'bottom-right': (
      <>
        <rect fill="#262626" height="1" width="14" x="24" y="24" />
        <rect fill="#262626" height="14" width="1" x="24" y="24" />
        <rect fill="#262626" height="14" width="1" x="37" y="24" />
        <rect fill="#262626" height="1" width="14" x="24" y="37" />
        <rect fill="#262626" height="1" width="25" x="0" y="24" />
        <rect fill="#262626" height="25" width="1" x="24" y="0" />
      </>
    ),
  }[variant]

  return (
    <svg aria-hidden="true" className={styles.decorMotifSvg} viewBox="0 0 48 48">
      <g shapeRendering="crispEdges">{shapes}</g>
    </svg>
  )
}

export function AuthCardShell({ actionButton, children, footerLink, modeSwitcher }: AuthCardShellProps) {
  return (
    <AuthFrame className={styles.root} contentClassName="h-full">
      <div className={styles.surface}>
        <div aria-hidden="true" className={styles.surfaceFrame}>
          <div className={styles.surfaceDecor}>
            <span className={styles.decorTop} />
            <span className={styles.decorRight} />
            <span className={styles.decorBottom} />
            <span className={styles.decorLeft} />
            <span className={styles.decorTopLeft}>
              <AuthCornerMotif variant="top-left" />
            </span>
            <span className={styles.decorTopRight}>
              <AuthCornerMotif variant="top-right" />
            </span>
            <span className={styles.decorBottomRight}>
              <AuthCornerMotif variant="bottom-right" />
            </span>
            <span className={styles.decorBottomLeft}>
              <AuthCornerMotif variant="bottom-left" />
            </span>
          </div>
        </div>

        <div className={styles.surfaceContent}>
          <div className={styles.header}>
            <div className={styles.brand}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="Thorns Tavern" className={styles.brandLogo} src="/ui/frames/logohorizontal.png" />
            </div>
            <button aria-label="Close" className={styles.closeButton} type="button">
              ×
            </button>
          </div>

          {modeSwitcher || null}

          <div className={styles.body}>{children}</div>

          <div className={styles.footer}>
            <div aria-hidden="true" className={styles.footerDivider} />
            {actionButton}
            {footerLink || null}
          </div>
        </div>
      </div>
    </AuthFrame>
  )
}
