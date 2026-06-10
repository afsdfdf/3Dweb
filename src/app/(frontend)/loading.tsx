export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0e11]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#2fd18d] border-t-transparent" />
        <span className="text-sm text-[#7f8591]">Loading…</span>
      </div>
    </div>
  )
}
