/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'
import { isGraphQLPlaygroundEnabled } from '@/lib/requestSecurity'

export const GET =
  isGraphQLPlaygroundEnabled()
    ? GRAPHQL_PLAYGROUND_GET(config)
    : async () =>
        Response.json(
          {
            message: 'GraphQL Playground is disabled.',
          },
          { status: 404 },
        )
