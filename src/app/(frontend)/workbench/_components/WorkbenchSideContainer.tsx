import { LineFrame } from '@/components/ui/line-frame'

import styles from './WorkbenchScaffold.module.css'

type WorkbenchSideContainerProps = {
  children?: React.ReactNode
}

export function WorkbenchSideContainer({ children }: WorkbenchSideContainerProps) {
  return (
    <LineFrame className={styles.panelPlaceholder} contentClassName="h-full">
      <div className={styles.panelSurface}>{children}</div>
    </LineFrame>
  )
}
