import Link from 'next/link'
import { notFound } from 'next/navigation'

type PageStatus = 'Dynamic' | 'Formal' | 'Local only' | 'Payload' | 'Protected' | 'Redirect'

type PageLink = {
  description: string
  href?: string
  path: string
  source: string
  status: PageStatus
}

const frontendPages: PageLink[] = [
  {
    description: 'Public homepage with managed rails, bundle shelf, and inspiration grid.',
    href: '/',
    path: '/',
    source: 'src/app/(frontend)/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Marketing page that explains product background and direction.',
    href: '/about',
    path: '/about',
    source: 'src/app/(frontend)/about/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Signed-in account center for profile, tasks, models, orders, billing, and settings.',
    href: '/account',
    path: '/account',
    source: 'src/app/(frontend)/account/page.tsx',
    status: 'Protected',
  },
  {
    description: 'Public bundle listing for curated model packs.',
    href: '/bundles',
    path: '/bundles',
    source: 'src/app/(frontend)/bundles/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Public bundle detail page opened from bundle slugs in Payload.',
    href: '/bundles',
    path: '/bundles/[slug]',
    source: 'src/app/(frontend)/bundles/[slug]/page.tsx',
    status: 'Dynamic',
  },
  {
    description: 'Contact and support entry page.',
    href: '/contact',
    path: '/contact',
    source: 'src/app/(frontend)/contact/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Developer-oriented marketing page for platform boundaries and APIs.',
    href: '/developers',
    path: '/developers',
    source: 'src/app/(frontend)/developers/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Feature overview page for generation, assets, delivery, and operations.',
    href: '/features',
    path: '/features',
    source: 'src/app/(frontend)/features/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Password recovery entry that reuses the shared auth flow.',
    href: '/forgot-password',
    path: '/forgot-password',
    source: 'src/app/(frontend)/forgot-password/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Component registry for local design review; blocked in production.',
    href: '/formal-components',
    path: '/formal-components',
    source: 'src/app/(frontend)/formal-components/page.tsx',
    status: 'Local only',
  },
  {
    description: 'Legacy generation entry that redirects to Workbench with mode query parameters.',
    href: '/generate',
    path: '/generate',
    source: 'src/app/(frontend)/generate/page.tsx',
    status: 'Redirect',
  },
  {
    description: 'Login route wrapper for the shared authentication card/modal.',
    href: '/login',
    path: '/login',
    source: 'src/app/(frontend)/login/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Public model detail page driven by a model id query string.',
    href: '/model-detail',
    path: '/model-detail?id=<modelId>',
    source: 'src/app/(frontend)/model-detail/page.tsx',
    status: 'Dynamic',
  },
  {
    description: 'Pricing page for subscriptions, credits, and product value explanation.',
    href: '/pricing',
    path: '/pricing',
    source: 'src/app/(frontend)/pricing/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Privacy policy page.',
    href: '/privacy-policy',
    path: '/privacy-policy',
    source: 'src/app/(frontend)/privacy-policy/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Refund policy page.',
    href: '/refund-policy',
    path: '/refund-policy',
    source: 'src/app/(frontend)/refund-policy/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Registration route wrapper for the shared authentication card/modal.',
    href: '/register',
    path: '/register',
    source: 'src/app/(frontend)/register/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Password reset page that posts to the account auth reset endpoint.',
    href: '/reset-password',
    path: '/reset-password',
    source: 'src/app/(frontend)/reset-password/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Resource and delivery education marketing page.',
    href: '/resources',
    path: '/resources',
    source: 'src/app/(frontend)/resources/page.tsx',
    status: 'Formal',
  },
  {
    description: 'AI task result page opened by generated task code.',
    path: '/results/[taskCode]',
    source: 'src/app/(frontend)/results/[taskCode]/page.tsx',
    status: 'Dynamic',
  },
  {
    description: 'Shipping policy page.',
    href: '/shipping-policy',
    path: '/shipping-policy',
    source: 'src/app/(frontend)/shipping-policy/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Public model showcase listing.',
    href: '/showcase',
    path: '/showcase',
    source: 'src/app/(frontend)/showcase/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Public showcase detail opened by model id.',
    href: '/showcase',
    path: '/showcase/[id]',
    source: 'src/app/(frontend)/showcase/[id]/page.tsx',
    status: 'Dynamic',
  },
  {
    description: 'Solutions marketing page for creator, studio, and brand workflows.',
    href: '/solutions',
    path: '/solutions',
    source: 'src/app/(frontend)/solutions/page.tsx',
    status: 'Formal',
  },
  {
    description: 'This local route map; blocked in production.',
    href: '/test',
    path: '/test',
    source: 'src/app/(frontend)/test/page.tsx',
    status: 'Local only',
  },
  {
    description: 'Local bundle visual validation page; blocked in production.',
    href: '/test-bundles',
    path: '/test-bundles',
    source: 'src/app/(frontend)/test-bundles/page.tsx',
    status: 'Local only',
  },
  {
    description: 'Email verification landing page opened from a tokenized email link.',
    path: '/verify-email/[token]',
    source: 'src/app/(frontend)/verify-email/[token]/page.tsx',
    status: 'Dynamic',
  },
  {
    description: 'Formal Studio Workbench for image generation, 3D generation, polling, and model review.',
    href: '/workbench',
    path: '/workbench',
    source: 'src/app/(frontend)/workbench/page.tsx',
    status: 'Formal',
  },
  {
    description: 'Signed-in Workbench task and activity history.',
    href: '/workbench/history',
    path: '/workbench/history',
    source: 'src/app/(frontend)/workbench/history/page.tsx',
    status: 'Protected',
  },
  {
    description: 'Workbench-owned model detail route opened from account/workbench model records.',
    path: '/workbench/models/[id]',
    source: 'src/app/(frontend)/workbench/models/[id]/page.tsx',
    status: 'Dynamic',
  },
]

