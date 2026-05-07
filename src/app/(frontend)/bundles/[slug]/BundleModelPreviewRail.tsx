'use client'

import { useMemo, useState } from 'react'

import { InspirationGrid, type InspirationGridItem } from '@/components/ui-lab/home-test/inspiration-grid'

import styles from './page.module.css'

type BundleModelPreviewRailProps = {
  items: InspirationGridItem[]
}

const visibleCount = 5

export function BundleModelPreviewRail({ items }: BundleModelPreviewRailProps) {
  const [startIndex, setStartIndex] = useState(0)
  const maxStartIndex = Math.max(0, items.length - visibleCount)
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, startIndex + visibleCount)
  }, [items, startIndex])

  return (
    <div className={styles.modelCarousel}>
      <button
        aria-label="Previous models"
        className={[styles.modelArrowButton, styles.modelArrowLeft].join(' ')}
        disabled={startIndex === 0}
        onClick={() => setStartIndex((current) => Math.max(0, current - 1))}
        type="button"
      />
      <div className={styles.modelGridWindow}>
        <InspirationGrid filterMountClassName={styles.modelFilterMount} items={visibleItems} />
      </div>
      <button
        aria-label="Next models"
        className={[styles.modelArrowButton, styles.modelArrowRight].join(' ')}
        disabled={startIndex >= maxStartIndex}
        onClick={() => setStartIndex((current) => Math.min(maxStartIndex, current + 1))}
        type="button"
      />
    </div>
  )
}
