import type { ReactNode } from 'react'

type EmptyStateProps = {
  action?: ReactNode
  description?: string
  icon?: ReactNode
  title: string
}

export function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {icon ? <div className="text-[#3a3c43]">{icon}</div> : null}
      <h3 className="text-base font-semibold text-[#c8cad1]">{title}</h3>
      {description ? <p className="max-w-sm text-sm text-[#7f8591]">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
