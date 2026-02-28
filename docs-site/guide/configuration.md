---
title: Configuration
description: Environment variables and configuration options
---

# Configuration

Folionaut is configured via environment variables. This page documents all available options.

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `TURSO_DATABASE_URL` | Turso database URL | `libsql://db-name.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso authentication token | `eyJ...` |

### Conditionally Required

These are required only when their corresponding feature flags are enabled (all enabled by default):

| Variable | Required When | Description | Example |
|----------|---------------|-------------|---------|
| `ADMIN_API_KEY` | `FEATURE_ADMIN_API` or `FEATURE_MCP_SERVER` enabled | API key for admin endpoints (min 32 chars) | `secure-random-string-at-least-32-chars` |
| `LLM_API_KEY` | `FEATURE_AI_CHAT` enabled | LLM provider API key | `sk-...` |

::: tip
If you only need the public content endpoints, you can disable `FEATURE_AI_CHAT`, `FEATURE_ADMIN_API`, and `FEATURE_MCP_SERVER` and skip both keys entirely.
:::

## Optional Variables

### Server

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | `development` | Environment (`development`, `production`, `test`) |

### CORS

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `''` | Comma-separated list of allowed origins |

### Caching

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | - | Redis connection URL (optional) |

::: tip
If `REDIS_URL` is not set, the application falls back to in-memory caching. This works fine for single-instance deployments.
:::

### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_CAPACITY` | `5` | Chat endpoint token bucket capacity |
| `RATE_LIMIT_REFILL_RATE` | `0.333` | Chat endpoint tokens per second |
| `CONTENT_RATE_LIMIT_CAPACITY` | `60` | Content endpoint token bucket capacity |
| `CONTENT_RATE_LIMIT_REFILL_RATE` | `10` | Content endpoint tokens per second |

### LLM Provider

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `openai` | LLM provider (currently only `openai` supported) |
| `LLM_BASE_URL` | - | Custom OpenAI-compatible endpoint URL |
| `LLM_MODEL` | `gpt-4o-mini` | Model to use for chat |
| `LLM_MAX_TOKENS` | `2000` | Maximum response tokens |
| `LLM_TEMPERATURE` | `0.7` | Response temperature (0-1) |
| `LLM_REQUEST_TIMEOUT_MS` | `30000` | LLM request timeout in milliseconds |
| `LLM_MAX_RETRIES` | `3` | Maximum retry attempts for LLM calls |

### Timeouts

| Variable | Default | Description |
|----------|---------|-------------|
| `REQUEST_TIMEOUT_MS` | `30000` | Default HTTP request timeout in milliseconds |
| `CHAT_REQUEST_TIMEOUT_MS` | `60000` | Chat endpoint timeout in milliseconds |

### Observability

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_ENABLED` | `false` | Enable OpenTelemetry tracing (app-level gate) |

::: tip OpenTelemetry SDK Variables
When `OTEL_ENABLED=true`, the OpenTelemetry SDK reads these standard environment variables directly. They are not validated by our application but are required for trace export.
:::

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | - | OTLP collector endpoint (e.g., `http://localhost:4318`) |
| `OTEL_EXPORTER_OTLP_HEADERS` | - | Headers for OTLP exporter (e.g., `Authorization=Bearer token`) |
| `OTEL_SERVICE_NAME` | `folionaut` | Service name in traces (hardcoded, but SDK allows override) |

See [OpenTelemetry Environment Variables](https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/) for the full list of SDK configuration options.

### Feature Flags

Feature flags allow you to enable or disable major subsystems. All are enabled by default.

| Variable | Default | Description |
|----------|---------|-------------|
| `FEATURE_AI_CHAT` | `true` | Enable the `POST /api/v1/chat` endpoint. When disabled, `LLM_API_KEY` is not required. |
| `FEATURE_MCP_SERVER` | `true` | Enable the MCP server (stdio and HTTP transports). When disabled, `ADMIN_API_KEY` is not required for this feature. |
| `FEATURE_ADMIN_API` | `true` | Enable admin CRUD endpoints. When disabled, `ADMIN_API_KEY` is not required for this feature. |
| `FEATURE_RATE_LIMITING` | `true` | Enable token bucket rate limiting on chat and content endpoints. |
| `FEATURE_AUDIT_LOG` | `true` | Enable content version history tracking in the `content_history` table. |

::: info
`ADMIN_API_KEY` (min 32 chars) is validated at startup when either `FEATURE_ADMIN_API` or `FEATURE_MCP_SERVER` is enabled. `LLM_API_KEY` is validated when `FEATURE_AI_CHAT` is enabled.
:::

## Example `.env` File

```bash
# Required
TURSO_DATABASE_URL=libsql://folionaut-db.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
ADMIN_API_KEY=super-secure-random-key-at-least-32-characters
LLM_API_KEY=sk-...

# Server
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGINS=https://myportfolio.com,https://www.myportfolio.com

# Caching (optional - falls back to in-memory)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_CAPACITY=5
RATE_LIMIT_REFILL_RATE=0.333
CONTENT_RATE_LIMIT_CAPACITY=60
CONTENT_RATE_LIMIT_REFILL_RATE=10

# LLM
LLM_PROVIDER=openai
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
LLM_MAX_TOKENS=2000
LLM_TEMPERATURE=0.7
LLM_REQUEST_TIMEOUT_MS=30000
LLM_MAX_RETRIES=3

# Timeouts
REQUEST_TIMEOUT_MS=30000
CHAT_REQUEST_TIMEOUT_MS=60000

# Observability
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

## Configuration by Environment

### Development

```bash
NODE_ENV=development
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

### Production

```bash
NODE_ENV=production
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-collector.example.com:4318
```

### Testing

```bash
NODE_ENV=test
TURSO_DATABASE_URL=file:test.db  # Use local SQLite
```

## Security Best Practices

::: warning
Never commit `.env` files to version control. Add `.env` to your `.gitignore`.
:::

### API Key Generation

Generate a secure admin API key:

```bash
openssl rand -base64 32
```

### Secret Rotation

To rotate the admin API key:

1. Generate a new key
2. Update the environment variable
3. Redeploy the application
4. Update any clients using the old key

### Secrets Management

For production, consider using:

- **Docker secrets** for containerized deployments
- **Cloud provider secrets** (AWS Secrets Manager, GCP Secret Manager)
- **Vault** for centralized secrets management
