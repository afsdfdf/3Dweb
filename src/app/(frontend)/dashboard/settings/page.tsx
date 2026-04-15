import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { DashboardShell } from '../../_components/DashboardShell'
import { requireUser } from '../../_lib/session'
import { formatDateTime, formatRole } from '../../_lib/ui-text'

export default async function DashboardSettingsPage() {
  const user = await requireUser()

  return (
    <DashboardShell
      currentPath="/dashboard/settings"
      description="查看账号资料、当前权限，以及后续继续整理产品层与运维层边界的方向。"
      title="账号设置"
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader>
            <Badge variant="secondary">账户资料</Badge>
            <CardTitle className="text-2xl tracking-tight">当前账号</CardTitle>
            <CardDescription>这里展示当前登录用户在产品站、Studio 与 Dashboard 共享的身份信息。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">姓名</p>
              <p className="mt-2 text-sm font-medium">{user.fullName || '未填写'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">邮箱</p>
              <p className="mt-2 text-sm font-medium">{user.email || '未填写'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">角色</p>
              <p className="mt-2 text-sm font-medium">{formatRole(user.role)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">手机号</p>
              <p className="mt-2 text-sm font-medium">{user.phone || '未填写'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">当前积分</p>
              <p className="mt-2 text-sm font-medium">{user.creditsBalance ?? 0}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">最近活跃</p>
              <p className="mt-2 text-sm font-medium">{formatDateTime(user.lastActiveAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader>
            <Badge variant="outline">访问控制</Badge>
            <CardTitle className="text-2xl tracking-tight">当前权限范围</CardTitle>
            <CardDescription>继续保持产品站、Studio、Admin 与 API 的边界清晰。</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 text-sm leading-6 text-muted-foreground">
              <li>用户端只应暴露当前用户自己的任务、模型、订单与积分数据。</li>
              <li>Shopify 与 Stripe 支付状态只应通过订单与回调流程同步。</li>
              <li>Admin 与 Dashboard 必须保持分层，避免高权限入口泄露到用户界面。</li>
              <li>Payload Local API 的访问控制规则必须显式且收敛。</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader>
            <Badge variant="outline">安全提示</Badge>
            <CardTitle className="text-2xl tracking-tight">开发与部署注意事项</CardTitle>
            <CardDescription>本地环境适合继续迭代产品，但正式上线仍需补齐更严格的运维与安全控制。</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              账号页应聚焦当前状态展示；资料编辑、密钥管理、支付运维与基础设施配置，应继续拆分到更明确的产品层与后台层中。
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader>
            <Badge variant="secondary">下一步</Badge>
            <CardTitle className="text-2xl tracking-tight">接入清单</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-3 text-sm leading-6 text-muted-foreground">
              <li>补齐正式数据库与对象存储方案，例如 PostgreSQL / RDS 与 S3。</li>
              <li>把文件上传、CDN、回源与模型下载的职责拆得更清晰。</li>
              <li>在 Shopify Checkout 与 Stripe 并行存在时，继续整理支付与订单同步策略。</li>
              <li>继续完善 AI 任务流、结果资产、3D 模型库管理与访问边界。</li>
            </ol>
          </CardContent>
        </Card>
      </section>
    </DashboardShell>
  )
}
