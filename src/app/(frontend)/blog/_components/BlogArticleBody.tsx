import Link from 'next/link'
import type { ReactNode } from 'react'

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

function isSafeHref(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return false
  if (value.startsWith('/')) return true

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'mailto:'
  } catch {
    return false
  }
}

function renderChildren(children: LexicalNode[] | undefined, keyPrefix: string): ReactNode {
  if (!Array.isArray(children)) return null

  return children.map((child, index) => renderNode(child, `${keyPrefix}-${index}`))
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

function getUploadImage(node: LexicalNode) {
  const value = isRecord(node.value) ? node.value : isRecord(node.fields) ? node.fields : null
  if (!value) return null

  const src = typeof value.thumbnailURL === 'string' && value.thumbnailURL ? value.thumbnailURL : typeof value.url === 'string' && value.url ? value.url : null
  if (!src || !isSafeHref(src)) return null

  return {
    alt: typeof value.alt === 'string' && value.alt.trim() ? value.alt.trim() : 'Article image',
    src,
  }
}

function getCodeText(node: LexicalNode) {
  if (typeof node.text === 'string') return node.text
  if (!Array.isArray(node.children)) return ''
  return node.children.map((child) => child.text || '').join('\n')
}

function renderNode(node: LexicalNode, key: string): ReactNode {
  if (!node || typeof node !== 'object') return null

  if (node.type === 'text') return renderTextNode(node, key)
  if (node.type === 'linebreak') return <br key={key} />

  if (node.type === 'heading') {
    const Tag = node.tag === 'h4' ? 'h4' : node.tag === 'h3' ? 'h3' : 'h2'
    return <Tag key={key}>{renderChildren(node.children, key)}</Tag>
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
    const image = getUploadImage(node)
    if (!image) return null

    return (
      <figure key={key}>
        <img alt={image.alt} loading="lazy" src={image.src} />
        {image.alt !== 'Article image' ? <figcaption>{image.alt}</figcaption> : null}
      </figure>
    )
  }

  if (node.type === 'quote') {
    return <blockquote key={key}>{renderChildren(node.children, key)}</blockquote>
  }

  if (node.type === 'list') {
    const ordered = node.listType === 'number'
    const Tag = ordered ? 'ol' : 'ul'
    return <Tag key={key}>{renderChildren(node.children, key)}</Tag>
  }

  if (node.type === 'listitem') {
    return <li key={key}>{renderChildren(node.children, key)}</li>
  }

  if (node.type === 'link' && isSafeHref(node.url)) {
    const href = String(node.url)

    if (href.startsWith('/')) {
      return (
        <Link href={href} key={key}>
          {renderChildren(node.children, key)}
        </Link>
      )
    }

    return (
      <a href={href} key={key} rel="noreferrer" target="_blank">
        {renderChildren(node.children, key)}
      </a>
    )
  }

  if (node.type === 'paragraph') {
    return <p key={key}>{renderChildren(node.children, key)}</p>
  }

  return <div key={key}>{renderChildren(node.children, key)}</div>
}

export function BlogArticleBody({ content }: { content: unknown }) {
  const root = content && typeof content === 'object' && 'root' in content ? (content as { root?: LexicalNode }).root : null
  const children = root?.children

  if (!Array.isArray(children) || children.length === 0) {
    return (
      <div className={styles.articleBody}>
        <p>This dispatch is being prepared by the tavern team.</p>
      </div>
    )
  }

  return <div className={styles.articleBody}>{children.map((node, index) => renderNode(node, `node-${index}`))}</div>
}
