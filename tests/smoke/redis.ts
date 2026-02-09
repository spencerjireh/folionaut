import Redis from 'ioredis'
import type { SmokeSuiteResult } from './types'
import { runTest, createSkippedResult } from './utils'

const TEST_KEY_PREFIX = 'smoke_test_'

/**
 * Runs Redis smoke tests against a real Redis instance.
 */
export async function testRedis(): Promise<SmokeSuiteResult> {
  const url = process.env.REDIS_URL
  if (!url) {
    return createSkippedResult('Redis', 'REDIS_URL not set')
  }

  // Detect cloud Redis for TLS
  const parsedUrl = new URL(url)
  const isCloudRedis =
    parsedUrl.hostname.includes('upstash.io') ||
    parsedUrl.hostname.includes('redis.cloud') ||
    parsedUrl.protocol === 'rediss:'

  const client = new Redis(url, {
    lazyConnect: true,
    tls: isCloudRedis ? {} : undefined,
    maxRetriesPerRequest: 1,
  })

  const results = []
  const testKey = `${TEST_KEY_PREFIX}${Date.now()}`

  try {
    // Test: Connection/ping
    results.push(
      await runTest('Connection/ping', async () => {
        await client.connect()
        const pong = await client.ping()
        if (pong !== 'PONG') {
          throw new Error(`Expected PONG, got ${pong}`)
        }
      })
    )

    // Test: Set/get round-trip
    results.push(
      await runTest('Set/get round-trip', async () => {
        const value = { test: 'data', timestamp: Date.now() }
        await client.set(testKey, JSON.stringify(value))
        const retrieved = await client.get(testKey)
        if (!retrieved) {
          throw new Error('Value not retrieved')
        }
        const parsed = JSON.parse(retrieved)
        if (parsed.test !== 'data') {
          throw new Error('Value mismatch')
        }
      })
    )

    // Test: TTL expiration
    results.push(
      await runTest('TTL expiration', async () => {
        const ttlKey = `${testKey}_ttl`
        await client.setex(ttlKey, 1, 'expires-soon')

        // Verify it exists
        const before = await client.get(ttlKey)
        if (!before) {
          throw new Error('TTL key not set')
        }

        // Wait for expiration
        await new Promise((resolve) => setTimeout(resolve, 1100))

        const after = await client.get(ttlKey)
        if (after !== null) {
          throw new Error('Key should have expired')
        }
      })
    )

    // Test: INCR operation
    results.push(
      await runTest('INCR operation', async () => {
        const incrKey = `${testKey}_incr`
        const first = await client.incr(incrKey)
        if (first !== 1) {
          throw new Error(`Expected 1, got ${first}`)
        }
        const second = await client.incr(incrKey)
        if (second !== 2) {
          throw new Error(`Expected 2, got ${second}`)
        }
        // Cleanup
        await client.del(incrKey)
      })
    )
  } finally {
    // Cleanup test keys
    const keys = await client.keys(`${TEST_KEY_PREFIX}*`)
    if (keys.length > 0) {
      await client.del(...keys)
    }
    await client.quit()
  }

  return {
    suite: 'Redis',
    results,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
  }
}
