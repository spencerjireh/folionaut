---
title: "ADR-001: Database Choice"
description: Turso (libSQL) as the primary database
---

# ADR 001: Database Choice - Turso (libSQL)

## Status

<Badge type="tip" text="Accepted" />

## Context

Folionaut needs a database solution that:
- Has minimal operational overhead for a solo developer
- Works well for single-instance deployment initially
- Supports potential edge deployment scenarios
- Has low latency for read-heavy workloads
- Is cost-effective for a portfolio project

The application has relatively simple data requirements:
- Content storage (projects, experience, education, skills, about, contact)
- Chat session and message storage
- Content versioning/history

Expected scale:
- Hundreds of content items
- Tens of chat sessions per day
- Single-digit concurrent users

## Decision

Use **Turso** (hosted libSQL/SQLite) as the primary database with **Drizzle ORM** for type-safe database access.

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **PostgreSQL (Supabase/Neon)** | Full-featured, industry standard, great ecosystem | Requires managed service or self-hosting, higher cost, more complex |
| **PlanetScale** | MySQL-compatible, serverless, branching | Higher cost for hobby tier, MySQL limitations, no foreign keys in serverless |
| **SQLite (local file)** | Zero config, fastest reads | No replication, harder to scale, backup complexity |
| **MongoDB Atlas** | Flexible schema, good free tier | Overkill for structured data, eventual consistency concerns |
| **Turso (libSQL)** | SQLite semantics, edge replication, generous free tier, embedded replicas | Newer service, smaller ecosystem than PostgreSQL |

## Consequences

### Positive

- **Zero cold start latency**: SQLite-based, always warm
- **Edge replication**: Can deploy read replicas close to users
- **Embedded replicas**: Can use local SQLite for reads, sync with remote
- **Familiar SQL**: Standard SQLite syntax, easy to debug
- **Cost effective**: Generous free tier (9GB storage, 500M row reads/month)
- **Drizzle ORM**: Excellent TypeScript support, type-safe queries
- **Simple operations**: No connection pooling concerns at this scale

### Negative

- **Vendor lock-in**: Turso-specific features (embedded replicas) not portable
- **Smaller ecosystem**: Less community resources than PostgreSQL
- **Limited JSON operators**: No native JSON path queries in WHERE clauses
- **Single write region**: Writes must go to primary (acceptable for this use case)

### Mitigations

- **Repository pattern**: Abstract database access to allow migration if needed
- **Standard SQL**: Stick to ANSI SQL where possible
- **JSON in application**: Handle JSON filtering in application code rather than complex DB queries
- **Drizzle abstraction**: ORM provides some portability between SQLite dialects

## Implementation Notes

```typescript
// Connection setup
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN
})

export const db = drizzle(client)
```

## References

- [Turso Documentation](https://docs.turso.tech/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [libSQL Project](https://libsql.org/)
