const baseURL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000'

const checks = [
  { path: '/', expected: [200] },
  { path: '/login', expected: [200] },
  { path: '/register', expected: [200] },
  { path: '/generate', expected: [200, 307, 308] },
  { path: '/pricing', expected: [200] },
  { path: '/showcase', expected: [200] },
  { path: '/api/users/me', expected: [200, 401] },
]

async function main() {
  const results = []

  for (const check of checks) {
    const url = `${baseURL}${check.path}`
    const response = await fetch(url, { redirect: 'manual' })

    results.push({
      expected: check.expected,
      ok: check.expected.includes(response.status),
      path: check.path,
      status: response.status,
    })
  }

  const failed = results.filter((item) => !item.ok)

  console.log(JSON.stringify({ baseURL, failed, results }, null, 2))

  if (failed.length > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
