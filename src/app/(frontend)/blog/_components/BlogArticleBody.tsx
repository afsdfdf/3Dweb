import Link from 'next/link'
import type { ReactNode } from 'react'

import type { BlogPageContent } from '../_lib/blogPageDefaults'
import { getGuestReadableBlogImageURL, isInternalBlogHref, normalizeBlogHref } from '../_lib/blogSafety'
import styles from '../page.module.css'

type LexicalNode = {
  children?: LexicalNode[]
  direction?: string | null
  fields?: Record<string, unknown>
  format?: number | string
  indent?: number
  listType?: string
  relationTo?: string
  tag?: string
  text?: string
  type?: string
  url?: string
  value?: unknown
  version?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function renderTextNode(node: LexicalNode, key: string) {
  let content: ReactNode = node.text || ''
  const format = typeof node.format === 'number' ? node.format : 0

  if (format & 1) content = <strong>{content}</strong>
  if (format & 2) content = <em>{content}</em>
  if (format & 8) content = <u>{content}</u>
  if (format & 16) content = <code>{content}</code>

  return <span key={key}>{content}</span>
}

function getUploadImage(node: LexicalNode, fallbackAlt: string) {
  const value = isRecord(node.value) ? node.value : isRecord(node.fields) ? node.fields : null
  if (!value) return null

  const src = getGuestReadableBlogImageURL(value)
  if (!src) return null

  return {
    alt: typeof value.alt === 'string' && value.alt.trim() ? value.alt.trim() : fallbackAlt,
    src,
  }
}

function getCodeText(node: LexicalNode) {
  if (typeof node.text === 'string') return node.text
  if (!Array.isArray(node.children)) return ''
  return node.children.map((child) => child.text || '').join('\n')
}

function renderNode(node: LexicalNode, key: string, labels: BlogPageContent['articleLabels']): ReactNode {
  if (!node || typeof node !== 'object') return null

  if (node.type === 'text') return renderTextNode(node, key)
  if (node.type === 'linebreak') return <br key={key} />

  if (node.type === 'heading') {
    const Tag = node.tag === 'h4' ? 'h4' : node.tag === 'h3' ? 'h3' : 'h2'
    return <Tag key={key}>{renderChildren(node.children, key, labels)}</Tag>
  }

  if (node.type === 'horizontalrule' || node.type === 'horizontal-rule') {
    return <hr key={key} />
  }

  if (node.type === 'code' || node.type === 'codeblock') {
    return (
      <pre key={key}>
        <code>{getCodeText(node)}</code>
      </pre>
    )
  }

  if (node.type === 'upload') {
    const image = getUploadImage(node, labels.articleImageFallbackAlt)
    if (!image) return null

    return (
      <figure key={key}>
        <img alt={image.alt} loading="lazy" src={image.src} />
        {image.alt !== labels.articleImageFallbackAlt ? <figcaption>{image.alt}</figcaption> : null}
      </figure>
    )
  }

  if (node.type === 'quote') {
    return <blockquote key={key}>{renderChildren(node.children, key, labels)}</blockquote>
  }

  if (node.type === 'list') {
    const ordered = node.listType === 'number'
    const Tag = ordered ? 'ol' : 'ul'
    return <Tag key={key}>{renderChildren(node.children, key, labels)}</Tag>
  }

  if (node.type === 'listitem') {
    return <li key={key}>{renderChildren(node.children, key, labels)}</li>
  }

  if (node.type === 'link') {
    const href = normalizeBlogHref(node.url, null, { allowHash: true, allowMailto: true })
    if (!href) return <span key={key}>{renderChildren(node.children, key, labels)}</span>

    if (isInternalBlogHref(href)) {
      return (
        <Link href={href} key={key}>
          {renderChildren(node.children, key, labels)}
        </Link>
      )
    }

    if (href.startsWith('#') || href.startsWith('mailto:')) {
      return (
        <a href={href} key={key}>
          {renderChildren(node.children, key, labels)}
        </a>
      )
    }

    return (
      <a href={href} key={key} rel="noreferrer" target="_blank">
        {renderChildren(node.children, key, labels)}
      </a>
    )
  }

  if (node.type === 'paragraph') {
    return <p key={key}>{renderChildren(node.children, key, labels)}</p>
  }

  return <div key={key}>{renderChildren(node.children, key, labels)}</div>
}

function renderChildren(children: LexicalNode[] | undefined, keyPrefix: string, labels: BlogPageContent['articleLabels']): ReactNode {
  if (!Array.isArray(children)) return null

  return children.map((child, index) => renderNode(child, `${keyPrefix}-${index}`, labels))
}

export function BlogArticleBody({
  content,
  labels,
}: {
  content: unknown
  labels: BlogPageContent['articleLabels']
}) {
  const root = content && typeof content === 'object' && 'root' in content ? (content as { root?: LexicalNode }).root : null
  const children = root?.children

  if (!Array.isArray(children) || children.length === 0) {
    return (
      <div className={styles.articleBody}>
        <p>{labels.emptyBodyText}</p>
      </div>
    )
  }

  return <div className={styles.articleBody}>{children.map((node, index) => renderNode(node, `node-${index}`, labels))}</div>
}
