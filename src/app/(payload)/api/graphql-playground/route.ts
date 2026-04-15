/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'

export const GET =
  process.env.NODE_ENV === 'production'
    ? async () =>
        Response.json(
          {
            message: 'GraphQL Playground is disabled in production.',
          },
          { status: 404 },
        )
    : GRAPHQL_PLAYGROUND_GET(config)
