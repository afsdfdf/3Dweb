import React from 'react'

const shellStyle = {
  alignItems: 'center',
  color: '#f0d188',
  display: 'flex',
  gap: 12,
  textDecoration: 'none',
}

const logoStyle = {
  display: 'block',
  height: 42,
  width: 42,
}

const iconStyle = {
  display: 'block',
  height: 28,
  width: 28,
}

const wordmarkStyle = {
  color: '#f0d188',
  fontFamily: '"Georgia", "Times New Roman", serif',
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: '0.08em',
  margin: 0,
  textTransform: 'uppercase' as const,
}

export default function ThornsTavernBrand() {
  return (
    <div style={shellStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="Thorns Tavern" src="/ui/frames/logo.png" style={logoStyle} />
      <p style={wordmarkStyle}>Thorns Tavern</p>
    </div>
  )
}

export function ThornsTavernIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="Thorns Tavern" src="/ui/frames/logo.png" style={iconStyle} />
  )
}
