import { ChevronLeft, ChevronRight, Search } from 'lucide-react'

import { WorkbenchSideContainer } from './WorkbenchSideContainer'
import styles from './WorkbenchScaffold.module.css'

export function WorkbenchRightPanel() {
  return (
    <WorkbenchSideContainer>
      <div className={styles.rightPanel}>
        <div className={styles.rightHeader}>
          <h3 className={styles.rightTitle}>Model Library</h3>
          <div className={styles.searchGroup}>
            <div className={styles.searchInputWrap}>
              <Search className={styles.searchIcon} size={14} />
              <input className={styles.searchInput} placeholder="Search Keywords" type="text" />
            </div>
            <button className={styles.searchButton} type="button">
              Search
            </button>
          </div>
        </div>

        <div className={styles.rightDivider} />

        <div className={styles.rightPagination}>
          <button className={styles.pageButton} type="button">
            <ChevronLeft size={14} />
          </button>
          <button className={`${styles.pageButton} ${styles.pageButtonActive}`} type="button">
            1
          </button>
          <button className={styles.pageButton} type="button">
            <ChevronRight size={14} />
          </button>
        </div>

        <div className={styles.rightEmptyState}>
          <div className={styles.emptyGlyph}>
            <div className={styles.emptyCube} />
            <div className={styles.emptySlash} />
          </div>
          <p className={styles.emptyLabel}>No Models Available</p>
        </div>
      </div>
    </WorkbenchSideContainer>
  )
}
