'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'

import { useLocale } from './LocaleProvider'

type ResultStatusProps = {
  taskId: number | string
  taskStatus: string
}

const syncIntervalMs = Math.max(1000, Number(process.env.NEXT_PUBLIC_TASK_SYNC_INTERVAL_MS || 2500))

export function ResultStatus({ taskId, taskStatus }: ResultStatusProps) {
  const locale = useLocale()
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const inFlightRef = useRef(false)

  useEffect(() => {
    if (taskStatus === 'succeeded' || taskStatus === 'failed' || taskStatus === 'timeout') {
      return
    }

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const syncOnce = async () => {
      if (cancelled || inFlightRef.current) {
        return
      }

      inFlightRef.current = true
      setBusy(true)

      try {
        await fetch(`/api/studio/ai/tasks/${taskId}/sync`, {
          credentials: 'include',
          method: 'POST',
        })

        if (!cancelled) {
          router.refresh()
        }
      } finally {
        inFlightRef.current = false

        if (!cancelled) {
          setBusy(false)
          timer = setTimeout(() => {
            void syncOnce()
          }, syncIntervalMs)
        }
      }
    }

    void syncOnce()

    return () => {
      cancelled = true
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [router, taskId, taskStatus])

  if (taskStatus === 'succeeded') {
    return <Badge variant="secondary">{locale === 'zh' ? '已完成' : 'Completed'}</Badge>
  }

  if (taskStatus === 'failed') {
    return <Badge variant="destructive">{locale === 'zh' ? '失败' : 'Failed'}</Badge>
  }

  return <Badge variant="outline">{busy ? (locale === 'zh' ? '正在同步进度...' : 'Syncing progress...') : locale === 'zh' ? '排队 / 处理中' : 'Queued / processing'}</Badge>
}
