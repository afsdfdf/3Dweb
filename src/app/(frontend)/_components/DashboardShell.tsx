import Link from 'next/link'
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type DashboardShellProps = {
  children: ReactNode
  currentPath?: string
  description: string
  title: string
}

const dashboardLinks = [
  { href: '/dashboard', label: '总览' },
  { href: '/dashboard/tasks', label: '任务记录' },
  { href: '/dashboard/library', label: '模型库' },
  { href: '/dashboard/orders', label: '订单中心' },
  { href: '/dashboard/credits', label: '积分账户' },
  { href: '/dashboard/settings', label: '账号设置' },
]

export function DashboardShell({ children, currentPath, description, title }: DashboardShellProps) {
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-4">
        <Card className="border-border/60 bg-card/80 shadow-lg shadow-black/5">
          <CardHeader className="gap-3">
            <Badge variant="secondary">工作台</Badge>
            <CardTitle className="text-2xl tracking-tight">你的 AI 3D 工作台</CardTitle>
            <CardDescription>把任务、模型、订单、积分与账号状态收进同一条工作流里。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline">Studio → Dashboard → Delivery</Badge>
            <Badge variant="outline">统一查看进度与资产</Badge>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardContent className="flex flex-col gap-2 p-3">
            {dashboardLinks.map((link) => (
              <Button asChild className="justify-start" key={link.href} variant={currentPath === link.href ? 'secondary' : 'ghost'}>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </aside>

      <section className="min-w-0 space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/70 p-6 shadow-lg shadow-black/5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">用户中心</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/generate">新建生成任务</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/orders">查看订单进度</Link>
            </Button>
          </div>
        </div>

        {children}
      </section>
    </div>
  )
}
