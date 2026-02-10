---
title: API Conventions
description: Authentication, headers, status codes, rate limiting, pagination, filtering, and caching
---

# API Conventions

## Base URL

```
https://your-domain.com/api/v1
```

## Authentication

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

## Common Headers

### Request Headers

| Header | Description | Required |
|--------|-------------|----------|
| `X-Admin-Key` | Admin API key | For admin endpoints, `/api/metrics`, and `/api/mcp` |
| `mcp-session-id` | MCP session identifier | For `/api/mcp` after initialization |
| `Content-Type` | `application/json` | For POST/PUT requests |
| `Idempotency-Key` | Unique request ID | Recommended for mutations |
| `If-None-Match` | ETag for caching | Optional for GET requests |

### Response Headers

| Header | Description |
|--------|-------------|
| `X-Request-Id` | Unique request identifier |
| `ETag` | Entity tag for caching |
| `Cache-Control` | Caching directives |
| `Retry-After` | Seconds to wait (when rate limited) |

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 304 | Not Modified (ETag match) |
| 400 | Validation Error |
| 401 | Unauthorized |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate slug) |
| 413 | Payload Too Large (body exceeds 100kb) |
| 429 | Rate Limited |
| 500 | Internal Server Error |
| 502 | Bad Gateway (LLM unavailable) |
| 504 | Request Timeout |

## Rate Limiting

Token bucket rate limiting is applied per IP:

- **Chat endpoint**: 5 tokens capacity (default), refills at 0.333 tokens/second (~1 per 3 seconds). Configurable via `RATE_LIMIT_CAPACITY` and `RATE_LIMIT_REFILL_RATE` env vars.
- **Content endpoints**: 60 tokens capacity (default), refills at 10 tokens/second. Configurable via `CONTENT_RATE_LIMIT_CAPACITY` and `CONTENT_RATE_LIMIT_REFILL_RATE` env vars.

When rate limited:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
```

## Pagination

List endpoints support pagination:

```
GET /api/v1/admin/content?limit=10&offset=20
```

| Parameter | Default | Max |
|-----------|---------|-----|
| `limit` | 50 | 100 |
| `offset` | 0 | - |

## Filtering

Content can be filtered by type:

```
GET /api/v1/content?type=project
```

## Caching

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

## See Also

- [Schemas & Error Codes](/api/schemas) - Response schemas and error code reference
- [Configuration](/guide/configuration) - Environment variables for rate limits and other settings
