import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type AuthPageHighlight = {
  description: string
  title: string
}

type AuthPageLayoutProps = {
  badge: string
  children: ReactNode
  description: string
  highlights: AuthPageHighlight[]
  title: string
}

export function AuthPageLayout({ badge, children, description, highlights, title }: AuthPageLayoutProps) {
  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 sm:py-14 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className="flex flex-col justify-center gap-6">
        <div className="max-w-2xl">
          <Badge variant="secondary">{badge}</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {highlights.map((item) => (
            <Card className="border-border/60 bg-card/80 shadow-sm" key={item.title}>
              <CardHeader>
                <CardTitle className="text-xl tracking-tight">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">{item.description}</CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center xl:justify-end">{children}</div>
    </section>
  )
}
