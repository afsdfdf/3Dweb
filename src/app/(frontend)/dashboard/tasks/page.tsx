import Link from 'next/link'

import { DashboardShell } from '../../_components/DashboardShell'
import { getCurrentUserTasks, requireUser } from '../../_lib/session'
import { formatDateTime, formatInputMode, formatTaskStatus } from '../../_lib/ui-text'

export default async function DashboardTasksPage() {
  await requireUser()
  const tasks = await getCurrentUserTasks()

  const queuedCount = tasks.docs.filter((task) => task.status === 'queued').length
  const processingCount = tasks.docs.filter((task) => task.status === 'processing').length
  const succeededCount = tasks.docs.filter((task) => task.status === 'succeeded').length

  return (
    <DashboardShell
      currentPath="/dashboard/tasks"
      description="??????? AI ????????????????"
      title="????"
    >
      <section className="metric-grid">
        <article className="stat-card"><p>????</p><h3>{tasks.docs.length}</h3></article>
        <article className="stat-card"><p>???</p><h3>{queuedCount}</h3></article>
        <article className="stat-card"><p>???</p><h3>{processingCount}</h3></article>
        <article className="stat-card"><p>???</p><h3>{succeededCount}</h3></article>
      </section>

      <section className="records-grid">
        {tasks.docs.length > 0 ? (
          tasks.docs.map((task) => (
            <article className="record-card" key={task.id}>
              <div className="record-card-head">
                <div>
                  <p className="eyebrow">????</p>
                  <h2>{task.taskCode}</h2>
                </div>
                <span className={`status-pill${task.status === 'succeeded' ? ' success' : task.status === 'failed' ? ' danger' : ''}`}>
                  {formatTaskStatus(task.status)}
                </span>
              </div>

              <p className="record-summary">{task.prompt || '??????'}</p>

              <div className="detail-grid compact-gap">
                <div>
                  <strong>????</strong>
                  <p>{formatInputMode(task.inputMode)}</p>
                </div>
                <div>
                  <strong>????</strong>
                  <p>{task.provider || 'custom'}</p>
                </div>
                <div>
                  <strong>????</strong>
                  <p>{task.progress ?? 0}%</p>
                </div>
                <div>
                  <strong>????</strong>
                  <p>{task.creditsReserved ?? 0}</p>
                </div>
                <div>
                  <strong>????</strong>
                  <p>{formatDateTime(task.createdAt)}</p>
                </div>
                <div>
                  <strong>????</strong>
                  <p>{formatDateTime(task.updatedAt)}</p>
                </div>
              </div>

              <div className="progress-track" aria-hidden="true">
                <span style={{ width: `${Math.max(8, Number(task.progress ?? 0))}%` }} />
              </div>

              <div className="record-card-footer">
                <span className="muted-text">
                  {typeof task.parameterSnapshot === 'object' && task.parameterSnapshot && 'format' in task.parameterSnapshot
                    ? `?? ${String(task.parameterSnapshot.format).toUpperCase()}`
                    : '??????'}
                </span>
                <Link href={`/results/${task.taskCode}`}>?????</Link>
              </div>
            </article>
          ))
        ) : (
          <section className="panel empty-state">
            <strong>???????</strong>
            <p>?????????????????????????????????</p>
            <Link className="primary-button" href="/generate">
              ?????
            </Link>
          </section>
        )}
      </section>
    </DashboardShell>
  )
}
