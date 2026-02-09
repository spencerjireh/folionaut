---
title: Low-Level Design
description: Component design, class diagrams, and sequence diagrams
---

# Low-Level Design (LLD)

**Version**: 1.0.0
**Last Updated**: 2025-01-25
**Status**: Approved

## Component Design

### C4 Level 3: Component Diagram

```mermaid
flowchart TB
    subgraph Routes["ROUTES LAYER"]
        R1["v1/content<br/>GET /, GET /:type/:slug, GET /bundle"]
        R2["v1/chat<br/>POST /"]
        R3["v1/admin/*<br/>GET, POST, PUT, DELETE"]
        R4["health/*<br/>GET /live, /ready, /startup"]
        R5["mcp/http<br/>POST, GET, DELETE /api/mcp"]
    end

    subgraph Services["SERVICES LAYER"]
        S1["ContentService<br/>getAll, getBySlug, getBundle<br/>create, update, delete, getHistory"]
        S2["ChatService<br/>processMessage<br/>getOrCreateSession, endSession"]
    end

    subgraph Repos["REPOSITORIES LAYER"]
        Repo1["ContentRepository<br/>findById, findBySlug, findAll<br/>create, update, delete, search"]
        Repo2["ChatRepository<br/>createSession, findSession<br/>updateActivity, addMessage"]
    end

    subgraph Infra["INFRASTRUCTURE LAYER"]
        I1["Cache Provider<br/>Memory / Redis"]
        I2["Circuit Breaker<br/>closed/open/half_open"]
        I3["Rate Limiter<br/>Token Bucket"]
        I4["Event Bus<br/>Typed Emitter"]
        I5["LLM Provider<br/>OpenAI-compatible"]
        I6["Guardrails<br/>PII Detection & Sanitization"]
        I7["Job Scheduler<br/>Background Tasks"]
        I8["Request Context<br/>AsyncLocalStorage"]
    end

    R1 --> S1
    R2 --> S2
    R3 --> S1
    R5 --> Repo1

    S1 --> Repo1
    S2 --> Repo2
    S2 --> I5
    S2 --> I6
```

### Shared Tools Layer

The tools layer provides unified tool implementations used by both MCP and Chat:

```mermaid
flowchart TB
    subgraph Tools["src/tools/"]
        Types["types.ts<br/>ToolResult&lt;T&gt;, ContentItem types"]
        subgraph Core["core/"]
            List["list-content<br/>listContent()"]
            Get["get-content<br/>getContent()"]
            Search["search-content<br/>searchContent()"]
        end
        Adapter["openai-adapter.ts<br/>chatToolDefinitions, executeToolCall()"]
    end

    MCP["MCP Server<br/>(MCP SDK)<br/>MCP response format"]
    Chat["Chat Service<br/>(OpenAI API)<br/>JSON response format"]

    Core --> MCP
    Core --> Chat
    Adapter --> Chat

    MCP --> Repo["Content Repository"]
    Chat --> Repo
    Repo --> DB[(Turso DB)]
```

**Key components:**

| File | Purpose |
|------|---------|
| `types.ts` | Shared types: `ToolResult<T>`, `ContentItem`, result types |
| `core/list-content.ts` | `listContent()` - List content by type with filters |
| `core/get-content.ts` | `getContent()` - Get single item by type and slug |
| `core/search-content.ts` | `searchContent()` - Search content by keywords |
| `openai-adapter.ts` | `chatToolDefinitions` (JSON Schema), `executeToolCall()` |

**Schema conversion:**

```typescript
// Zod schema in src/mcp/types.ts
export const ListContentInputSchema = z.object({
  type: z.enum(['project', 'experience', 'education', 'skill', 'about', 'contact']),
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  limit: z.number().int().min(1).max(100).default(50),
})

// Converted to JSON Schema for OpenAI via zod-to-json-schema
import { zodToJsonSchema } from 'zod-to-json-schema'
const jsonSchema = zodToJsonSchema(ListContentInputSchema)
```

## Class Diagrams

### Repository Interfaces

