import React from 'react'
import './globals.css'
import './styles.css'

export const metadata = {
  description: '基于 Payload CMS 与 Next.js 构建的 AI 3D 角色生成、模型管理与打印交付平台。',
  title: 'MiniForge AI 3D',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="zh-CN">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
