'use client'

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
    return <span className="status-pill success">已完成</span>
  }

  if (taskStatus === 'failed') {
    return <span className="status-pill danger">失败</span>
  }

  return <span className="status-pill">{busy ? '模拟生成中...' : '排队 / 处理中'}</span>
}
