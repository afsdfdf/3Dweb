import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { GenerationTask, PrintOrder } from '@/payload-types'

import { DashboardShell } from '../_components/DashboardShell'
import {
  getCurrentUserCreditAccount,
  getCurrentUserModels,
  getCurrentUserOrders,
  getCurrentUserTasks,
  requireUser,
} from '../_lib/session'
import { formatDateTime, formatOrderStatus, formatTaskStatus } from '../_lib/ui-text'

type ActivityItem = {
  description: string
  href: string
  id: string
  kind: string
  time?: string | null
  title: string
}

function getOrderModelTitle(order: PrintOrder) {
  return typeof order.model === 'object' ? order.model?.title || '未命名模型' : '未命名模型'
}

function getStatusVariant(status?: string) {
  if (status === 'failed' || status === 'cancelled') return 'destructive' as const
  if (status === 'succeeded' || status === 'completed' || status === 'paid' || status === 'in-production' || status === 'shipped') {
    return 'secondary' as const
  }
  return 'outline' as const
}

export default async function DashboardOverviewPage() {
  const user = await requireUser()
  const [tasks, models, orders, creditAccount] = await Promise.all([
    getCurrentUserTasks(),
    getCurrentUserModels(),
    getCurrentUserOrders(),
    getCurrentUserCreditAccount(),
  ])

  const processing = tasks.docs.filter((task) => ['queued', 'processing'].includes(task.status)).length
  const completedTasks = tasks.docs.filter((task) => task.status === 'succeeded').length
  const readyModels = models.docs.filter((model) => model.status === 'ready').length
  const paidOrders = orders.docs.filter((order) => ['paid', 'in-production', 'shipped', 'completed'].includes(order.status)).length

  const activities: ActivityItem[] = [
    ...tasks.docs.slice(0, 3).map((task: GenerationTask) => ({
      id: `task-${task.id}`,
      title: `${task.taskCode} · ${formatTaskStatus(task.status)}`,
      description: task.prompt || '该任务未保存详细提示词。',
      time: task.updatedAt || task.createdAt,
      href: `/results/${task.taskCode}`,
      kind: '任务',
    })),
    ...orders.docs.slice(0, 2).map((order: PrintOrder) => ({
      id: `order-${order.id}`,
      title: `${order.orderNumber} · ${formatOrderStatus(order.status)}`,
      description: getOrderModelTitle(order),
      time: order.updatedAt || order.createdAt,
      href: `/dashboard/orders/${order.id}`,
      kind: '订单',
    })),
  ]
    .sort((a, b) => new Date(b.time || '').getTime() - new Date(a.time || '').getTime())
    .slice(0, 5)

  return (
    <DashboardShell
      currentPath="/dashboard"
      description="总览页是 Studio 之后的主控制面板：任务、模型、订单与积分都会集中显示在这里。"
      title="工作台总览"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '当前账号', value: user.fullName || user.email || '账户', note: '继续推进当前的 3D 工作流。' },
          { label: '进行中任务', value: String(processing), note: `已累计完成 ${completedTasks} 个任务。` },
          { label: '模型资产', value: String(models.docs.length), note: `其中 ${readyModels} 个可下载或进入打印。` },
          { label: '可用积分', value: String(creditAccount?.balance ?? 0), note: `已有 ${paidOrders} 个已支付或推进中的订单。` },
        ].map((item) => (
          <Card className="border-border/60 bg-card/80" key={item.label}>
            <CardHeader className="gap-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl tracking-tight">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{item.note}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader className="gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Badge variant="secondary">今日重点</Badge>
                <CardTitle className="mt-3 text-2xl tracking-tight">工作台摘要</CardTitle>
              </div>
              <Badge variant="outline">工作流在线</Badge>
            </div>
            <CardDescription>先处理正在运行的任务，再把可用模型推进到下载或打印交付流程。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">任务节奏</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">当前仍有 {processing} 个任务处于排队或处理中，建议先观察队列压力再继续提交新任务。</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">模型状态</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{readyModels} 个模型已经可用于下载、打印交接或资产复核。</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">订单推进</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{paidOrders} 个订单已经越过支付阶段，进入生产或交付流程。</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">积分状态</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">当前有 {creditAccount?.balance ?? 0} 积分可用，足够继续提交新任务或做后续处理。</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/generate">进入 Studio</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/library">打开模型库</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader>
            <Badge variant="outline">最近动态</Badge>
            <CardTitle className="mt-3 text-2xl tracking-tight">最新任务与订单更新</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {activities.length > 0 ? (
              activities.map((item) => (
                <div className="rounded-2xl border border-border/60 p-4" key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="block text-sm font-medium">{item.title}</strong>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                    <Badge variant="outline">{item.kind}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{formatDateTime(item.time)}</span>
                    <Button asChild size="sm" variant="ghost">
                      <Link href={item.href}>查看</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 p-4">
                <strong className="block text-sm font-medium">还没有最近动态</strong>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">先创建一个生成任务，这里就会开始显示最新任务与订单变化。</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <Badge variant="outline">任务面板</Badge>
              <CardTitle className="mt-3 text-2xl tracking-tight">生成队列</CardTitle>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/tasks">查看全部</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {tasks.docs.length > 0 ? (
              tasks.docs.slice(0, 4).map((task) => (
                <div className="flex flex-col gap-3 rounded-2xl border border-border/60 p-4 sm:flex-row sm:items-start sm:justify-between" key={task.id}>
                  <div>
                    <strong className="block text-sm font-medium">{task.taskCode}</strong>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{task.prompt || '该任务未保存详细提示词。'}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <Badge variant={getStatusVariant(task.status)}>{formatTaskStatus(task.status)}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {task.progress ?? 0}% · {formatDateTime(task.updatedAt || task.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 p-4">
                <strong className="block text-sm font-medium">还没有生成任务</strong>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">进入 Studio 提交第一个任务后，这里就会显示队列状态。</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <Badge variant="outline">订单面板</Badge>
              <CardTitle className="mt-3 text-2xl tracking-tight">实体交付链路</CardTitle>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/orders">查看全部</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3">
            {orders.docs.length > 0 ? (
              orders.docs.slice(0, 4).map((order: PrintOrder) => (
                <div className="flex flex-col gap-3 rounded-2xl border border-border/60 p-4 sm:flex-row sm:items-start sm:justify-between" key={order.id}>
                  <div>
                    <strong className="block text-sm font-medium">{order.orderNumber}</strong>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{getOrderModelTitle(order)}</p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <Badge variant={getStatusVariant(order.status)}>{formatOrderStatus(order.status)}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {order.amount ?? 0} {order.currency ?? 'USD'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 p-4">
                <strong className="block text-sm font-medium">还没有打印订单</strong>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">当结果或模型进入实体打印流程后，订单就会出现在这里。</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </DashboardShell>
  )
}
