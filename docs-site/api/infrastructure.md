---
title: Infrastructure Endpoints
description: Health probes, Prometheus metrics, and MCP over HTTP
---

# Infrastructure Endpoints

Health checks, metrics, and the MCP HTTP transport.

## Health Probes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/live` | Liveness probe |
| GET | `/api/health/ready` | Readiness probe (checks DB) |
| GET | `/api/health/startup` | Startup probe (uptime, version, environment) |

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

## Metrics

### GET /metrics

Prometheus metrics endpoint. **Requires `X-Admin-Key` header.**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics` | Prometheus metrics (requires `X-Admin-Key`) |

## MCP over HTTP

The MCP server is available over Streamable HTTP at `/api/mcp`, protected by admin authentication. This endpoint implements the [Model Context Protocol](https://modelcontextprotocol.io/) over HTTP, enabling remote MCP clients to access portfolio tools, resources, and prompts.

All three methods require the `X-Admin-Key` header. Sessions are stateful -- after initialization, include the `mcp-session-id` header returned by the server.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mcp` | MCP JSON-RPC requests (initialize, tool calls) |
| GET | `/api/mcp` | SSE stream for server-initiated notifications |
| DELETE | `/api/mcp` | Terminate MCP session |

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

## See Also

- [MCP Server & AI Tools](/integrations/mcp-server) - Full MCP server documentation
- [Operations Runbook](/operations/runbook) - Monitoring and alerting
- [Conventions](/api/conventions) - Authentication and headers
