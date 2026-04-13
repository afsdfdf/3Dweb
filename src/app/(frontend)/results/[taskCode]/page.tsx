import Link from 'next/link'

import { CreatePrintOrderButton } from '../../_components/CreatePrintOrderButton'
import { ModelViewer } from '../../_components/ModelViewer'
import { ResultStatus } from '../../_components/ResultStatus'
import { SiteShell } from '../../_components/SiteShell'
import { getTaskByCode } from '../../_lib/payload-data'
import { getCurrentUser } from '../../_lib/session'
import { formatDateTime, formatInputMode, formatModelStatus, formatTaskStatus } from '../../_lib/ui-text'

const viewerModes = ['透视', '光照', '网格', '打印预览']
const deliveryNotes = [
  '模型生成成功后会自动进入模型库。',
  '你可以从这里继续下载交付文件。',
  '如果需要实体样件，可以继续进入打印订单流程。',
]

export default async function ResultDetailPage({ params }: { params: Promise<{ taskCode: string }> }) {
  const { taskCode } = await params
  const user = await getCurrentUser()
  const task = await getTaskByCode(taskCode)

  if (!task) {
    return (
      <SiteShell user={user}>
        <section className="panel empty-state">
          <h1>未找到结果</h1>
          <p>请确认任务编号是否正确，或先登录拥有该任务权限的账号。</p>
        </section>
      </SiteShell>
    )
  }

  const model = typeof task.resultModel === 'object' ? task.resultModel : null
  const modelFormats = Array.isArray(model?.formats) ? model.formats : []
  const progressWidth = Math.max(12, Number(task.progress ?? 0))

  return (
    <SiteShell user={user}>
      <section className="section-hero compact">
        <div>
          <p className="eyebrow">结果页</p>
          <h1>{task.taskCode}</h1>
          <p className="section-lead">{task.prompt || '当前任务未填写提示词。'}</p>
        </div>
        <div className="status-stack">
          <ResultStatus taskId={task.id} taskStatus={task.status} />
          <span className="muted-text">当前进度 {task.progress ?? 0}%</span>
        </div>
      </section>

      <section className="result-layout">
        <div className="result-viewer-panel">
          <div className="viewer-stage">
            <div className="viewer-hud top-left">
              <span className="hud-dot" />
              结果预览
            </div>
            <div className="viewer-hud top-right">
              {modelFormats.length > 0 ? modelFormats.map((item: any) => String(item.format).toUpperCase()).join(' / ') : 'GLB / STL'}
            </div>
            <ModelViewer accent="violet" className="r3f-viewer-card result-viewer-shell" label={model?.title || '结果模型'} />
            <div className="viewer-bottom-bar">
              {viewerModes.map((mode) => (
                <span className="viewer-mode-pill" key={mode}>
                  {mode}
                </span>
              ))}
            </div>
          </div>

          <div className="panel viewer-inspector">
            <div className="section-head">
              <div>
                <p className="eyebrow">任务状态</p>
                <h2>{task.status === 'succeeded' ? model?.title || '结果模型' : '生成处理中'}</h2>
              </div>
              <span className={`status-pill${task.status === 'succeeded' ? ' success' : task.status === 'failed' ? ' danger' : ''}`}>
                {formatTaskStatus(task.status)}
              </span>
            </div>

            <div className="progress-track result-progress-track" aria-hidden="true">
              <span style={{ width: `${progressWidth}%` }} />
            </div>

            <div className="detail-grid compact-gap">
              <div>
                <strong>输入模式</strong>
                <p>{formatInputMode(task.inputMode)}</p>
              </div>
              <div>
                <strong>供应商</strong>
                <p>{task.provider}</p>
              </div>
              <div>
                <strong>预扣积分</strong>
                <p>{task.creditsReserved ?? 0}</p>
              </div>
              <div>
                <strong>任务状态</strong>
                <p>{formatTaskStatus(task.status)}</p>
              </div>
              <div>
                <strong>创建时间</strong>
                <p>{formatDateTime(task.createdAt)}</p>
              </div>
              <div>
                <strong>最近更新</strong>
                <p>{formatDateTime(task.updatedAt)}</p>
              </div>
            </div>

            <div className="viewer-data-grid">
              <article className="mini-card">
                <p className="eyebrow">模型状态</p>
                <h3>{model ? formatModelStatus(model.status) : '等待生成'}</h3>
                <p className="soft-text">{model?.printReady ? '当前模型可继续进入打印链路。' : '模型生成后可继续下载或归档。'}</p>
              </article>
              <article className="mini-card">
                <p className="eyebrow">结果承接</p>
                <h3>结果页 → 模型库</h3>
                <p className="soft-text">当前结果页负责展示任务状态，并把可用结果继续沉淀到模型库与订单流程。</p>
              </article>
            </div>
          </div>
        </div>

        <div className="result-side-stack">
          <div className="gradient-panel">
            <p className="eyebrow">下一步</p>
            <h3>继续使用生成结果</h3>
            {model ? (
              <div className="button-column">
                <a className="primary-button" href={`/api/platform/mock/models/${model.id}/download?format=glb`}>
                  下载 GLB 文件
                </a>
                <a className="secondary-button" href={`/api/platform/mock/models/${model.id}/download?format=stl`}>
                  下载 STL 文件
                </a>
                <CreatePrintOrderButton buttonClassName="secondary-button" modelId={Number(model.id)} sourceTaskId={Number(task.id)} />
                <Link className="ghost-button" href="/dashboard/library">
                  打开模型库
                </Link>
              </div>
            ) : (
              <ul className="check-list">
                <li>任务仍在处理中，请保持当前页面开启。</li>
                <li>系统会自动轮询并刷新状态。</li>
                <li>生成完成后下载和打印入口会自动出现。</li>
              </ul>
            )}
            {task.failureReason ? <p className="error-text">失败原因：{task.failureReason}</p> : null}
          </div>

          <div className="panel">
            <p className="eyebrow">交付信息</p>
            <h2>结果摘要</h2>
            <div className="detail-grid compact-gap">
              <div>
                <strong>可用格式</strong>
                <p>{modelFormats.length > 0 ? modelFormats.map((item: any) => String(item.format).toUpperCase()).join(' / ') : 'GLB / STL'}</p>
              </div>
              <div>
                <strong>打印状态</strong>
                <p>{model?.printReady ? '可打印' : '待确认'}</p>
              </div>
              <div>
                <strong>任务编号</strong>
                <p>{task.taskCode}</p>
              </div>
              <div>
                <strong>模型名称</strong>
                <p>{model?.title || '等待生成'}</p>
              </div>
            </div>
          </div>

          <div className="panel">
            <p className="eyebrow">交付建议</p>
            <h2>你可以这样继续</h2>
            <ul className="check-list">
              {deliveryNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </SiteShell>
  )
}
