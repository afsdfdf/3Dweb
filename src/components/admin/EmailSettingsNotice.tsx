export function EmailSettingsNotice() {
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
      <strong style={{ display: 'block', marginBottom: 6 }}>SMTP 凭证说明</strong>
      <div>后台这里管理邮件品牌、发件显示信息与文案模板。</div>
      <div>真正的 SMTP 账号密码仍请通过环境变量配置：SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS。</div>
    </div>
  )
}

export default EmailSettingsNotice
