# AWS RDS Setup

## Goal
- Run Payload against a real AWS RDS PostgreSQL database.
- Keep local SQLite available as a fallback for development.
- Make the backend connect through environment variables only.

## Important note
- Standard AWS RDS PostgreSQL does **not** connect with only `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.
- You still need database connection details:
  - `AWS_RDS_HOST`
  - `AWS_RDS_PORT`
  - `AWS_RDS_DB_NAME`
  - `AWS_RDS_USERNAME`
  - `AWS_RDS_PASSWORD`
- AWS access keys are for services like S3. RDS PostgreSQL normally uses database credentials.

## Supported backend modes

### Option 1
- Set `DATABASE_URL` directly.
- Example:

```env
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://payload_user:strong_password@your-rds-endpoint.region.rds.amazonaws.com:5432/payload_app?sslmode=require
```

### Option 2
- Let the backend compose the PostgreSQL connection string from AWS RDS variables.
- Example:

```env
DATABASE_PROVIDER=postgres
AWS_RDS_HOST=your-rds-endpoint.region.rds.amazonaws.com
AWS_RDS_PORT=5432
AWS_RDS_DB_NAME=payload_app
AWS_RDS_USERNAME=payload_user
AWS_RDS_PASSWORD=strong_password
AWS_RDS_SSL_MODE=require
AWS_RDS_SSL_REJECT_UNAUTHORIZED=false
AWS_RDS_SCHEMA=public
```

## Recommended AWS RDS setup
1. Create an RDS PostgreSQL instance.
2. Create a dedicated database, for example `payload_app`.
3. Create a dedicated user, for example `payload_user`.
4. Allow inbound access from your app host security group or fixed server IP.
5. Keep SSL enabled.

## App-side environment
- Set `DATABASE_PROVIDER=postgres`
- Set either `DATABASE_URL` or the `AWS_RDS_*` variables
- Set `PAYLOAD_SECRET`
- Set `NEXT_PUBLIC_APP_URL`
- If you use Stripe webhook handling, also set `STRIPE_WEBHOOK_SECRET`

## Migration notes
- This repo currently uses local SQLite in development.
- Moving existing data from `payload.db` to PostgreSQL is a data migration task, not just a config switch.
- The application code is now ready to talk to PostgreSQL, but existing SQLite data must still be exported and imported separately.

## Validation
After filling env vars:

```bash
npm run build
pnpm tsc --noEmit
```

If deployment is using PostgreSQL, the backend should no longer depend on the local `payload.db` file for startup.
