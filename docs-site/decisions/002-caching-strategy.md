---
title: "ADR-002: Caching Strategy"
description: Layered caching with Redis and token bucket rate limiting
---

# ADR 002: Caching and Rate Limiting Strategy

## Status

<Badge type="tip" text="Accepted" />

## Context

Folionaut needs caching and rate limiting for:
- Rate limiting state (request counts per IP/key)
- LLM response caching (expensive API calls)
- Content caching (static content that rarely changes)
- Protection against abuse and DoS attacks

Requirements:
- Sub-millisecond latency for rate limit checks
- Graceful degradation if cache is unavailable
- Smooth traffic shaping with burst support
- Clear feedback to clients

## Decision

### Caching: Layered Redis with Memory Fallback

Implement a **layered caching strategy** with Redis as the primary cache and in-memory LRU fallback.

| Layer | Technology | Purpose |
|-------|------------|---------|
| L1 | lru-cache (in-memory) | Fast reads, sub-ms latency |
| L2 | Redis | Distributed state, persistence |

**Cache TTLs:**
- Rate limit: 60s
- LLM response: 1 hour
- Content: 5 minutes
- Session: 30 minutes

**Fallback behavior:** If Redis is unavailable, application continues with memory-only caching.

### Rate Limiting: Token Bucket Algorithm

Use **Token Bucket** for rate limiting with configurable capacity and refill rates.

| Endpoint | Capacity | Refill Rate | Notes |
|----------|----------|-------------|-------|
| Chat | 5 | 0.1/s | ~6/min sustained |
| Content | 100 | 10/s | High burst for reads |
| Admin | 50 | 5/s | Generous for admin |

**Response headers:**
- `X-RateLimit-Limit`: Bucket capacity
- `X-RateLimit-Remaining`: Current tokens
- `X-RateLimit-Reset`: Seconds until full
- `Retry-After`: Seconds to wait (when limited)

## Alternatives Considered

### Caching

| Option | Pros | Cons |
|--------|------|------|
| Redis only | Simple | Single point of failure |
| Memory only | Fastest | Lost on restart, not distributed |
| Layered | Fast reads, fault tolerant | More complex |

### Rate Limiting

| Algorithm | Pros | Cons |
|-----------|------|------|
| Fixed Window | Simple | Boundary spike problem |
| Token Bucket | Smooth, allows bursts | More state per client |
| Leaky Bucket | Constant rate | No burst allowance |

## Consequences

### Positive

- Fast path: most reads hit memory cache (sub-ms)
- Fault tolerant: application continues without Redis
- Burst tolerance: legitimate bursts not rejected
- Cost control: LLM endpoints can have higher token costs

### Negative

- Cache coherence issues in multi-instance deployment
- State per client for rate limiting
- Two cache layers to reason about

### Mitigations

- Short L1 TTLs (30-60s) to limit staleness
- LRU eviction for memory pressure
- Health checks and fallback event logging

## References

- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Cache-Aside Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
