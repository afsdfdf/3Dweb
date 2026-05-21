import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock3, Download, ExternalLink, PackageCheck, TriangleAlert } from 'lucide-react'

import { CreatePrintOrderButton } from '../../_components/CreatePrintOrderButton'
import { ResultStatus } from '../../_components/ResultStatus'
import { SiteShell } from '../../_components/SiteShell'
import { getTaskByCode } from '../../_lib/payload-data'
import { getCurrentUser } from '../../_lib/session'
import { formatDateTime, formatModelStatus, formatTaskGenerationType, formatTaskStatus } from '../../_lib/ui-text'
import styles from './page.module.css'

const deliveryNotes = [
  'Workbench remains the primary place to inspect and continue generation results.',
  'Completed models are added to the account model library automatically.',
  'Downloads and print checkout stay available here as compatibility actions.',
]

function formatModelFormatList(formats: unknown[]) {
  const labels = formats
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return ''
      const format = (item as { format?: unknown }).format
      return typeof format === 'string' && format.trim() ? format.trim().toUpperCase() : ''
    })
    .filter(Boolean)

  return labels.length > 0 ? labels.join(' / ') : 'Pending'
}

function getModelDownloadFormats(formats: unknown[]) {
  const downloadFormats = formats
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return ''
      const format = (item as { format?: unknown }).format
      return typeof format === 'string' ? format.trim().toLowerCase() : ''
    })
    .filter(Boolean)

  return Array.from(new Set(downloadFormats))
}

function getModelFromTask(task: Awaited<ReturnType<typeof getTaskByCode>>) {
  return task && typeof task.resultModel === 'object' ? task.resultModel : null
}

function getProgressValue(value: unknown) {
  const rawProgress = Number(value ?? 0)
  return Number.isFinite(rawProgress) ? Math.min(100, Math.max(0, rawProgress)) : 0
}

function getStatusTone(status?: null | string) {
  if (status === 'succeeded') return 'success'
  if (status === 'failed' || status === 'timeout') return 'danger'
  return 'working'
}

function TaskStatusIcon({ status }: { status?: null | string }) {
  if (status === 'succeeded') return <CheckCircle2 aria-hidden="true" size={28} />
  if (status === 'failed' || status === 'timeout') return <TriangleAlert aria-hidden="true" size={28} />
  return <Clock3 aria-hidden="true" size={28} />
}

