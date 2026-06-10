export default function ShowcaseLoading() {
  return (
    <div className="min-h-screen bg-[#0d0e11] px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 h-8 w-48 animate-pulse rounded bg-[#1a1b20]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[228/372] animate-pulse rounded bg-[#1a1b20]" />
          ))}
        </div>
      </div>
    </div>
  )
}
