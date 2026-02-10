---
title: Schemas & Errors
description: Data schemas, response formats, and error codes
---

# Schemas & Errors

## Data Schemas

### ContentRow

```typescript
interface ContentRow {
  id: string
  type: string              // Free-form string matching /^[a-z0-9-]+$/ (max 100 chars)
  slug: string
  data: Record<string, unknown>  // Any JSON object
  status: 'draft' | 'published' | 'archived'
  version: number
  sortOrder: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
```

See [Content Model Reference](/architecture/content-model) for details on the data column and custom content types.

### ChatResponse

```typescript
interface ChatResponse {
  sessionId: string
  message: {
    id: string
    role: 'assistant'
    content: string
    createdAt: string
  }
  tokensUsed: number
  toolCalls?: Array<{
    id: string
    name: string
    arguments: Record<string, unknown>
    result: string
  }>
}
```

### Error

```typescript
interface ErrorResponse {
  error: {
    code: string
    message: string
    requestId?: string
    fields?: Record<string, string[]>   // For validation errors
    retryAfter?: number                 // For rate limit errors
    stack?: string                      // Development only
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request body or parameters |
| `BAD_REQUEST` | 400 | Malformed JSON or invalid request syntax |
| `UNAUTHORIZED` | 401 | Missing or invalid admin key |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate slug or version conflict |
| `PAYLOAD_TOO_LARGE` | 413 | Request body exceeds 100kb limit |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
| `LLM_ERROR` | 502 | LLM provider unavailable |

## See Also

- [Content Model](/architecture/content-model) - Data column structure and custom types
- [Low-Level Design](/architecture/low-level-design) - Error handling architecture
- [Conventions](/api/conventions) - HTTP status codes and headers
