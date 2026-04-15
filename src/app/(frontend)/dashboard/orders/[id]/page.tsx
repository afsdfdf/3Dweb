import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import { OrderActionButton } from '../../../_components/OrderActionButton'
import { OrderPaymentStatusSync } from '../../../_components/OrderPaymentStatusSync'
import { DashboardShell } from '../../../_components/DashboardShell'
import { getCurrentUserOrderById, requireUser } from '../../../_lib/session'
import { formatDateTime, formatOrderStatus } from '../../../_lib/ui-text'

const steps = [
  { key: 'pending-payment', label: '待支付', description: '订单已创建，正在等待 Stripe Checkout 完成支付。' },
  { key: 'paid', label: '已支付', description: '支付已确认，订单可以进入生产排期。' },
  { key: 'in-production', label: '生产中', description: '打印任务正在准备与执行。' },
  { key: 'shipped', label: '已发货', description: '订单已离开生产环节，进入物流配送。' },
  { key: 'completed', label: '已完成', description: '交付流程已经结束，订单已关闭。' },
] as const

function getStatusVariant(status?: string) {
  if (status === 'cancelled') return 'destructive' as const
  if (['paid', 'in-production', 'shipped', 'completed'].includes(String(status))) return 'secondary' as const
  return 'outline' as const
}

export default async function DashboardOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ checkout?: string; session_id?: string }>
}) {
  await requireUser()
  const { id } = await params
  const query = await searchParams
  const order = await getCurrentUserOrderById(id)

  if (!order) {
    return (
      <DashboardShell
        currentPath="/dashboard/orders"
        description="当前订单不存在，或你没有访问这张订单的权限。"
        title="订单详情"
      >
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>订单不存在</CardTitle>
            <CardDescription>请返回订单列表确认 ID，或刷新后重试。</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/dashboard/orders">返回订单列表</Link>
            </Button>
          </CardFooter>
        </Card>
      </DashboardShell>
    )
  }

  const currentIndex = steps.findIndex((step) => step.key === order.status)
  const modelTitle = typeof order.model === 'object' ? order.model?.title || '未命名模型' : String(order.model)
  const sourceTaskCode = typeof order.sourceTask === 'object' ? order.sourceTask?.taskCode || '—' : '—'
  const shouldAutoSync = query.checkout === 'success' && order.status === 'pending-payment'
  const showCancelledNotice = query.checkout === 'cancelled'

  return (
    <DashboardShell
      currentPath="/dashboard/orders"
      description="查看支付状态、生产推进、物流信息与当前订单的下一步处理动作。"
      title={order.orderNumber || '订单详情'}
    >
      <Card className="border-border/60 bg-card/80 shadow-sm">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge variant="outline">订单流程</Badge>
              <CardTitle className="mt-3 text-2xl tracking-tight">履约进度</CardTitle>
            </div>
            <Badge variant={getStatusVariant(String(order.status))}>{formatOrderStatus(order.status)}</Badge>
          </div>
          <CardDescription>在单一详情页中查看支付、生产与发货状态。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {shouldAutoSync ? <OrderPaymentStatusSync enabled orderId={Number(order.id)} /> : null}
          {showCancelledNotice ? (
            <p className="text-sm text-muted-foreground">支付已取消，你可以稍后回来继续完成结算。</p>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-5">
            {steps.map((step, index) => {
              const active = currentIndex >= 0 && index <= currentIndex
              const current = index === currentIndex

              return (
                <div className="rounded-2xl border border-border/60 p-4" key={step.key}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 items-center justify-center rounded-full border text-sm font-medium ${
                        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <strong className="block text-sm font-medium">{step.label}</strong>
                      {current ? <span className="text-xs text-muted-foreground">当前阶段</span> : null}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader className="gap-3">
            <Badge variant="secondary">订单详情</Badge>
            <CardTitle className="text-2xl tracking-tight">支付与生产信息</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">订单号</p>
              <p className="mt-2 text-sm font-medium">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">状态</p>
              <p className="mt-2 text-sm font-medium">{formatOrderStatus(order.status)}</p>
            </div>
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
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">模型</p>
              <p className="mt-2 text-sm font-medium">{modelTitle}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">来源任务</p>
              <p className="mt-2 text-sm font-medium">{sourceTaskCode}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">尺寸规格</p>
              <p className="mt-2 text-sm font-medium">{order.sizeOption || 'standard'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">材质规格</p>
              <p className="mt-2 text-sm font-medium">{order.materialOption || 'plastic'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">创建时间</p>
              <p className="mt-2 text-sm font-medium">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">更新时间</p>
              <p className="mt-2 text-sm font-medium">{formatDateTime(order.updatedAt)}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3">
            {order.shopifyCheckoutUrl ? (
              <Button asChild>
                <a href={order.shopifyCheckoutUrl} rel="noreferrer" target="_blank">
                  继续支付
                </a>
              </Button>
            ) : null}
            <OrderActionButton orderId={Number(order.id)} status={String(order.status)} />
            <Button asChild variant="ghost">
              <Link href="/dashboard/orders">返回订单列表</Link>
            </Button>
          </CardFooter>
        </Card>

        <div className="grid gap-4">
          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <Badge variant="outline">物流</Badge>
              <CardTitle className="mt-3 text-2xl tracking-tight">配送信息</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">收件人</p>
                <p className="mt-2 text-sm font-medium">{order.shippingName || '未填写'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">手机号</p>
                <p className="mt-2 text-sm font-medium">{order.shippingPhone || '未填写'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">收货地址</p>
                <p className="mt-2 text-sm font-medium">{order.shippingAddress || '未填写'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">物流单号</p>
                <p className="mt-2 text-sm font-medium">{order.trackingNumber || '暂未生成'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">支付会话</p>
                <p className="mt-2 text-sm font-medium">{query.session_id || order.shopifyOrderId || 'Stripe Checkout 已创建'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <Badge variant="outline">内部备注</Badge>
              <CardTitle className="mt-3 text-2xl tracking-tight">运营状态</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {order.internalNotes || '该区域会随着支付、生产与发货推进自动补充内部处理信息。'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <Badge variant="secondary">下一步</Badge>
              <CardTitle className="mt-3 text-2xl tracking-tight">建议检查项</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm leading-6 text-muted-foreground">
                <li>如果支付已经完成但状态未刷新，先执行一次同步。</li>
                <li>开始发货后，物流单号会同步显示在这里和订单列表中。</li>
                <li>已完成订单仍可回到模型库继续发起新的打印轮次。</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </DashboardShell>
  )
}
