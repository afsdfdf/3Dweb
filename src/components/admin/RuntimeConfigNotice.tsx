'use client'

export function RuntimeConfigNotice() {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid rgba(15, 23, 42, 0.08)',
        borderRadius: 12,
        color: '#334155',
        fontSize: 13,
        lineHeight: 1.7,
        padding: 14,
      }}
    >
      <strong style={{ display: 'block', marginBottom: 6 }}>Runtime deployment notes</strong>
      <div>This page is for deployment-time variables such as AWS RDS connection details and app URLs.</div>
      <div>Database credentials and other secrets should stay in your hosting platform environment, not in Payload content.</div>
      <div>Applying changes here does not hot-switch the current Payload database. After updating deployment env vars, restart the backend service.</div>
    </div>
  )
}

export default RuntimeConfigNotice
