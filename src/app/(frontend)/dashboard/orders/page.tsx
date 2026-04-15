import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import { OrderActionButton } from '../../_components/OrderActionButton'
import { DashboardShell } from '../../_components/DashboardShell'
import { getCurrentUserOrders, requireUser } from '../../_lib/session'
import { formatDateTime, formatOrderStatus } from '../../_lib/ui-text'

function getOrderModelTitle(order: Awaited<ReturnType<typeof getCurrentUserOrders>>['docs'][number]) {
  return typeof order.model === 'object' ? order.model?.title || '未命名模型' : '未命名模型'
}

function getStatusVariant(status?: string) {
  if (status === 'cancelled') return 'destructive' as const
  if (['paid', 'in-production', 'shipped', 'completed'].includes(String(status))) return 'secondary' as const
  return 'outline' as const
}

export default async function DashboardOrdersPage() {
  await requireUser()
  const orders = await getCurrentUserOrders()

  const pendingPayment = orders.docs.filter((order) => order.status === 'pending-payment').length
  const inProduction = orders.docs.filter((order) => order.status === 'in-production').length
  const shipped = orders.docs.filter((order) => order.status === 'shipped').length
  const completed = orders.docs.filter((order) => order.status === 'completed').length

  return (
    <DashboardShell
      currentPath="/dashboard/orders"
      description="统一追踪支付状态、生产进度、物流节点与每张实体订单的后续动作。"
      title="订单中心"
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '订单总数', value: orders.docs.length },
          { label: '待支付', value: pendingPayment },
          { label: '生产中', value: inProduction },
          { label: '已发货 / 已完成', value: shipped + completed },
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
        {orders.docs.length > 0 ? (
          orders.docs.map((order) => {
            const progressMap: Record<string, number> = {
              'pending-payment': 18,
              paid: 36,
              'in-production': 64,
              shipped: 84,
              completed: 100,
              cancelled: 100,
            }

            return (
              <Card className="border-border/60 bg-card/80 shadow-sm" key={order.id}>
                <CardHeader className="gap-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">订单号</p>
                      <CardTitle className="mt-2 text-2xl tracking-tight">{order.orderNumber}</CardTitle>
                    </div>
                    <Badge variant={getStatusVariant(order.status)}>{formatOrderStatus(order.status)}</Badge>
                  </div>
                  <CardDescription className="text-sm leading-6">
                    {getOrderModelTitle(order)} · {order.sizeOption || 'standard'} / {order.materialOption || 'plastic'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col gap-5">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">金额</p>
                      <p className="mt-2 text-sm font-medium">
                        {order.amount ?? 0} {order.currency ?? 'USD'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">消耗积分</p>
                      <p className="mt-2 text-sm font-medium">{order.creditsUsed ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">物流单号</p>
                      <p className="mt-2 text-sm font-medium">{order.trackingNumber || '暂未生成'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">更新时间</p>
                      <p className="mt-2 text-sm font-medium">{formatDateTime(order.updatedAt)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">当前进度</span>
                      <span className="font-medium">{progressMap[String(order.status)] ?? 10}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressMap[String(order.status)] ?? 10}%` }} />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
                  <span className="text-sm text-muted-foreground">创建于 {formatDateTime(order.createdAt)}</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/dashboard/orders/${order.id}`}>查看详情</Link>
                    </Button>
                    <OrderActionButton orderId={Number(order.id)} status={String(order.status)} />
                  </div>
                </CardFooter>
              </Card>
            )
          })
        ) : (
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle>还没有打印订单</CardTitle>
              <CardDescription>当结果或模型进入实体打印流程后，订单会自动出现在这里。</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild>
                <Link href="/dashboard/library">前往模型库</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </section>
    </DashboardShell>
  )
}
