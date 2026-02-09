<p align="center">
  <img src="docs-site/public/logo.png" alt="Folionaut" width="140" height="140">
</p>

<h1 align="center">Folionaut</h1>

<p align="center">
  <strong>AI & MCP enhanced portfolio content management system</strong>
</p>

<p align="center">
  <a href="https://github.com/spencerjireh/folionaut/blob/main/LICENSE"><img src="https://img.shields.io/github/license/spencerjireh/folionaut?style=flat-square" alt="License"></a>
  <a href="https://github.com/spencerjireh/folionaut"><img src="https://img.shields.io/github/last-commit/spencerjireh/folionaut?style=flat-square" alt="Last Commit"></a>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Bun-Runtime-f9f1e1?style=flat-square&logo=bun&logoColor=000" alt="Bun">
</p>

<p align="center">
  <a href="https://spencerjireh.github.io/folionaut/">Documentation</a> &bull;
  <a href="https://spencerjireh.github.io/folionaut/api/">API Reference</a> &bull;
  <a href="https://spencerjireh.github.io/folionaut/guide/quick-start.html">Quick Start</a>
</p>

---

## Overview

A TypeScript/Express backend for portfolio websites featuring a flexible CMS, AI-powered chat with tool use, and Model Context Protocol (MCP) server integration.

### Key Features

- **Flexible CMS** - Free-form JSON content with versioning, soft delete, and full audit trail
- **AI Chat** - Rate-limited chat with PII obfuscation and tool use for content queries
- **MCP Server** - Expose content tools to AI assistants via Model Context Protocol
- **Resilient** - Circuit breaker for LLM, token bucket rate limiting, graceful degradation
- **Observable** - OpenTelemetry tracing, Prometheus metrics, structured logging

## Tech Stack

<table>
  <tr>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/bun/f9f1e1" width="32" height="32" alt="Bun"><br><sub>Bun</sub></td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/express/000000" width="32" height="32" alt="Express"><br><sub>Express</sub></td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/typescript/3178C6" width="32" height="32" alt="TypeScript"><br><sub>TypeScript</sub></td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/turso/4FF8D2" width="32" height="32" alt="Turso"><br><sub>Turso</sub></td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/drizzle/C5F74F" width="32" height="32" alt="Drizzle"><br><sub>Drizzle</sub></td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/redis/FF4438" width="32" height="32" alt="Redis"><br><sub>Redis</sub></td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/zod/3E67B1" width="32" height="32" alt="Zod"><br><sub>Zod</sub></td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/opentelemetry/F5A800" width="32" height="32" alt="OpenTelemetry"><br><sub>OTel</sub></td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/prometheus/E6522C" width="32" height="32" alt="Prometheus"><br><sub>Prometheus</sub></td>
  </tr>
</table>

## Quick Start

```bash
# Install
bun install

# Configure
cp .env.example .env
# Edit .env with your Turso and API keys

# Database
bun run db:migrate

# Run
bun run dev
```

See the [Configuration Guide](https://spencerjireh.github.io/folionaut/guide/configuration.html) for environment variables.

## API

### Public

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/content` | List published content |
| `GET /api/v1/content/:type/:slug` | Get content item |
| `GET /api/v1/content/bundle` | Get all content |
| `POST /api/v1/chat` | Chat with AI |
| `GET /api/health` | Health check |
| `GET /api/metrics` | Prometheus metrics |

### Admin

Requires `X-Admin-Key` header.

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/admin/content` | Create content |
| `PUT /api/v1/admin/content/:id` | Update content |
| `DELETE /api/v1/admin/content/:id` | Soft delete |
| `GET /api/v1/admin/content/:id/history` | Version history |
| `POST /api/v1/admin/content/:id/restore` | Restore version |

Full specification: [API Reference](https://spencerjireh.github.io/folionaut/api/reference.html)

## Architecture

```
src/
├── routes/        # HTTP handlers
├── services/      # Business logic
├── repositories/  # Data access
├── middleware/    # Express middleware
├── cache/         # Redis with memory fallback
├── resilience/    # Rate limiter, circuit breaker
├── events/        # Typed event emitter
├── llm/           # LLM provider abstraction
├── tools/         # Shared tools (chat & MCP)
├── mcp/           # MCP server (stdio transport)
└── observability/ # Metrics, tracing
```

See [Architecture Overview](https://spencerjireh.github.io/folionaut/architecture/) for details.

## Documentation

| Topic | Link |
|-------|------|
| Getting Started | [Quick Start Guide](https://spencerjireh.github.io/folionaut/guide/quick-start.html) |
| Configuration | [Environment & Settings](https://spencerjireh.github.io/folionaut/guide/configuration.html) |
| Architecture | [High-Level Design](https://spencerjireh.github.io/folionaut/architecture/high-level-design.html) |
| API | [OpenAPI Reference](https://spencerjireh.github.io/folionaut/api/reference.html) |
| MCP Server | [Integration Guide](https://spencerjireh.github.io/folionaut/integrations/mcp-server.html) |
| Operations | [Runbook](https://spencerjireh.github.io/folionaut/operations/runbook.html) |

## Scripts

```bash
bun run dev        # Development server
bun run build      # Production build
bun run test       # Run tests
bun run lint       # Lint code
bun run db:studio  # Drizzle Studio GUI
bun run mcp        # Start MCP server
```

## License

MIT
