import { DashboardShell } from '../../_components/DashboardShell'
import { getCurrentUserCreditAccount, getCurrentUserCreditTransactions, requireUser } from '../../_lib/session'
import { formatCreditType, formatDateTime } from '../../_lib/ui-text'

export default async function DashboardCreditsPage() {
  await requireUser()
  const [account, transactions] = await Promise.all([
    getCurrentUserCreditAccount(),
    getCurrentUserCreditTransactions(),
  ])

  const positiveChange = transactions.docs
    .filter((item) => Number(item.amount) > 0)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)

  const negativeChange = transactions.docs
    .filter((item) => Number(item.amount) < 0)
    .reduce((sum, item) => sum + Math.abs(Number(item.amount || 0)), 0)

  return (
    <DashboardShell
      currentPath="/dashboard/credits"
      description="??????????????????????"
      title="????"
    >
      <section className="metric-grid">
        <article className="stat-card"><p>????</p><h3>{account?.balance ?? 0}</h3></article>
        <article className="stat-card"><p>???</p><h3>{account?.reservedBalance ?? 0}</h3></article>
        <article className="stat-card"><p>????</p><h3>{positiveChange}</h3></article>
        <article className="stat-card"><p>????</p><h3>{negativeChange}</h3></article>
      </section>

      <section className="mesh-grid">
        <div className="gradient-panel">
          <p className="eyebrow">????</p>
          <h2>??????</h2>
          <ul className="check-list">
            <li>??????????????????????</li>
            <li>?????????????????????????</li>
            <li>???? Shopify ????????????</li>
          </ul>
        </div>

        <div className="panel">
          <p className="eyebrow">??????</p>
          <h2>????</h2>
          <div className="detail-grid compact-gap">
            <div><strong>????</strong><p>{account?.lifetimePurchased ?? 0}</p></div>
            <div><strong>????</strong><p>{account?.lifetimeSpent ?? 0}</p></div>
            <div><strong>??????</strong><p>{formatDateTime(account?.updatedAt)}</p></div>
            <div><strong>????</strong><p>??????</p></div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">????</p>
            <h2>????</h2>
          </div>
        </div>
        <div className="table-like">
          {transactions.docs.length > 0 ? (
            transactions.docs.map((item) => {
              const amount = Number(item.amount || 0)

              return (
                <div className="table-row" key={item.id}>
                  <div>
                    <strong>{item.referenceCode}</strong>
                    <p>{item.notes || formatCreditType(item.type)}</p>
                  </div>
                  <div className="row-meta-stack align-end">
                    <span className={`amount-pill ${amount >= 0 ? 'positive' : 'negative'}`}>
                      {amount >= 0 ? '+' : ''}{amount}
                    </span>
                    <span className="muted-text">{formatDateTime(item.createdAt)}</span>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="table-row">
              <div>
                <strong>????</strong>
                <p>???????????????????</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  )
}
