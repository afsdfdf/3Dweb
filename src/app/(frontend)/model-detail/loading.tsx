export default function ModelDetailLoading() {
  return (
    <div className="min-h-screen bg-[#0d0e11]">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="aspect-square w-full animate-pulse rounded-lg bg-[#1a1b20] lg:w-[560px]" />
          <div className="flex flex-1 flex-col gap-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-[#1a1b20]" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-[#1a1b20]" />
            <div className="h-32 animate-pulse rounded bg-[#1a1b20]" />
          </div>
        </div>
      </div>
    </div>
  )
}