const payloadPages: PageLink[] = [
  {
    description: 'Payload Admin application for operators and admins.',
    href: '/admin',
    path: '/admin',
    source: 'src/app/(payload)/admin/[[...segments]]/page.tsx',
    status: 'Payload',
  },
  {
    description: 'Payload REST catch-all route for registered collections and globals.',
    href: '/api',
    path: '/api/[...slug]',
    source: 'src/app/(payload)/api/[...slug]/route.ts',
    status: 'Payload',
  },
  {
    description: 'Payload GraphQL endpoint.',
    href: '/api/graphql',
    path: '/api/graphql',
    source: 'src/app/(payload)/api/graphql/route.ts',
    status: 'Payload',
  },
  {
    description: 'Payload GraphQL playground route.',
    href: '/api/graphql-playground',
    path: '/api/graphql-playground',
    source: 'src/app/(payload)/api/graphql-playground/route.ts',
    status: 'Payload',
  },
]

function PageTable({ rows }: { rows: PageLink[] }) {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b">
          <th className="py-2 pr-4 font-semibold">Path</th>
          <th className="py-2 pr-4 font-semibold">Status</th>
          <th className="py-2 pr-4 font-semibold">Description</th>
          <th className="py-2 font-semibold">Source</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr className="border-b align-top" key={`${row.status}:${row.path}`}>
            <td className="py-2 pr-4 font-mono text-xs">
              {row.href ? (
                <Link className="underline underline-offset-4" href={row.href}>
                  {row.path}
                </Link>
              ) : (
                row.path
              )}
            </td>
            <td className="py-2 pr-4">{row.status}</td>
            <td className="py-2 pr-4 text-muted-foreground">{row.description}</td>
            <td className="py-2 font-mono text-xs text-muted-foreground">{row.source}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function ProjectTestPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Local Route Map</p>
          <h1 className="text-3xl font-semibold tracking-tight">TEST Page Navigation</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            A direct local index of current pages. Dynamic pages are listed with their route pattern and should usually be opened from the related list page or a real database record.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Frontend Pages</h2>
          <PageTable rows={frontendPages} />
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Payload And API Shell Pages</h2>
          <PageTable rows={payloadPages} />
        </section>
      </div>
    </main>
  )
}
