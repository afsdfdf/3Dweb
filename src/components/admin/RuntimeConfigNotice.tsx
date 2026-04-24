'use client'

import { useLocale } from '@payloadcms/ui'

import { getAdminLocale } from '@/lib/adminText'

export function RuntimeConfigNotice() {
  const locale = getAdminLocale(useLocale())
  const copy =
    locale === 'zh'
      ? {
          bodyOne: '这里用于管理部署阶段的数据库连接信息和应用运行时变量。',
          bodyTwo: '数据库凭据和其他敏感密钥仍应保存在宿主平台环境变量中，而不是 Payload 内容里。',
          bodyThree: '修改这里不会热切换当前 Payload 数据库；更新部署变量后，请重启后端服务。',
          title: '运行时部署说明',
        }
      : {
          bodyOne: 'Use this page for deployment-time database connection details and application runtime variables.',
          bodyTwo: 'Database credentials and other secrets should stay in your hosting platform environment, not in Payload content.',
          bodyThree: 'Changes here do not hot-switch the current Payload database. Restart the backend after updating deployment variables.',
          title: 'Runtime deployment notice',
        }

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
      <strong style={{ display: 'block', marginBottom: 6 }}>{copy.title}</strong>
      <div>{copy.bodyOne}</div>
      <div>{copy.bodyTwo}</div>
      <div>{copy.bodyThree}</div>
    </div>
  )
}

export default RuntimeConfigNotice
