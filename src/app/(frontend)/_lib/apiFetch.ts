/**
 * Thin fetch wrapper for client-side API calls.
 *
 * Applies a per-request timeout (default 30 s) so a hung serverless
 * function can't stall the browser indefinitely.  The caller is still
 * responsible for reading / handling the Response — this wrapper only
 * wraps the network layer.
 */

const DEFAULT_TIMEOUT_MS = 30_000

type ApiFetchOptions = RequestInit & {
  /** Override per-call timeout in ms. Pass 0 to disable. */
  timeoutMs?: number
}

export async function apiFetch(url: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: callerSignal, ...rest } = options

  let signal: AbortSignal | undefined
  if (timeoutMs > 0) {
    const timeout = AbortSignal.timeout(timeoutMs)
    if (callerSignal) {
      // Merge caller signal + timeout: abort on whichever fires first.
      const ac = new AbortController()
      const onAbort = () => ac.abort(callerSignal.reason)
      const onTimeout = () => ac.abort(timeout.reason)
      callerSignal.addEventListener('abort', onAbort, { once: true })
      timeout.addEventListener('abort', onTimeout, { once: true })
      signal = ac.signal
    } else {
      signal = timeout
    }
  } else {
    signal = callerSignal ?? undefined
  }

  return fetch(url, { credentials: 'include', ...rest, signal })
}
