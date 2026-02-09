---
title: API Reference
description: Complete API endpoint documentation
---

# API Reference

## Base URL

```
https://your-domain.com/api/v1
```

## Conventions

### Authentication

**Public endpoints** require no authentication:
- `GET /content/*` - Read content
- `POST /chat` - Send chat messages
- `GET /health/*` - Health checks

**Admin endpoints** require the `X-Admin-Key` header:

```bash
curl -H "X-Admin-Key: your-api-key" \
  https://your-domain.com/api/v1/admin/content
```

**Metrics endpoint** and **MCP over HTTP endpoint** also require admin authentication:

```bash
curl -H "X-Admin-Key: your-api-key" \
  https://your-domain.com/api/metrics

curl -X POST -H "X-Admin-Key: your-api-key" \
  -H "Content-Type: application/json" \
  https://your-domain.com/api/mcp
```

### Common Headers

#### Request Headers

| Header | Description | Required |
|--------|-------------|----------|
| `X-Admin-Key` | Admin API key | For admin endpoints, `/api/metrics`, and `/api/mcp` |
| `mcp-session-id` | MCP session identifier | For `/api/mcp` after initialization |
| `Content-Type` | `application/json` | For POST/PUT requests |
| `Idempotency-Key` | Unique request ID | Recommended for mutations |
| `If-None-Match` | ETag for caching | Optional for GET requests |

#### Response Headers

| Header | Description |
|--------|-------------|
| `X-Request-Id` | Unique request identifier |
| `ETag` | Entity tag for caching |
| `Cache-Control` | Caching directives |
| `X-RateLimit-Remaining` | Remaining rate limit tokens |
| `Retry-After` | Seconds to wait (when rate limited) |

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 304 | Not Modified (ETag match) |
| 400 | Validation Error |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate slug) |
| 429 | Rate Limited |
| 500 | Internal Server Error |
| 502 | Bad Gateway (LLM unavailable) |

### Rate Limiting

The chat endpoint uses token bucket rate limiting per IP:

- **Chat endpoint**: 5 tokens capacity (default), refills at 0.333 tokens/second (~1 per 3 seconds)
- Configurable via `RATE_LIMIT_CAPACITY` and `RATE_LIMIT_REFILL_RATE` env vars

When rate limited:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
```

### Pagination

List endpoints support pagination:

```
GET /api/v1/admin/content?limit=10&offset=20
```

| Parameter | Default | Max |
|-----------|---------|-----|
| `limit` | 50 | 100 |
| `offset` | 0 | - |

### Filtering

Content can be filtered by type and status:

```
GET /api/v1/content?type=project&status=published
```

### Caching

Content responses include ETag headers for efficient caching:

```bash
# First request
curl -i https://api.example.com/api/v1/content/bundle
# Returns: ETag: "abc123"

# Subsequent request
curl -H "If-None-Match: abc123" \
  https://api.example.com/api/v1/content/bundle
# Returns: 304 Not Modified (if unchanged)
```

---

## Endpoints Summary

### Content (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/content` | List content items |
| GET | `/api/v1/content/:type/:slug` | Get single content item |
| GET | `/api/v1/content/bundle` | Get all content in one request |

### Chat (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat` | Send chat message |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/live` | Liveness probe |
| GET | `/api/health/ready` | Readiness probe (checks DB) |
| GET | `/api/health/startup` | Startup probe (uptime, version, environment) |
| GET | `/api/metrics` | Prometheus metrics (requires `X-Admin-Key`) |

### Admin Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/content` | List all content (including drafts) |
| POST | `/api/v1/admin/content` | Create content |
| PUT | `/api/v1/admin/content/:id` | Update content |
| DELETE | `/api/v1/admin/content/:id` | Delete content |
| GET | `/api/v1/admin/content/:id/history` | Get version history |
| POST | `/api/v1/admin/content/:id/restore` | Restore to previous version |

