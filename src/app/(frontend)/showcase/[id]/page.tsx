import { redirect } from 'next/navigation'

export default async function ShowcaseDetailRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  redirect(`/model-detail?id=${encodeURIComponent(id)}`)
}
