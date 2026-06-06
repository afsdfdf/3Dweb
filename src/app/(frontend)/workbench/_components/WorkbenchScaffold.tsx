import styles from './WorkbenchScaffold.module.css'
import { WorkbenchLeftPanel } from './WorkbenchLeftPanel'
import { WorkbenchModelViewer } from './WorkbenchModelViewer'
import { WorkbenchRightPanel } from './WorkbenchRightPanel'

export function WorkbenchScaffold() {
  return (
    <section className={styles.viewport}>
      <div className={styles.section}>
        <div className={styles.shell}>
          <div className={styles.layout}>
            <aside className={styles.panel}>
              <WorkbenchLeftPanel />
            </aside>

            <main className={styles.center}>
              <div className={styles.stage}>
                <div className={styles.stageOverlay}>
                  <div className={styles.centerTop}>
                    <div className={styles.centerHeader}>
                      <div className={styles.breadcrumb}>HOME &gt; MODEL DETAILS &gt; WORKBENCH</div>
                      <div className={styles.divider} />
                      <div className={styles.modelLabel}>MODEL NAME</div>
                      <h1 className={styles.modelName}>Monk</h1>
                      <span className={styles.modelBadge}>Public</span>
                    </div>

                    <div className={styles.stats}>
                      <div className={styles.statRow}>
                        <span>TOPOLOGY</span>
                        <strong>None</strong>
                      </div>
                      <div className={styles.statRow}>
                        <span>FACE COUNT</span>
                        <strong>None</strong>
                      </div>
                      <div className={styles.statRow}>
                        <span>VERTEX COUNT</span>
                        <strong>None</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.viewerWrap}>
                  <WorkbenchModelViewer
                    className={styles.viewerCanvas}
                    showPlaceholderModel={false}
                    transparentBackground
                  />
                </div>
              </div>
            </main>

            <aside className={styles.panel}>
              <WorkbenchRightPanel />
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}
