'use client'

import { useFormFields } from '@payloadcms/ui'
import type { CSSProperties } from 'react'

type FormFieldValue = {
  value?: unknown
}

type PreviewLink = {
  href: string
  label: string
}

type PreviewGroup = {
  helperText?: string
  links: PreviewLink[]
  title: string
}

const defaultBrandAlt = 'Thorns Tavern'
const defaultBrandSummary =
  'An AI 3D product platform for character creation, asset management, and print fulfillment.'

const previewShellStyle = {
  background: '#333333',
  border: '1px solid #4b494f',
  borderRadius: 8,
  color: '#f4f0e8',
  display: 'grid',
  gap: 18,
  padding: 18,
} satisfies CSSProperties

const getText = (value: unknown, fallback = '') => {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readFieldText(fields: Record<string, FormFieldValue>, path: string, fallback = '') {
  return getText(fields[path]?.value, fallback)
}

function normalizeLinks(value: unknown): PreviewLink[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!isRecord(item)) return []

    const label = getText(item.label)
    const href = getText(item.href)
    return label && href ? [{ href, label }] : []
  })
}

function readDirectGroups(value: unknown): PreviewGroup[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    if (!isRecord(item)) return []

    const title = getText(item.title)
    if (!title) return []

    return [
      {
        helperText: getText(item.helperText),
        links: normalizeLinks(item.links),
        title,
      },
    ]
  })
}

function readNestedGroups(fields: Record<string, FormFieldValue>) {
  const groups = new Map<number, PreviewGroup>()

  for (const [path, field] of Object.entries(fields)) {
    const match = /^footer\.linkGroups\.(\d+)\.(title|helperText|links\.(\d+)\.(label|href))$/.exec(path)
    if (!match) continue

    const groupIndex = Number(match[1])
    const group = groups.get(groupIndex) || { links: [], title: '' }

    if (match[2] === 'title') {
      group.title = getText(field.value)
    } else if (match[2] === 'helperText') {
      group.helperText = getText(field.value)
    } else {
      const linkIndex = Number(match[3])
      const linkField = match[4]
      group.links[linkIndex] = {
        href: linkField === 'href' ? getText(field.value) : group.links[linkIndex]?.href || '',
        label: linkField === 'label' ? getText(field.value) : group.links[linkIndex]?.label || '',
      }
    }

    groups.set(groupIndex, group)
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, group]) => ({
      ...group,
      links: group.links.filter((link) => link.label && link.href),
    }))
    .filter((group) => group.title)
}

function readPreviewGroups(fields: Record<string, FormFieldValue>, supportEmail: string) {
  const groups = readDirectGroups(fields['footer.linkGroups']?.value)
  const nestedGroups = groups.length > 0 ? groups : readNestedGroups(fields)

  if (nestedGroups.length > 0) return nestedGroups.slice(0, 4)

  return [
    {
      helperText: 'Evolving from an AI generation tool into an operable product website',
      links: [
        { href: '/about', label: 'About' },
        { href: '/blog', label: 'Blog' },
      ],
      title: 'Information',
    },
    {
      helperText: defaultBrandSummary,
      links: [
        { href: '/contact', label: 'Contact' },
        { href: `mailto:${supportEmail}`, label: supportEmail },
      ],
      title: 'Help customers',
    },
  ]
}

export function FooterPreview() {
  const fields = useFormFields(([formFields]) => formFields as Record<string, FormFieldValue>)

  const brandAlt = readFieldText(fields, 'footer.brandLogoAlt', defaultBrandAlt)
  const brandSummary = readFieldText(fields, 'footer.brandSummary', defaultBrandSummary)
  const supportEmail = readFieldText(fields, 'supportEmail', 'support@example.com')
  const linkGroups = readPreviewGroups(fields, supportEmail)

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>
        Live preview of the public footer. The logo field uses the uploaded media when it is guest-readable.
      </p>
      <div style={previewShellStyle}>
        <div style={{ alignItems: 'center', display: 'flex', gap: 14 }}>
          <div
            aria-label={brandAlt}
            style={{
              alignItems: 'center',
              background: '#f0d188',
              borderRadius: 6,
              color: '#222222',
              display: 'flex',
              fontSize: 12,
              fontWeight: 700,
              height: 32,
              justifyContent: 'center',
              letterSpacing: 0,
              minWidth: 124,
              padding: '0 12px',
            }}
          >
            {brandAlt}
          </div>
          <p style={{ color: '#a9abb2', lineHeight: 1.6, margin: 0 }}>{brandSummary}</p>
        </div>
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {linkGroups.map((group) => (
            <div key={group.title}>
              <h4 style={{ color: '#f0d188', fontSize: 11, letterSpacing: 0.8, margin: '0 0 8px', textTransform: 'uppercase' }}>
                {group.title}
              </h4>
              <div style={{ display: 'grid', gap: 6 }}>
                {group.links.map((link) => (
                  <span key={`${group.title}-${link.href}-${link.label}`} style={{ color: '#b9bbc1', fontSize: 13 }}>
                    {link.label}
                  </span>
                ))}
              </div>
              {group.helperText ? <p style={{ color: '#85878f', fontSize: 12, lineHeight: 1.5, margin: '10px 0 0' }}>{group.helperText}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FooterPreview
