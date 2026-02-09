import request from 'supertest'
import type { Express } from 'express'
import { sql } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import type * as schema from '@/db/schema'
import { E2E_BASE_URL, ADMIN_API_KEY, IS_DEPLOYED, IS_LOCAL_SERVER } from './constants'

let appInstance: Express | null = null
let dbInstance: LibSQLDatabase<typeof schema> | null = null
let localServerUrl: string | null = null

export function setApp(app: Express): void {
  appInstance = app
}

export function setDb(db: LibSQLDatabase<typeof schema>): void {
  dbInstance = db
}

export function setLocalServerUrl(url: string): void {
  localServerUrl = url
}

/**
 * Returns a supertest agent targeting either the in-process app, a local HTTP server, or a deployed URL.
 */
export function api(): request.SuperTest<request.Test> {
  if (IS_DEPLOYED) {
    return request(E2E_BASE_URL) as unknown as request.SuperTest<request.Test>
  }
  if (IS_LOCAL_SERVER && localServerUrl) {
    return request(localServerUrl) as unknown as request.SuperTest<request.Test>
  }
  if (!appInstance) {
    throw new Error('App not initialized. Call setApp() in e2e-setup.ts first.')
  }
  return request(appInstance) as unknown as request.SuperTest<request.Test>
}

/**
 * Returns headers with admin authentication.
 */
export function adminHeaders(): Record<string, string> {
  return { 'X-Admin-Key': ADMIN_API_KEY }
}

/**
 * Truncates all 4 tables in FK order for test isolation. Local only.
 */
export async function truncateAll(): Promise<void> {
  if (IS_DEPLOYED || !dbInstance) return

  await dbInstance.run(sql`DELETE FROM chat_messages`)
  await dbInstance.run(sql`DELETE FROM chat_sessions`)
  await dbInstance.run(sql`DELETE FROM content_history`)
  await dbInstance.run(sql`DELETE FROM content`)
}

/**
 * Helpers for conditionally running tests based on environment.
 */
export const describeLocal = IS_DEPLOYED ? describe.skip : describe
export const describeDeployed = IS_DEPLOYED ? describe : describe.skip
