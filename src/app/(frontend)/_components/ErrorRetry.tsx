'use client'

type ErrorRetryProps = {
  message?: string
  onRetry: () => void
}

export function ErrorRetry({ message = 'Something went wrong.', onRetry }: ErrorRetryProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <p className="text-sm text-[#c8cad1]">{message}</p>
      <button
        className="rounded-md bg-[#1e1f26] px-4 py-2 text-sm text-[#c8cad1] transition hover:bg-[#2a2b33] active:scale-[0.97]"
        onClick={onRetry}
        type="button"
      >
        Try again
      </button>
    </div>
  )
}
