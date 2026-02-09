---
title: Deployment Guide
description: Deployment procedures and best practices
---

# Deployment Guide

This guide covers deploying Folionaut to production.

## Deployment Options

| Option | Best For | Complexity |
|--------|----------|------------|
| Docker | Single server, VPS | Low |
| Docker Compose | Local dev, simple prod | Low |
| Fly.io | Managed deployment | Low |
| Kubernetes | Enterprise, multi-region | High |

## Docker Deployment

### Build Image

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM oven/bun:1-slim
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./
RUN bun install --production --frozen-lockfile

USER bun

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/api/health/live').then(r=>process.exit(r.ok?0:1))"

CMD ["bun", "dist/index.js"]
```

Key features of the production Dockerfile:
- **Multi-stage build**: Builder stage compiles, production stage only has runtime deps
- **Non-root user**: Runs as `bun` user for security
- **Built-in healthcheck**: Container self-monitors via the liveness endpoint
- **Production-only deps**: `bun install --production` in the final stage

### Run Container

```bash
# Build
docker build -t folionaut .

# Run
docker run -d \
  --name folionaut-api \
  -p 3000:3000 \
  -e TURSO_DATABASE_URL=... \
  -e TURSO_AUTH_TOKEN=... \
  -e ADMIN_API_KEY=... \
  -e LLM_API_KEY=... \
  folionaut
```

## Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
      - TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}
      - ADMIN_API_KEY=${ADMIN_API_KEY}
      - LLM_API_KEY=${LLM_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  redis_data:
```

## Fly.io Deployment

### Initial Setup

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Initialize app
fly launch --name folionaut
```

### fly.toml

```toml
app = "folionaut"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

  [http_service.concurrency]
    type = "connections"
    hard_limit = 100
    soft_limit = 80

[[services]]
  protocol = "tcp"
  internal_port = 3000

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    interval = 10000
    timeout = 5000
    path = "/api/health/live"
```

### Set Secrets

```bash
fly secrets set \
  TURSO_DATABASE_URL=libsql://... \
  TURSO_AUTH_TOKEN=... \
  ADMIN_API_KEY=... \
  LLM_API_KEY=...
```

### Deploy

```bash
fly deploy
```

## Zero-Downtime Deployment

### Docker

```bash
# 1. Build new image
docker build -t folionaut-api:new .

# 2. Start new container on different port
docker run -d --name api-new -p 3001:3000 folionaut-api:new

# 3. Wait for health check
until curl -s http://localhost:3001/api/health | grep -q "ok"; do
  sleep 1
done

# 4. Update reverse proxy to point to new container

# 5. Stop old container
docker stop api-old && docker rm api-old

# 6. Rename new container
docker rename api-new folionaut-api
```

### Fly.io

Fly.io handles zero-downtime deployments automatically with rolling updates.

```bash
fly deploy --strategy rolling
```

## Rollback Procedure

### Docker

```bash
# List available images
docker images folionaut-api

# Rollback to previous version
docker stop folionaut-api
docker run -d --name folionaut-api -p 3000:3000 folionaut-api:previous
```

### Fly.io

```bash
# List releases
fly releases

# Rollback to specific version
fly deploy --image registry.fly.io/folionaut-api:v123
```

## Database Migrations

### Before Deployment

1. Ensure migrations are backwards compatible
2. Run migrations before deploying new code
3. Test rollback procedure

### Migration Commands

```bash
# Generate migration
bun run db:generate

# Apply migration
bun run db:migrate

# Verify migration
turso db shell <db-name> ".schema"
```

## Environment Configuration

### Required Variables

```bash
# Database
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=eyJ...

# Admin
ADMIN_API_KEY=secure-random-key

# LLM (for chat)
LLM_API_KEY=sk-...
```

### Optional Variables

```bash
# Server
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGINS=https://yoursite.com

# Cache
REDIS_URL=redis://localhost:6379

# Observability (OTEL_EXPORTER_* are read by the OpenTelemetry SDK)
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4318
```

## Health Checks

Configure your deployment platform to use these endpoints:

| Check | Endpoint | Interval |
|-------|----------|----------|
| Liveness | `/api/health/live` | 30s |
| Readiness | `/api/health/ready` | 10s |
| Startup | `/api/health/startup` | 5s |

## SSL/TLS

### Caddy (Automatic HTTPS)

```
api.yoursite.com {
    reverse_proxy localhost:3000
}
```

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name api.yoursite.com;

    ssl_certificate /etc/letsencrypt/live/api.yoursite.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yoursite.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Monitoring Setup

### Prometheus

Add scrape config:

```yaml
scrape_configs:
  - job_name: 'folionaut-api'
    static_configs:
      - targets: ['api.yoursite.com']
    metrics_path: '/api/metrics'
```

### Grafana Dashboard

Import the included dashboard JSON or create panels for:
- Request rate and latency
- Error rates
- Circuit breaker state
- Rate limit hits
- Cache hit ratio

## Deployment Checklist

- [ ] All tests pass
- [ ] Build succeeds
- [ ] Migrations are backwards compatible
- [ ] Environment variables are set
- [ ] Health check endpoint responds
- [ ] SSL certificate is valid
- [ ] Monitoring is configured
- [ ] Rollback procedure is documented
