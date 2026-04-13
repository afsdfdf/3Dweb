import Link from 'next/link'

import { SiteShell } from './_components/SiteShell'
import { getMarketingSiteData } from './_lib/marketing'
import { getCurrentUser } from './_lib/session'
import './styles.css'

const entryCards = [
  {
    href: '/generate?mode=image',
    eyebrow: 'Image to 3D',
    title: '图生 3D',
    text: '上传参考图，快速生成可继续编辑、下载或打印的 3D 模型。',
    accent: 'violet',
  },
  {
    href: '/generate?mode=text',
    eyebrow: 'Text to 3D',
    title: '文生 3D',
    text: '输入角色描述或场景设定，直接进入 Studio 生成流程。',
    accent: 'blue',
  },
]

export default async function HomePage() {
  const [user, marketing] = await Promise.all([getCurrentUser(), getMarketingSiteData()])
  const { homepageContent, siteSettings } = marketing
  const previewWorks = homepageContent.featuredWorks.slice(0, 6)

  return (
    <SiteShell
      announcement={siteSettings.announcement}
      currentPath="/"
      footer={siteSettings.footer}
      navigation={siteSettings.headerNav}
      user={user}
    >
      <section className="home-minimal-shell">
        <div className="home-minimal-copy">
          <p className="eyebrow">{siteSettings.siteName}</p>
          <h1>直接开始生成 3D。</h1>
          <p className="lead">首页只保留两个入口：图生 3D 和文生 3D。生成、结果、模型和订单都放到 Studio 与工作台里继续完成。</p>
        </div>

        <div className="home-entry-grid">
          {entryCards.map((item) => (
            <Link className={`home-entry-card ${item.accent}`} href={item.href} key={item.title}>
              <div className="home-entry-visual" aria-hidden="true">
                <div className="home-entry-orb" />
                <div className="home-entry-gridlines" />
              </div>
              <div className="home-entry-body">
                <p className="eyebrow">{item.eyebrow}</p>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
                <span className="home-entry-action">进入入口</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-preview-shell">
        <div className="section-head home-preview-head">
          <div>
            <p className="eyebrow">Preview Works</p>
            <h2>底部只放作品预览。</h2>
          </div>
          <Link className="ghost-button" href="/showcase">
            查看更多
          </Link>
        </div>

        <div className="home-preview-grid">
          {previewWorks.map((item) => (
            <article className="home-preview-card" key={`${item.category}-${item.title}`}>
              <div className={`home-preview-visual ${item.tone || 'violet'}`}>
                <div className={`case-orb case-orb-${item.tone || 'violet'}`} />
                <div className={`case-silhouette ${item.tone || 'violet'}`} />
                <div className="case-grid-lines" />
              </div>
              <div className="home-preview-copy">
                <p className="eyebrow">{item.category}</p>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  )
}