```mermaid
classDiagram
    class Repository~T~ {
        <<interface>>
        +findById(id) T
        +findAll(filters) T[]
        +create(data) T
        +update(id, data) T
        +delete(id) void
        +count(filters) number
    }

    class ContentRepository {
        <<interface>>
        +findBySlug(type, slug) Content
        +search(query) Content[]
        +getBundle() Bundle
        +getHistory(id) History[]
        +restoreVersion(id, version) Content
    }

    class ChatRepository {
        <<interface>>
        +createSession(data) Session
        +findSession(id) Session
        +updateActivity(id) void
        +addMessage(sessionId, msg) Message
        +getMessages(sessionId) Message[]
    }

    class DrizzleContentRepo {
        -db: DrizzleClient
        +findById()
        +findBySlug()
        +create()
        +update()
    }

    class DrizzleChatRepo {
        -db: DrizzleClient
        +createSession()
        +findSession()
        +addMessage()
        +getStats()
    }

    Repository <|-- ContentRepository
    Repository <|-- ChatRepository
    ContentRepository <|.. DrizzleContentRepo
    ChatRepository <|.. DrizzleChatRepo
```

### Cache Provider Pattern

```mermaid
classDiagram
    class CacheProvider {
        <<interface>>
        +get~T~(key) T
        +set(key, val, ttl) void
        +del(key) void
        +incr(key, ttl) number
        +decr(key) number
        +getTokenBucket(key) Bucket
        +setTokenBucket(key, bucket) void
        +ping() boolean
        +close() void
    }

    class MemoryCacheProvider {
        -store: Map
        -cleanupInterval: Timer
        +get~T~()
        +set()
        +cleanup()
    }

    class RedisCacheProvider {
        -client: Redis
        -isConnected: boolean
        +get~T~()
        +set()
        +hgetall()
    }

    class CacheFactory {
        -instance: Cache
        +getCache() CacheProvider
        +closeCache() void
    }

    CacheProvider <|.. MemoryCacheProvider
    CacheProvider <|.. RedisCacheProvider
    CacheFactory --> CacheProvider : creates
```

### Error Class Hierarchy

```mermaid
classDiagram
    class Error {
        +message: string
        +stack: string
    }

    class AppError {
        +message: string
        +code: string
        +statusCode: number
        +isOperational: boolean
    }

    class ValidationError {
        +fields: Record
        code = 400
    }

    class NotFoundError {
        code = 404
    }

    class RateLimitError {
        +retryAfter: number
        code = 429
    }

    class LLMError {
        +provider: string
        code = 502
    }

    class UnauthorizedError {
        code = 401
    }

    Error <|-- AppError
    AppError <|-- ValidationError
    AppError <|-- NotFoundError
    AppError <|-- RateLimitError
    AppError <|-- LLMError
    AppError <|-- UnauthorizedError
```

### Event System

```mermaid
flowchart TB
    subgraph EventMap["EventMap (TypeScript interface)"]
        E1["content:created -> {id, type, slug, version}"]
        E2["content:updated -> {id, type, version, previousVersion}"]
        E3["content:deleted -> {id, type, hard}"]
        E4["content:restored -> {id, type, fromVersion, toVersion}"]
        E5["chat:session_started -> {sessionId, visitorId, ipHash}"]
        E6["chat:message_sent -> {sessionId, messageId, role, tokensUsed}"]
        E7["chat:session_ended -> {sessionId, messageCount, totalTokens}"]
        E8["chat:rate_limited -> {ipHash, sessionId}"]
        E9["circuit:state_changed -> {name, previousState, newState}"]
        E10["cache:invalidated -> {pattern, reason}"]
        E11["admin:action -> {action, resourceType, resourceId}"]
    end

    EventMap --> Emitter["TypedEventEmitter<br/>emit&lt;K&gt;(event, data)<br/>on&lt;K&gt;(event, handler)<br/>off&lt;K&gt;(event, handler)"]

    Emitter --> Handlers["Event Handlers<br/>- Metrics tracking<br/>- Cache invalidation<br/>- Audit logging<br/>- (Future: Webhooks)"]
```

## Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    content {
        TEXT id PK
        TEXT type
        TEXT slug
        JSON data
        TEXT status
        INTEGER version
        INTEGER sort_order
        TIMESTAMP created_at
        TIMESTAMP updated_at
        TIMESTAMP deleted_at
    }

    content_history {
        TEXT id PK
        TEXT content_id FK
        INTEGER version
        JSON data
        TEXT change_type
        TEXT changed_by
        TEXT change_summary
        TIMESTAMP created_at
    }

    chat_sessions {
        TEXT id PK
        TEXT visitor_id
        TEXT ip_hash
        TEXT user_agent
        INTEGER message_count
        TEXT status
        TIMESTAMP started_at
        TIMESTAMP last_active_at
        TIMESTAMP expires_at
    }

    chat_messages {
        TEXT id PK
        TEXT session_id FK
        TEXT role
        TEXT content
        INTEGER tokens_used
        TEXT model
        TIMESTAMP created_at
    }

    content ||--o{ content_history : "has history"
    chat_sessions ||--o{ chat_messages : "contains"
```

## Sequence Diagrams

### Content Bundle Request (Cache Hit)

```mermaid
sequenceDiagram
    participant Client
    participant Route
    participant Service
    participant Cache

    Client->>Route: GET /api/v1/content/bundle<br/>If-None-Match: "x"
    Route->>Service: getBundle()
    Service->>Cache: get("content:bundle")
    Cache-->>Service: cached data
    Service-->>Route: bundle data
    Route->>Route: generateETag()<br/>compare with If-None-Match
    Route-->>Client: 304 Not Modified
```

### Chat Message Flow (Full)

```mermaid
sequenceDiagram
    participant Client
    participant Route
    participant RateLim as Rate Limiter
    participant ChatSvc as Chat Service
    participant Guards as Guardrails
    participant Circuit
    participant LLM

    Client->>Route: POST /chat {message}
    Route->>RateLim: consume(ip)
    RateLim-->>Route: {allowed: true}
    Route->>ChatSvc: processMsg()
    ChatSvc->>Guards: validateInput()
    Guards-->>ChatSvc: passed
    ChatSvc->>Circuit: execute()
    Circuit->>Circuit: isAvailable()
    Circuit->>LLM: chat()
    LLM-->>Circuit: response
    Circuit->>Circuit: recordSuccess()
    Circuit-->>ChatSvc: response
    ChatSvc->>Guards: validateOutput()
    Guards-->>ChatSvc: sanitized response
    ChatSvc->>ChatSvc: emit events (async)
    ChatSvc-->>Route: response
    Route-->>Client: 200 OK {sessionId, message}
```

### Content Versioning Transaction Flow

```mermaid
sequenceDiagram
    participant Admin as Admin Client
    participant Route
    participant Service
    participant Repo
    participant DB as DB (Turso)

    Admin->>Route: PUT /admin/content/:id<br/>+ Idempotency-Key
    Route->>Route: check idempotency
    Route->>Service: update()
    Service->>Repo: updateWithHistory()

    Repo->>DB: BEGIN TRANSACTION
    Repo->>DB: 1. SELECT current content
    DB-->>Repo: current row
    Repo->>DB: 2. INSERT INTO content_history
    Repo->>DB: 3. UPDATE content SET data, version++
    Repo->>DB: COMMIT

    Repo-->>Service: updated row
    Service->>Service: emit('content:updated')
    Service-->>Route: updated row
    Route->>Route: cache idempotency response
    Route-->>Admin: 200 OK {content}

    Note over Service: Event Handlers (Async)
    Service-->>Service: Cache Invalidate
    Service-->>Service: Metrics Update
    Service-->>Service: Audit Log
```

**Transaction Details:**

```typescript
// src/repositories/content.repository.ts
async updateWithHistory(
  id: string,
  updates: Partial<ContentUpdate>,
  changedBy?: string
): Promise<Content> {
  return this.db.transaction(async (tx) => {
    // 1. Read current state
    const [current] = await tx
      .select()
      .from(content)
      .where(eq(content.id, id))

    if (!current) {
      throw new NotFoundError('Content', id)
    }

    // 2. Archive current version to history
    await tx.insert(contentHistory).values({
      id: generateId(),
      contentId: id,
      version: current.version,
      data: current.data,
      changeType: 'update',
      changedBy,
      changeSummary: this.summarizeChanges(current.data, updates.data),
      createdAt: new Date(),
    })

    // 3. Update content with new version
    const [updated] = await tx
      .update(content)
      .set({
        ...updates,
        version: current.version + 1,
        updatedAt: new Date(),
      })
      .where(eq(content.id, id))
      .returning()

    return updated
  })
}
```

### Content Restore Flow

```mermaid
sequenceDiagram
    participant Admin as Admin Client
    participant Service
    participant Repo
    participant DB

    Admin->>Service: POST /content/:id/restore<br/>{version: 3}

    Service->>Repo: 1. Get target version from history
    Repo->>DB: SELECT * FROM content_history
    DB-->>Repo: history row
    Repo-->>Service: history data

    Service->>Repo: 2. Call updateWithHistory()<br/>using history.data
    Repo->>DB: [transaction]<br/>- archive current<br/>- restore old data<br/>- version++
    DB-->>Repo: updated row
    Repo-->>Service: restored content

    Service-->>Admin: 200 OK {restored}

    Note over Admin,DB: Version Timeline
    Note over Admin,DB: v1 -> v2 -> v3 -> v4(current) -> v5(after restore)<br/>Data copied from v3 to v5
```

### Circuit Breaker State Transitions

```mermaid
stateDiagram-v2
    [*] --> CLOSED

    CLOSED --> OPEN : failures >= threshold
    note right of CLOSED
        - Allow all calls
        - Count failures
    end note

    OPEN --> HALF_OPEN : timeout elapsed
    note right of OPEN
        - Reject all calls
        - Return error
        - Start timer
    end note

    HALF_OPEN --> CLOSED : success >= threshold
    HALF_OPEN --> OPEN : any failure
    note right of HALF_OPEN
        - Allow limited calls
        - Test if healthy
    end note
```

**Configuration:**
- `failureThreshold`: 5 (failures before opening)
- `resetTimeout`: 30000ms (time before trying half-open)
- `halfOpenMaxAttempts`: 2 (successes needed to close)

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: string           // Human-readable message
  code: string            // Machine-readable code
  requestId: string       // For tracing
  fields?: Record<string, string[]>  // Validation errors
  retryAfter?: number     // For rate limiting
  stack?: string          // Dev mode only
}
```

### HTTP Status Code Mapping

| Status | Code | Scenario |
|--------|------|----------|
| 400 | VALIDATION_ERROR | Invalid request body/params |
| 401 | UNAUTHORIZED | Missing/invalid admin key |
| 404 | NOT_FOUND | Resource doesn't exist |
| 409 | CONFLICT | Duplicate slug |
| 429 | RATE_LIMITED | Token bucket empty |
| 500 | INTERNAL_ERROR | Unexpected server error |
| 502 | LLM_ERROR | LLM provider failure |

### Error Class Implementation

```typescript
// src/errors/app-error.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly isOperational: boolean = true,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

// Specialized error classes
export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400, true, { fields })
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string) {
    super(
      `${resource} not found: ${identifier}`,
      'NOT_FOUND',
      404
    )
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Invalid or missing authentication') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class RateLimitError extends AppError {
  constructor(public readonly retryAfter: number) {
    super(
      'Rate limit exceeded',
      'RATE_LIMITED',
      429,
      true,
      { retryAfter }
    )
  }
}

export class ConflictError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 'CONFLICT', 409, true, field ? { field } : undefined)
  }
}

export class LLMError extends AppError {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly originalError?: Error
  ) {
    super(message, 'LLM_ERROR', 502, true, { provider })
  }
}
```

### Throwing Errors in Services

```typescript
// src/services/content.service.ts
export class ContentService {
  async getBySlug(type: string, slug: string): Promise<Content> {
    const content = await this.repository.findBySlug(type, slug)

    if (!content) {
      throw new NotFoundError('Content', `${type}/${slug}`)
    }

    if (content.status !== 'published') {
      throw new NotFoundError('Content', `${type}/${slug}`)
    }

    return content
  }

  async create(data: CreateContentInput): Promise<Content> {
    // Check for duplicate slug
    if (data.slug) {
      const existing = await this.repository.findBySlug(data.type, data.slug)
      if (existing) {
        throw new ConflictError(
          `Content with slug '${data.slug}' already exists`,
          'slug'
        )
      }
    }

    return this.repository.create(data)
  }
}

// src/services/chat.service.ts
export class ChatService {
  async processMessage(input: ChatInput): Promise<ChatResponse> {
    // Rate limit check happens in middleware, but we double-check here
    const allowed = await this.rateLimiter.consume(input.ipHash, 1)
    if (!allowed.allowed) {
      throw new RateLimitError(allowed.retryAfter)
    }

    try {
      const response = await this.circuitBreaker.execute(() =>
        this.llmProvider.chat(messages, options)
      )
      return response
    } catch (error) {
      if (error instanceof CircuitBreakerOpenError) {
        throw new LLMError(
          'AI service temporarily unavailable',
          this.llmProvider.name
        )
      }
      throw error
    }
  }
}
```

See [API Reference - Error Codes](/api/reference#error-codes) for error response examples and the full status code mapping.

## Testing Strategy

### Test Pyramid

```mermaid
flowchart TB
    subgraph Pyramid["Test Pyramid"]
        E2E["E2E Tests<br/>Few, slow, high confidence<br/>(~5% of tests)"]
        Integration["Integration Tests<br/>Some, moderate speed<br/>(~25% of tests)"]
        Unit["Unit Tests<br/>Many, fast, isolated<br/>(~70% of tests)"]
    end

    E2E --> Integration
    Integration --> Unit
```

### Coverage Targets

| Metric | Target | Rationale |
|--------|--------|-----------|
| Line Coverage | 80% | Balance between confidence and maintenance |
| Branch Coverage | 75% | Ensure error paths are tested |
| Critical Paths | 100% | Auth, rate limiting, data mutations |
| Infrastructure | 60% | Harder to test, rely on integration tests |

### Test Categories

| Category | Directory | Focus | Tools |
|----------|-----------|-------|-------|
| Unit | `tests/unit/` | Functions, classes in isolation | Jest (ts-jest ESM), mocks |
| Integration | `tests/integration/` | API endpoints, DB operations | Supertest, in-memory SQLite |
| E2E | `tests/e2e/` | Full HTTP and MCP flows | Supertest, in-memory SQLite |

### Database Testing Strategy

```mermaid
flowchart LR
    subgraph Unit["Unit Tests"]
        MockedRepos["Mocked Repos<br/>No real DB<br/>Fast, isolated"]
    end

    subgraph Integration["Integration Tests"]
        InMemory["In-Memory SQLite<br/>libsql :memory:<br/>Real SQL, fast"]
    end

    subgraph E2E["E2E Tests"]
        TestDB["In-Memory SQLite<br/>Full app boot<br/>Separate jest config"]
    end
```

> See `tests/` directory for implementation examples including mocks, fixtures, and test utilities.

## Appendix

### File Naming Conventions

Files use dot-separated naming to indicate their layer:

| Type | Pattern | Example |
|------|---------|---------|
| Routes | `{resource}.routes.ts` | `content.routes.ts`, `chat.routes.ts` |
| Services | `{name}.service.ts` | `chat.service.ts`, `content.service.ts` |
| Repositories | `{entity}.repository.ts` | `content.repository.ts`, `chat.repository.ts` |
| Middleware | `{name}.middleware.ts` | `admin-auth.middleware.ts`, `idempotency.middleware.ts` |
| Types | `{name}.types.ts` | `chat.types.ts`, `content.types.ts` |
| Schemas | `{name}.schemas.ts` | `content.schemas.ts`, `chat.schemas.ts` |
| Tests | `{name}.test.ts` | `rate-limiter.test.ts`, `chat.service.test.ts` |

### Code Style

- Use `async/await` over Promise chains
- Prefer `const` over `let`
- Use explicit return types on public functions
- Use `unknown` over `any` where possible
- Document public APIs with JSDoc comments
