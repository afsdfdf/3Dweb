'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'

import { useLocale } from './LocaleProvider'

type ResultStatusProps = {
  taskId: number
  taskStatus: string
}

export function ResultStatus({ taskId, taskStatus }: ResultStatusProps) {
  const locale = useLocale()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (taskStatus === 'succeeded' || taskStatus === 'failed' || taskStatus === 'timeout') {
      return
    }

    const timer = setInterval(async () => {
      setBusy(true)
      await fetch(`/api/studio/ai/tasks/${taskId}/sync`, {
        credentials: 'include',
        method: 'POST',
      })
      setBusy(false)
      router.refresh()
    }, 2500)

    return () => clearInterval(timer)
  }, [router, taskId, taskStatus])

  if (taskStatus === 'succeeded') {
    return <Badge variant="secondary">{locale === 'zh' ? '已完成' : 'Completed'}</Badge>
  }

  if (taskStatus === 'failed') {
    return <Badge variant="destructive">{locale === 'zh' ? '失败' : 'Failed'}</Badge>
  }

  return <Badge variant="outline">{busy ? (locale === 'zh' ? '正在同步进度...' : 'Syncing progress...') : locale === 'zh' ? '排队 / 处理中' : 'Queued / processing'}</Badge>
}
