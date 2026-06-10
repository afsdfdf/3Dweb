export default function WorkbenchLoading() {
  return (
    <div className="flex min-h-screen bg-[#0d0e11]">
      <div className="w-80 animate-pulse bg-[#13141a] border-r border-[#1e1f26]" />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#2fd18d] border-t-transparent" />
          <span className="text-sm text-[#7f8591]">Preparing workspace…</span>
        </div>
      </div>
    </div>
  )
}
