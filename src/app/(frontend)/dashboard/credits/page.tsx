import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { DashboardShell } from '../../_components/DashboardShell'
import { ManageSubscriptionButton } from '../../_components/ManageSubscriptionButton'
import {
  getCurrentUserActiveSubscription,
  getCurrentUserCreditAccount,
  getCurrentUserCreditTransactions,
  requireUser,
} from '../../_lib/session'
import { formatCreditType, formatDateTime, formatSubscriptionStatus } from '../../_lib/ui-text'

export default async function DashboardCreditsPage() {
  await requireUser()
  const [account, transactions, subscription] = await Promise.all([
    getCurrentUserCreditAccount(),
    getCurrentUserCreditTransactions(),
    getCurrentUserActiveSubscription(),
  ])

  const positiveChange = transactions.docs
    .filter((item) => Number(item.amount) > 0)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const negativeChange = transactions.docs
    .filter((item) => Number(item.amount) < 0)
    .reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0)

  return (
    <DashboardShell currentPath="/dashboard/credits" description="查看积分余额、订阅方案与最近积分流水。" title="积分账户">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: '当前余额', value: account?.balance ?? 0 },
          { label: '冻结积分', value: account?.reservedBalance ?? 0 },
          { label: '累计收入', value: positiveChange },
          { label: '累计支出', value: negativeChange },
        ].map((item) => (
          <Card className="border-border/60 bg-card/80" key={item.label} size="sm">
            <CardHeader>
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl tracking-tight">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader>
            <Badge variant="secondary">订阅方案</Badge>
            <CardTitle className="text-2xl tracking-tight">
              {subscription ? subscription.planKey : '尚未开通月付订阅'}
            </CardTitle>
            <CardDescription>
              {subscription
                ? `状态：${formatSubscriptionStatus(subscription.status)}`
                : '你可以在价格页开通 Starter / Pro / Studio 月付方案。'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">每期积分</p>
              <p className="mt-2 text-sm font-medium">{subscription?.monthlyCredits ?? 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">当前周期结束</p>
              <p className="mt-2 text-sm font-medium">{formatDateTime(subscription?.currentPeriodEnd)}</p>
            </div>
            <div className="md:col-span-2">
              {subscription ? <ManageSubscriptionButton /> : <p className="text-sm text-muted-foreground">开通后即可通过 Stripe Billing Portal 管理续费与取消。</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader>
            <Badge variant="outline">账户摘要</Badge>
            <CardTitle className="text-2xl tracking-tight">积分快照</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">累计购买</p>
              <p className="mt-2 text-sm font-medium">{account?.lifetimePurchased ?? 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">累计消耗</p>
              <p className="mt-2 text-sm font-medium">{account?.lifetimeSpent ?? 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">最近更新时间</p>
              <p className="mt-2 text-sm font-medium">{formatDateTime(account?.updatedAt)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">状态</p>
              <p className="mt-2 text-sm font-medium">可正常使用</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader>
            <Badge variant="outline">流水</Badge>
            <CardTitle className="text-2xl tracking-tight">积分变动记录</CardTitle>
            <CardDescription>购买、订阅发放、预扣、消耗与返还都会记录在这里。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {transactions.docs.length > 0 ? (
              transactions.docs.map((item) => {
                const amount = Number(item.amount || 0)

                return (
                  <div className="flex flex-col gap-3 rounded-2xl border border-border/60 p-4 sm:flex-row sm:items-center sm:justify-between" key={item.id}>
                    <div>
                      <strong className="block text-sm font-medium">{item.referenceCode}</strong>
                      <p className="mt-1 text-sm text-muted-foreground">{item.notes || formatCreditType(item.type)}</p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <Badge variant={amount >= 0 ? 'secondary' : 'destructive'}>
                        {amount >= 0 ? '+' : ''}
                        {amount}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{formatDateTime(item.createdAt)}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 p-4">
                <strong className="block text-sm font-medium">暂无流水记录</strong>
                <p className="mt-1 text-sm text-muted-foreground">后续购买、订阅发放、任务消耗与返还都会显示在这里。</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </DashboardShell>
  )
}
