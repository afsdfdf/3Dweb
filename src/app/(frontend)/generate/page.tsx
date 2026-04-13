import Link from 'next/link'

import { GenerateForm } from '../_components/GenerateForm'
import { ModelViewer } from '../_components/ModelViewer'
import { SiteShell } from '../_components/SiteShell'
import { getCurrentUser } from '../_lib/session'

const modeLabel = {
  image: '图生 3D',
  text: '文生 3D',
  hybrid: '图文混合',
} as const

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: 'hybrid' | 'image' | 'text' }>
}) {
  const [user, query] = await Promise.all([getCurrentUser(), searchParams])
  const initialMode = query.mode === 'image' || query.mode === 'text' || query.mode === 'hybrid' ? query.mode : 'image'

  return (
    <SiteShell currentPath="/generate" user={user}>
      <section className="studio-minimal-shell">
        <div className="studio-minimal-head">
          <div>
            <p className="eyebrow">Studio</p>
            <h1>{modeLabel[initialMode]}</h1>
            <p className="section-lead">从这里开始生成。完成后再进入结果页、模型库和订单流程。</p>
          </div>

          <div className="button-row wrap-end">
            <Link className="ghost-button" href="/dashboard/tasks">
              任务记录
            </Link>
            <Link className="ghost-button" href="/dashboard/library">
              模型库
            </Link>
          </div>
        </div>

        {user ? (
          <section className="studio-workspace-grid">
            <GenerateForm initialMode={initialMode} />

            <div className="studio-preview-panel">
              <div className="studio-preview-topline">
                <p className="eyebrow">Preview</p>
                <span className="status-pill success">Studio Online</span>
              </div>

              <div className="studio-viewer-shell">
                <ModelViewer accent={initialMode === 'text' ? 'blue' : 'violet'} className="r3f-viewer-card" label={modeLabel[initialMode]} />
                <div className="viewer-hud top-left">
                  <span className="hud-dot" />
                  Live Preview
                </div>
                <div className="viewer-hud top-right">GLB / STL / OBJ</div>
              </div>
            </div>
          </section>
        ) : (
          <section className="studio-locked-shell gradient-panel">
            <div>
              <p className="eyebrow">先登录</p>
              <h2>登录后即可进入 Studio。</h2>
              <p className="soft-text">首页负责进入，生成页只负责开始工作流。</p>
            </div>

            <div className="button-row wrap-end">
              <Link className="primary-button" href="/login">
                去登录
              </Link>
              <Link className="secondary-button" href="/register">
                创建账号
              </Link>
            </div>
          </section>
        )}
      </section>
    </SiteShell>
  )
}
