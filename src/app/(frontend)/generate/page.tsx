import { redirect } from 'next/navigation'

export default async function GeneratePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: 'hybrid' | 'image' | 'text' }>
}) {
  const query = await searchParams
  const mode = query.mode === 'text' ? '?mode=text' : query.mode === 'hybrid' ? '?mode=hybrid' : ''

  redirect(`/workbench${mode}`)
}
