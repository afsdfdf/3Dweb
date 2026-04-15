import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import { DashboardShell } from '../../_components/DashboardShell'
import { getCurrentUserTasks, requireUser } from '../../_lib/session'
import { formatDateTime, formatInputMode, formatTaskStatus } from '../../_lib/ui-text'

const statusVariant = (status?: string) => {
  if (status === 'failed') return 'destructive' as const
  if (status === 'succeeded') return 'secondary' as const
  return 'outline' as const
}

export default async function DashboardTasksPage() {
  await requireUser()
  const tasks = await getCurrentUserTasks()

  const queuedCount = tasks.docs.filter((task) => task.status === 'queued').length
  const processingCount = tasks.docs.filter((task) => task.status === 'processing').length
  const succeededCount = tasks.docs.filter((task) => task.status === 'succeeded').length

  return (
    <DashboardShell currentPath="/dashboard/tasks" description="集中查看 AI 生成状态、进度、输入方式与结果入口。" title="任务记录">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '全部任务', value: tasks.docs.length },
          { label: '排队中', value: queuedCount },
          { label: '处理中', value: processingCount },
          { label: '已完成', value: succeededCount },
        ].map((item) => (
          <Card className="border-border/60 bg-card/80" key={item.label} size="sm">
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl tracking-tight">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4">
        {tasks.docs.length > 0 ? (
          tasks.docs.map((task) => {
            const progress = Number(task.progress ?? 0)
            const parameterFormat =
              typeof task.parameterSnapshot === 'object' && task.parameterSnapshot && 'format' in task.parameterSnapshot
                ? String(task.parameterSnapshot.format).toUpperCase()
                : '未指定'

            return (
              <Card className="border-border/60 bg-card/80 shadow-sm" key={task.id}>
                <CardHeader className="gap-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">任务编号</p>
                      <CardTitle className="mt-2 text-2xl tracking-tight">{task.taskCode}</CardTitle>
                    </div>
                    <Badge variant={statusVariant(task.status)}>{formatTaskStatus(task.status)}</Badge>
                  </div>
                  <CardDescription className="text-sm leading-6">{task.prompt || '未填写提示词'}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-5">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">输入方式</p>
                      <p className="mt-2 text-sm font-medium">{formatInputMode(task.inputMode)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">模型提供方</p>
                      <p className="mt-2 text-sm font-medium">{task.provider || 'custom'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">预留积分</p>
                      <p className="mt-2 text-sm font-medium">{task.creditsReserved ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">创建时间</p>
                      <p className="mt-2 text-sm font-medium">{formatDateTime(task.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">更新时间</p>
                      <p className="mt-2 text-sm font-medium">{formatDateTime(task.updatedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">输出格式</p>
                      <p className="mt-2 text-sm font-medium">{parameterFormat}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">当前进度</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(8, progress)}%` }} />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="justify-between gap-3">
                  <span className="text-sm text-muted-foreground">结果页会同步显示预览、下载与后续下单入口。</span>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/results/${task.taskCode}`}>查看结果</Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })
        ) : (
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>还没有生成任务</CardTitle>
              <CardDescription>先创建第一个任务，结果会自动回流到这里统一查看。</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/generate">开始生成</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </section>
    </DashboardShell>
  )
}
