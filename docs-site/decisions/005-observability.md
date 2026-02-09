---
title: "ADR-005: Observability"
description: Events and OpenTelemetry tracing
---

# ADR 005: Observability - Events and Distributed Tracing

## Status

<Badge type="tip" text="Accepted" />

## Context

Folionaut needs observability for:
- Decoupled side effects (cache invalidation, analytics, alerts)
- Request flow tracing through the system
- Performance bottleneck identification
- LLM call latency monitoring
- Error context and debugging

## Decision

### 1. Event-Driven Side Effects

Implement an **in-process typed Event Emitter** for decoupled side effect handling.

**Event types:**
- `content:created`, `content:updated`, `content:deleted`
- `chat:message`, `chat:session:created`
- `llm:request`, `llm:response`
- `error:unhandled`

**Usage pattern:**
```typescript
// Service emits event
await this.events.emit('content:created', { content, userId })

// Handler registered separately
emitter.on('content:created', async ({ content }) => {
  await cache.delete(`content:${content.slug}`)
})
```

**Characteristics:**
- Non-blocking (fire-and-forget with error isolation)
- Type-safe events and payloads
- Handler errors don't affect main request
- Easy to add new reactions

### 2. OpenTelemetry Tracing

Use **OpenTelemetry** for distributed tracing with automatic instrumentation.

**Configuration:**
- Service name: `folionaut`
- Sampling: 10% in production, 100% in development
- Export to OTLP-compatible backends (Jaeger, cloud providers)

**Automatic instrumentation:**
- HTTP requests
- Fetch calls (LLM API)
- Database queries

**Manual spans:** Wrap custom operations with `withSpan()` helper.

## Alternatives Considered

| Approach | Pros | Cons |
|----------|------|------|
| Direct function calls | Simple | Tight coupling, blocking |
| Message Queue | Distributed, persistent | Overkill for single instance |
| Console logging only | No setup | No correlation |
| Vendor-specific APM | Full-featured | Lock-in, cost |

## Consequences

### Positive

- Decoupled: core logic separated from side effects
- Vendor-neutral tracing (export anywhere)
- Trace ID correlates logs, spans, metrics
- Low overhead with sampling

### Negative

- More complex debugging (async flows)
- Handler errors isolated (may go unnoticed)
- Events lost on crash (no persistence)

### Mitigations

- Use correlation/trace IDs throughout
- Emit error events for handler failures
- Log all event emissions
- Graceful degradation when tracing disabled

## References

- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/instrumentation/js/)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
