import Link from 'next/link'

import type { GenerationTask, Model } from '@/payload-types'

import { DashboardShell } from '../../_components/DashboardShell'
import { CreatePrintOrderButton } from '../../_components/CreatePrintOrderButton'
import { getCurrentUserModels, requireUser } from '../../_lib/session'
import { formatDateTime, formatModelStatus } from '../../_lib/ui-text'

function formatVisibility(visibility: Model['visibility']) {
  switch (visibility) {
    case 'public':
      return '\u516c\u5f00\u5c55\u793a'
    case 'team':
      return '\u56e2\u961f\u53ef\u89c1'
    default:
      return '\u79c1\u6709'
  }
}

function getSourceTaskCode(sourceTask: Model['sourceTask']) {
  if (sourceTask && typeof sourceTask === 'object' && 'taskCode' in sourceTask) {
    return (sourceTask as GenerationTask).taskCode
  }

  return null
}

function formatDimensions(model: Model) {
  const dimensions = model.dimensions

  if (dimensions?.widthMm && dimensions.heightMm && dimensions.depthMm) {
    return `${dimensions.widthMm} \u00d7 ${dimensions.heightMm} \u00d7 ${dimensions.depthMm} mm`
  }

  return '\u5f85\u751f\u6210\u540e\u8865\u5145'
}

export default async function DashboardLibraryPage() {
  await requireUser()
  const models = await getCurrentUserModels()

  return (
    <DashboardShell
      currentPath="/dashboard/library"
      description="\u96c6\u4e2d\u7ba1\u7406\u4f60\u7684\u751f\u6210\u6a21\u578b\u3001\u4e0b\u8f7d\u5165\u53e3\u4e0e\u6253\u5370\u64cd\u4f5c\u3002"
      title="\u6a21\u578b\u5e93"
    >
      {models.docs.length > 0 ? (
        <section className="asset-grid">
          {models.docs.map((model) => {
            const formats = Array.isArray(model.formats) ? model.formats : []
            const tags = Array.isArray(model.tags) ? model.tags : []
            const sourceTaskCode = getSourceTaskCode(model.sourceTask)

            return (
              <article className="asset-card" key={model.id}>
                <div className="asset-preview viewer-shell">
                  <div className="glow-ring" />
                  <div className="viewer-model-label">
                    <p className="eyebrow">\u6a21\u578b\u9884\u89c8</p>
                    <h3>{model.title}</h3>
                    <p className="soft-text">
                      {formatModelStatus(model.status)} \u00b7 {model.printReady ? '\u652f\u6301\u6253\u5370' : '\u4ec5\u4f9b\u4e0b\u8f7d'}
                    </p>
                  </div>
                </div>

                <div className="asset-meta">
                  <div className="record-card-head">
                    <div>
                      <p className="eyebrow">\u6a21\u578b\u8d44\u4ea7</p>
                      <h2>{model.title}</h2>
                    </div>
                    <span className={`status-pill${model.status === 'ready' ? ' success' : ''}`}>
                      {formatModelStatus(model.status)}
                    </span>
                  </div>

                  <p className="record-summary">
                    {model.description || '\u6682\u65e0\u63cf\u8ff0\uff0c\u53ef\u5728\u63a5\u5165\u771f\u5b9e\u751f\u6210\u63a5\u53e3\u540e\u8865\u5b8c\u6574\u6a21\u578b\u8bf4\u660e\u3002'}
                  </p>

                  <div className="detail-grid compact-gap">
                    <div>
                      <strong>\u683c\u5f0f</strong>
                      <p>
                        {formats.length > 0
                          ? formats.map((item) => String(item.format).toUpperCase()).join(' / ')
                          : 'GLB / STL'}
                      </p>
                    </div>
                    <div>
                      <strong>\u53ef\u89c1\u6027</strong>
                      <p>{formatVisibility(model.visibility)}</p>
                    </div>
                    <div>
                      <strong>\u5c3a\u5bf8</strong>
                      <p>{formatDimensions(model)}</p>
                    </div>
                    <div>
                      <strong>\u6700\u540e\u66f4\u65b0</strong>
                      <p>{formatDateTime(model.updatedAt)}</p>
                    </div>
                  </div>

                  {tags.length > 0 ? (
                    <div className="tag-row">
                      {tags.map((tag, index) => (
                        <span className="metric-pill" key={`${model.id}-${index}`}>
                          {tag.label || '\u672a\u5206\u7c7b\u6807\u7b7e'}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="asset-actions">
                    <a className="primary-button" href={`/api/platform/mock/models/${model.id}/download?format=glb`}>
                      \u4e0b\u8f7d GLB
                    </a>
                    <a className="secondary-button" href={`/api/platform/mock/models/${model.id}/download?format=stl`}>
                      \u4e0b\u8f7d STL
                    </a>
                    {model.printReady ? (
                      <CreatePrintOrderButton buttonClassName="ghost-button" modelId={Number(model.id)} />
                    ) : null}
                    <Link className="ghost-button" href={sourceTaskCode ? `/results/${sourceTaskCode}` : '/dashboard/library'}>
                      \u67e5\u770b\u6765\u6e90\u4efb\u52a1
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <section className="panel empty-state">
          <strong>\u4f60\u7684\u6a21\u578b\u5e93\u8fd8\u662f\u7a7a\u7684</strong>
          <p>
            \u751f\u6210\u6210\u529f\u540e\uff0c\u6a21\u578b\u4f1a\u81ea\u52a8\u8fdb\u5165\u8fd9\u91cc\u3002\u540e\u7eed\u4f60\u53ef\u4ee5\u91cd\u590d\u4e0b\u8f7d\u3001\u518d\u6b21\u4e0b\u5355\u6216\u7ee7\u7eed\u505a\u7248\u672c\u7ba1\u7406\u3002
          </p>
          <Link className="primary-button" href="/generate">
            \u53bb\u751f\u6210\u7b2c\u4e00\u4e2a\u6a21\u578b
          </Link>
        </section>
      )}
    </DashboardShell>
  )
}
