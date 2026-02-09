---
title: Architecture Decision Records
description: Index of all architecture decisions
---

# Architecture Decision Records

This section documents the key architectural decisions made for the Folionaut project.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences. ADRs help:

- Document the reasoning behind decisions
- Provide context for future developers
- Enable informed reconsideration of decisions

## Summary

| ADR | Title | Status | Summary |
|-----|-------|--------|---------|
| [001](/decisions/001-database-choice) | Database Choice | Accepted | Turso (libSQL) for edge-friendly SQLite |
| [002](/decisions/002-caching-strategy) | Caching Strategy | Accepted | Layered Redis/Memory with Token Bucket rate limiting |
| [003](/decisions/003-llm-abstraction) | LLM Abstraction | Accepted | Provider abstraction layer for flexibility |
| [004](/decisions/004-repository-pattern) | Repository Pattern | Accepted | Abstract data access for testability |
| [005](/decisions/005-observability) | Observability | Accepted | Events and OpenTelemetry tracing |
| [006](/decisions/006-pii-obfuscation) | PII Protection | Accepted | Guardrails-based PII detection and sanitization |
| [007](/decisions/007-content-model-flexibility) | Content Model | Accepted | Flexible JSON with app-level validation |
| [008](/decisions/008-shared-tools-architecture) | Shared Tools | Accepted | Unified tool implementations for MCP and chat |

## ADR Template

When adding new ADRs, use this template:

```markdown
# ADR NNN: Title

## Status

Proposed | Accepted | Deprecated | Superseded

## Context

What is the issue that we're seeing that is motivating this decision?

## Decision

What is the change that we're proposing and/or doing?

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| Option A | ... | ... |
| Option B | ... | ... |

## Consequences

### Positive
- ...

### Negative
- ...

### Mitigations
- ...

## References
- ...
```

## Decision Themes

### Data Layer
- [ADR-001: Database Choice](/decisions/001-database-choice) - Why Turso
- [ADR-004: Repository Pattern](/decisions/004-repository-pattern) - How we access data
- [ADR-007: Content Model](/decisions/007-content-model-flexibility) - Flexible JSON schema

### Infrastructure
- [ADR-002: Caching Strategy](/decisions/002-caching-strategy) - Redis and rate limiting
- [ADR-005: Observability](/decisions/005-observability) - Events and tracing

### AI Integration
- [ADR-003: LLM Abstraction](/decisions/003-llm-abstraction) - Provider flexibility
- [ADR-006: PII Protection](/decisions/006-pii-obfuscation) - Guardrails and sanitization
- [ADR-008: Shared Tools](/decisions/008-shared-tools-architecture) - Unified MCP and chat tools