### Admin Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/chat/sessions` | List chat sessions |
| GET | `/api/v1/admin/chat/sessions/:id` | Get session with messages |
| DELETE | `/api/v1/admin/chat/sessions/:id` | End/delete session |

### MCP over HTTP

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mcp` | MCP JSON-RPC requests (initialize, tool calls) |
| GET | `/api/mcp` | SSE stream for server-initiated notifications |
| DELETE | `/api/mcp` | Terminate MCP session |

---

## Content Endpoints

### GET /content

List content items with optional filtering.

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | - | Filter by content type (`project`, `experience`, `education`, `skill`, `about`, `contact`) |
| `status` | string | `published` | Filter by status (`draft`, `published`, `archived`) |

**Response**

```json
[
  {
    "id": "content_abc123",
    "type": "project",
    "slug": "my-project",
    "data": {
      "title": "My Project",
      "description": "A great project"
    },
    "status": "published",
    "version": 1,
    "sortOrder": 0,
    "createdAt": "2025-01-25T10:00:00Z",
    "updatedAt": "2025-01-25T10:00:00Z"
  }
]
```

### GET /content/:type/:slug

Get a single content item by type and slug.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Content type (`project`, `experience`, `education`, `skill`, `about`, `contact`) |
| `slug` | string | URL-friendly identifier |

**Response**

```json
{
  "id": "content_abc123",
  "type": "project",
  "slug": "my-project",
  "data": {
    "title": "My Project",
    "description": "A great project",
    "content": "## Overview\n\nThis project...",
    "tags": ["typescript", "express"],
    "featured": true
  },
  "status": "published",
  "version": 3,
  "sortOrder": 1,
  "createdAt": "2025-01-25T10:00:00Z",
  "updatedAt": "2025-01-26T15:30:00Z"
}
```

### GET /content/bundle

Get all published content organized by type. See [Content Model - Content Bundle](/architecture/content-model#content-bundle) for the full type definition.

**Response**

```json
{
  "projects": [...],
  "experiences": [...],
  "education": [...],
  "skills": [...],
  "about": { "id": "...", "type": "about", "slug": "about", "data": {...}, ... },
  "contact": { "id": "...", "type": "contact", "slug": "contact", "data": {...}, ... }
}
```

::: tip
`about` and `contact` are singleton items (or `null` if not published). All other fields are arrays.
:::

---

## Chat Endpoints

### POST /chat

Send a chat message and receive an AI response. The chat service includes input/output guardrails for content safety and PII protection.

**Request Body**

```json
{
  "message": "Tell me about your TypeScript experience",
  "visitorId": "visitor-unique-id"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | User message (1-2000 chars) |
| `visitorId` | string | Yes | Client-generated visitor identifier (1-100 chars) |

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeToolCalls` | boolean | `false` | Include tool call details in response |

**Response**

```json
{
  "sessionId": "sess_abc123",
  "message": {
    "id": "msg_xyz789",
    "role": "assistant",
    "content": "I have extensive experience with TypeScript...",
    "createdAt": "2025-01-25T10:00:00Z"
  },
  "tokensUsed": 150,
  "toolCalls": []
}
```

::: tip
The `toolCalls` field is only included when `includeToolCalls=true` is passed as a query parameter.
:::

**Error Responses**

- `429 Too Many Requests` - Rate limited
- `502 Bad Gateway` - LLM service unavailable

---

## Admin Endpoints

All admin endpoints require the `X-Admin-Key` header.

### POST /admin/content

Create new content.

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `X-Admin-Key` | Yes | Admin API key |
| `Idempotency-Key` | Recommended | Unique request ID |

**Request Body**

```json
{
  "type": "project",
  "slug": "new-project",
  "data": {
    "title": "New Project",
    "description": "An exciting new project",
    "tags": ["typescript"],
    "featured": false
  },
  "status": "draft",
  "sortOrder": 0
}
```

**Response** (201 Created)

```json
{
  "id": "content_new123",
  "type": "project",
  "slug": "new-project",
  "data": {...},
  "status": "draft",
  "version": 1,
  "sortOrder": 0,
  "createdAt": "2025-01-26T10:00:00Z",
  "updatedAt": "2025-01-26T10:00:00Z"
}
```

### PUT /admin/content/:id

Update existing content.

**Request Body**

```json
{
  "data": {
    "title": "Updated Title",
    "description": "Updated description"
  },
  "status": "published"
}
```

**Response**

Returns the updated content item with incremented version.

### DELETE /admin/content/:id

Delete a content item.

**Query Parameters**
- `hard`: Set to `true` for permanent deletion (default: soft delete)

### GET /admin/content/:id/history

Get version history for a content item.

**Response**

```json
[
  {
    "id": "history_xyz789",
    "contentId": "content_abc123",
    "version": 3,
    "data": {...},
    "changeType": "updated",
    "changedBy": "admin",
    "changeSummary": "Updated title, description",
    "createdAt": "2025-01-26T15:30:00Z"
  }
]
```

### POST /admin/content/:id/restore

Restore content to a previous version.

**Request Body**

```json
{
  "version": 2
}
```

**Response**

Returns the content item with the restored data and a new version number.

---

## Health Endpoints

### GET /health/live

Liveness probe for container orchestration. Returns `{ "status": "ok" }`.

### GET /health/ready

Readiness probe. Checks database connectivity.

**Response**

```json
{
  "status": "ready",
  "checks": {
    "database": "ok"
  }
}
```

When degraded (503):

```json
{
  "status": "degraded",
  "checks": {
    "database": "error"
  }
}
```

### GET /health/startup

Startup probe. Returns service information.

**Response**

```json
{
  "status": "started",
  "uptime": 12345,
  "version": "1.0.0",
  "environment": "production"
}
```

### GET /metrics

Prometheus metrics endpoint. **Requires `X-Admin-Key` header.**

---

## MCP over HTTP Endpoint

The MCP server is available over Streamable HTTP at `/api/mcp`, protected by admin authentication. This endpoint implements the [Model Context Protocol](https://modelcontextprotocol.io/) over HTTP, enabling remote MCP clients to access portfolio tools, resources, and prompts.

All three methods require the `X-Admin-Key` header. Sessions are stateful -- after initialization, include the `mcp-session-id` header returned by the server.

### POST /api/mcp

Send JSON-RPC requests to the MCP server. The first request must be an `initialize` request (no session ID). Subsequent requests must include the `mcp-session-id` header.

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `X-Admin-Key` | Yes | Admin API key |
| `Content-Type` | Yes | `application/json` |
| `mcp-session-id` | After init | Session ID from initialization response |

**Request Body** (initialize example)

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-03-26",
    "capabilities": {},
    "clientInfo": { "name": "my-client", "version": "1.0.0" }
  }
}
```

**Response** includes an `mcp-session-id` header and the JSON-RPC response body.

### GET /api/mcp

Open an SSE (Server-Sent Events) stream for server-initiated notifications. Requires a valid `mcp-session-id` header.

### DELETE /api/mcp

Terminate an MCP session and clean up server-side resources. Requires a valid `mcp-session-id` header.

For full details on available MCP tools, resources, and prompts, see the [MCP Server integration guide](/integrations/mcp-server).

---

## Data Schemas

### ContentRow

```typescript
interface ContentRow {
  id: string
  type: 'project' | 'experience' | 'education' | 'skill' | 'about' | 'contact'
  slug: string
  data: Record<string, unknown>
  status: 'draft' | 'published' | 'archived'
  version: number
  sortOrder: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}
```

See [Content Model Reference](/architecture/content-model) for detailed type-specific data schemas.

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
  error: string
  code: string
  requestId: string
  fields?: Record<string, string[]>  // For validation errors
  retryAfter?: number                // For rate limit errors
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request body or parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid admin key |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Duplicate slug or version conflict |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `LLM_ERROR` | 502 | LLM provider unavailable |
