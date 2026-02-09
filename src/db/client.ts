import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { env } from '@/config/env'
import * as schema from './schema'

export const client: Client = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
})

export const db: LibSQLDatabase<typeof schema> = drizzle(client, { schema })

export type Database = typeof db
