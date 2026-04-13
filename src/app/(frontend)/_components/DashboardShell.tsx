import Link from 'next/link'
import type { ReactNode } from 'react'

type DashboardShellProps = {
  children: ReactNode
  title: string
  description: string
  currentPath?: string
}

const dashboardLinks = [
  { href: '/dashboard', label: '总览' },
  { href: '/dashboard/tasks', label: '任务记录' },
  { href: '/dashboard/library', label: '模型库' },
  { href: '/dashboard/orders', label: '订单中心' },
  { href: '/dashboard/credits', label: '积分账本' },
  { href: '/dashboard/settings', label: '账号设置' },
]

export function DashboardShell({ children, currentPath, description, title }: DashboardShellProps) {
  return (
    <div className="dashboard-layout dashboard-layout-clean">
      <aside className="dashboard-sidebar">
        <div className="sidebar-card dashboard-sidebar-card">
          <p className="eyebrow">Workspace</p>
          <h2>你的 AI 3D 工作台</h2>
          <p className="soft-text">把任务、模型、订单、积分与账号状态收进同一条工作流里，不再分散在多个页面。</p>
          <div className="sidebar-mini-meta">
            <span className="metric-pill">Studio → Dashboard → Delivery</span>
            <span className="metric-pill">统一查看进度与资产</span>
          </div>
        </div>

        <nav aria-label="工作台导航" className="sidebar-nav">
          {dashboardLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={currentPath === link.href ? 'sidebar-link active' : 'sidebar-link'}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <section className="dashboard-content">
        <div className="dashboard-shell-header">
          <div className="dashboard-shell-copy">
            <p className="eyebrow">用户中心</p>
            <h1>{title}</h1>
            <p className="section-lead">{description}</p>
          </div>

          <div className="dashboard-quick-actions">
            <Link className="primary-button" href="/generate">
              新建生成任务
            </Link>
            <Link className="ghost-button" href="/dashboard/orders">
              查看订单进度
            </Link>
          </div>
        </div>

        {children}
      </section>
    </div>
  )
}
