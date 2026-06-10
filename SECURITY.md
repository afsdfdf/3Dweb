# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it privately:

- Open a [GitHub private security advisory](https://github.com/afsdfdf/3Dweb/security/advisories/new), or
- Contact the repository owner directly.

Please do **not** open a public issue for security vulnerabilities.

We aim to acknowledge reports within 72 hours and to release a fix for confirmed
high-severity issues within 14 days.

## Scope

- Authentication / authorization bypass
- Payment and credit-ledger manipulation
- Injection (SQL, XSS, SSRF)
- Exposure of secrets or private user data
- Rate-limit or abuse-control bypass

## Production Deployment Requirements

Operators must configure the following for the documented security controls to be effective:

| Variable | Why it matters |
|----------|----------------|
| `TRUST_PROXY_HEADERS=true` | Required behind Vercel/Cloudflare so rate limiting keys on real client IPs |
| `REDIS_URL` | Shares rate limits and token revocation across serverless instances |
| `PAYLOAD_SECRET` (≥32 chars) | Signs auth tokens |
| Live Stripe keys (`sk_live_*`) | Test keys are rejected at startup in production |
| `ALLOWED_REQUEST_ORIGINS` | Mutation origin allow-list (CSRF defense) |
