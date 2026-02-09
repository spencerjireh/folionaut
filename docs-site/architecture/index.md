---
title: Architecture Overview
description: System architecture and design overview
---

# Architecture Overview

Folionaut follows a layered architecture with clear separation of concerns. This section covers the system design at various levels of detail.

## Documentation Structure

| Document | Description |
|----------|-------------|
| [High-Level Design](/architecture/high-level-design) | System context, containers, deployment |
| [Low-Level Design](/architecture/low-level-design) | Components, classes, sequences |
| [Content Model](/architecture/content-model) | Data schemas and validation |

## Design Principles

### 1. Clean Architecture

The codebase follows clean architecture principles:

- **Routes** - HTTP handling, request/response transformation
- **Services** - Business logic, orchestration
- **Repositories** - Data access abstraction
- **Infrastructure** - Cross-cutting concerns (cache, events, metrics)

### 2. Dependency Injection

All dependencies are injected, enabling:

- Easy unit testing with mocks
- Flexible configuration
- Clear dependency graphs

### 3. Event-Driven Side Effects

Side effects (cache invalidation, metrics, audit logs) are decoupled via events:

```mermaid
flowchart LR
    Service --> EventBus["Event Bus"] --> Handlers["Handlers<br/><i>async</i>"]
```

This keeps core logic focused and testable.

## System Overview

```mermaid
flowchart TB
    frontend["Frontend"]

    subgraph app["Express Application"]
        routes["Express API<br/><i>Routes</i>"]
        services["Services<br/><i>Business Logic</i>"]
    end

    subgraph infra["Infrastructure Layer"]
        repos["Repositories<br/><i>Drizzle ORM</i>"]
        llmProvider["LLM Provider<br/><i>OpenAI</i>"]
        cache["Cache<br/><i>Redis</i>"]
    end

    turso[("Turso DB")]
    llmApi["LLM API"]
    redis[("Redis")]

    frontend --> routes
    routes --> services
    services --> repos
    services --> llmProvider
    services --> cache
    repos --> turso
    llmProvider --> llmApi
    cache --> redis
```

## Key Components

### Content Management

- Single `content` table with flexible JSON `data` column
- Type-specific validation via Zod schemas
- Version history tracking with restore capability
- Soft deletes for safety

### Chat System

- Session-based conversations
- Input/output guardrails with PII sanitization
- Token bucket rate limiting
- Circuit breaker for resilience

### MCP Server

- Dual transport: stdio (local) and Streamable HTTP (remote via `/api/mcp`)
- Tools for CRUD operations
- Resources for reading content
- Prompts for common use cases
- Shared data layer with REST API

## Architecture Decision Records

Key decisions are documented as ADRs:

| ADR | Decision |
|-----|----------|
| [001](/decisions/001-database-choice) | Turso (libSQL) for database |
| [002](/decisions/002-caching-strategy) | Layered caching with Redis |
| [003](/decisions/003-llm-abstraction) | Provider abstraction layer |
| [004](/decisions/004-repository-pattern) | Repository pattern for data access |
| [005](/decisions/005-observability) | Events and OpenTelemetry tracing |
| [006](/decisions/006-pii-obfuscation) | Guardrails-based PII protection |
| [007](/decisions/007-content-model-flexibility) | Flexible content model |
| [008](/decisions/008-shared-tools-architecture) | Shared tools architecture |