function ResultNotFound({ taskCode }: { taskCode: string }) {
  return (
    <section className={styles.receiptPage}>
      <div className={styles.shell}>
        <article className={styles.notFoundPanel}>
          <span className={styles.eyebrow}>Result</span>
          <h1>Result not found</h1>
          <p>
            The task code <strong>{taskCode}</strong> was not found for the current account. Confirm the link or sign in with
            the account that owns this generation task.
          </p>
          <div className={styles.actionRow}>
            <Link className={`${styles.actionButton} ${styles.primaryAction}`} href="/workbench">
              Back to Workbench
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link className={styles.actionButton} href="/account?section=tasks">
              Open task history
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}

function ResultReceipt({ task }: { task: NonNullable<Awaited<ReturnType<typeof getTaskByCode>>> }) {
  const model = getModelFromTask(task)
  const modelFormats = Array.isArray(model?.formats) ? model.formats : []
  const modelFormatLabel = formatModelFormatList(modelFormats)
  const downloadFormats = getModelDownloadFormats(modelFormats)
  const progressValue = getProgressValue(task.progress)
  const progressWidth = Math.max(8, progressValue)
  const statusTone = getStatusTone(task.status)
  const publicDetailHref = model && model.visibility === 'public' ? `/model-detail?id=${encodeURIComponent(String(model.id))}` : null
  const workbenchHref = model ? `/workbench?model=${encodeURIComponent(String(model.id))}` : '/workbench'

  return (
    <section className={styles.receiptPage}>
      <div className={styles.shell}>
        <section className={styles.heroPanel}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Generation Receipt</span>
            <h1>{task.status === 'succeeded' ? 'Your result is ready.' : 'Generation task status.'}</h1>
            <p>{task.prompt || 'No prompt was recorded for this task.'}</p>
            <div className={styles.metaPills}>
              <span>{task.taskCode}</span>
              <span>{formatTaskGenerationType({ inputMode: task.inputMode, taskType: task.taskType })}</span>
              <span>{modelFormatLabel}</span>
            </div>
          </div>

          <div className={`${styles.statusCard} ${styles[statusTone]}`}>
            <TaskStatusIcon status={task.status} />
            <div>
              <span>Status</span>
              <strong>{formatTaskStatus(task.status)}</strong>
            </div>
            <ResultStatus taskId={task.id} taskStatus={String(task.status || '')} />
          </div>
        </section>

        <section className={styles.mainGrid}>
          <article className={styles.progressPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.sectionEyebrow}>Task Progress</span>
              <strong>{Math.round(progressValue)}%</strong>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressWidth}%` }} />
            </div>
            <div className={styles.statusSummary}>
              <div>
                <span>Task code</span>
                <strong>{task.taskCode}</strong>
              </div>
              <div>
                <span>Provider</span>
                <strong>{task.provider}</strong>
              </div>
              <div>
                <span>Credits reserved</span>
                <strong>{task.creditsReserved ?? 0}</strong>
              </div>
              <div>
                <span>Updated</span>
                <strong>{formatDateTime(task.updatedAt)}</strong>
              </div>
            </div>
            {task.failureReason ? (
              <div className={styles.failureBox}>
                <TriangleAlert aria-hidden="true" size={18} />
                <span>Failure reason: {task.failureReason}</span>
              </div>
            ) : null}
          </article>

          <aside className={styles.nextPanel}>
            <span className={styles.sectionEyebrow}>Next Step</span>
            <h2>{model ? model.title || 'Result model' : 'Continue in Workbench'}</h2>
            <p>
              {model
                ? 'Open the result in Workbench for the full model preview, editing context, and production workflow.'
                : 'Keep tracking this task in Workbench. The result actions will become available after the model is finalized.'}
            </p>
            <div className={styles.actionStack}>
              <Link className={`${styles.actionButton} ${styles.primaryAction}`} href={workbenchHref}>
                Open in Workbench
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link className={styles.actionButton} href="/account?section=tasks">
                Open task history
                <ExternalLink aria-hidden="true" size={18} />
              </Link>
              {publicDetailHref ? (
                <Link className={styles.actionButton} href={publicDetailHref}>
                  View public detail
                  <ExternalLink aria-hidden="true" size={18} />
                </Link>
              ) : null}
            </div>
          </aside>
        </section>

        <section className={styles.detailGrid}>
          <article className={styles.infoPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.sectionEyebrow}>Result Snapshot</span>
              <PackageCheck aria-hidden="true" size={22} />
            </div>
            <div className={styles.infoGrid}>
              <div>
                <span>Model name</span>
                <strong>{model?.title || 'Waiting for generation'}</strong>
              </div>
              <div>
                <span>Model status</span>
                <strong>{model ? formatModelStatus(model.status) : 'Waiting for generation'}</strong>
              </div>
              <div>
                <span>Available formats</span>
                <strong>{modelFormatLabel}</strong>
              </div>
              <div>
                <span>Print readiness</span>
                <strong>{model?.printReady ? 'Ready for print' : 'Needs review'}</strong>
              </div>
              <div>
                <span>Created</span>
                <strong>{formatDateTime(task.createdAt)}</strong>
              </div>
              <div>
                <span>Flow</span>
                <strong>Workbench to Library to Delivery</strong>
              </div>
            </div>
          </article>

          <article className={styles.deliveryPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.sectionEyebrow}>Delivery Actions</span>
              <Download aria-hidden="true" size={22} />
            </div>
            {model ? (
              <div className={styles.downloadList}>
                {downloadFormats.length > 0 ? (
                  downloadFormats.map((format) => (
                    <a
                      className={styles.downloadButton}
                      href={`/api/platform/models/${model.id}/download?format=${encodeURIComponent(format)}`}
                      key={format}
                    >
                      Download {format.toUpperCase()}
                    </a>
                  ))
                ) : (
                  <p>No downloadable format is available yet.</p>
                )}
                <div className={styles.printAction}>
                  <CreatePrintOrderButton modelId={Number(model.id)} sourceTaskId={Number(task.id)} variant="secondary" />
                </div>
              </div>
            ) : (
              <ul className={styles.noteList}>
                {deliveryNotes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>
        </section>
      </div>
    </section>
  )
}

export default async function ResultDetailPage({ params }: { params: Promise<{ taskCode: string }> }) {
  const { taskCode } = await params
  const user = await getCurrentUser()
  const task = await getTaskByCode(taskCode)
  const content = task ? <ResultReceipt task={task} /> : <ResultNotFound taskCode={taskCode} />

  return (
    <SiteShell currentPath="/workbench" layoutMode="document" showFooter={false} user={user}>
      {content}
    </SiteShell>
  )
}
