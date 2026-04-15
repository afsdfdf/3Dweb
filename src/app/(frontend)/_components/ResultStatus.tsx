'use client'

import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type ResultStatusProps = {
  taskId: number
  taskStatus: string
}

export function ResultStatus({ taskId, taskStatus }: ResultStatusProps) {
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
    return <Badge variant="secondary">已完成</Badge>
  }

  if (taskStatus === 'failed') {
    return <Badge variant="destructive">失败</Badge>
  }

  return <Badge variant="outline">{busy ? '正在同步进度...' : '排队 / 处理中'}</Badge>
}
