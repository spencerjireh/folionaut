---
title: "ADR-006: PII Protection"
description: Guardrails-based PII detection and sanitization for LLM calls
---

# ADR 006: PII Protection for LLM Calls

## Status

<Badge type="tip" text="Accepted" />

## Context

The chat service sends user messages to an external LLM provider. User messages may contain personally identifiable information (PII) such as email addresses, phone numbers, or social security numbers. Additionally, LLM responses could inadvertently leak PII that exists in the portfolio data.

We need to protect user privacy while maintaining useful chat functionality.

## Decision

Implement a **guardrails-based PII protection** strategy with both input validation and output sanitization. This is _not_ token-based obfuscation (where PII is replaced before the LLM call and restored after). Instead, we validate inputs and sanitize outputs using regex-based detection.

### 1. Input Guardrails

Validate user messages before sending to the LLM:
- Reject empty or whitespace-only messages
- Detect off-topic questions (hobbies, personal life) and respond with a redirect
- Additional checks can be added as patterns emerge

### 2. Output Guardrails

Check LLM responses before returning to the user:
- Detect unexpected PII (emails, phone numbers, SSNs) in responses
- Allow known public information (e.g., portfolio contact email) via allowlist
- Redact detected PII before returning the response

### 3. PII Detection Patterns

```typescript
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
}
```

### 4. Sanitization

When PII is detected in output:
- SSNs are replaced with `[REDACTED SSN]`
- Phone numbers are replaced with `[REDACTED PHONE]`
- Emails not in the allowlist are replaced with `[REDACTED EMAIL]`

## Alternatives Considered

| Option | Pros | Cons |
|--------|------|------|
| **Token-based obfuscation** (replace PII with tokens before LLM, restore after) | Preserves context for LLM | Complex mapping management, tokens may confuse LLM |
| **Regex-based guardrails** (detect + sanitize on output) | Simple, predictable, fast | May miss context-dependent PII |
| **No protection** | Zero overhead | Privacy risk, potential liability |
| **Dedicated PII service** (e.g., Presidio) | Comprehensive detection | External dependency, latency |

We chose regex-based guardrails for simplicity and predictability, with the option to upgrade to a dedicated PII service later if needed.

## Consequences

### Positive
- PII in LLM responses is detected and redacted before reaching the user
- Known public contact information (portfolio email) can still be shared
- Minimal latency overhead (regex matching is fast)
- Input guardrails catch edge cases and abuse before hitting the LLM

### Negative
- Regex patterns may have false positives (e.g., version numbers matching phone patterns)
- Cannot detect all forms of PII (e.g., names without other context)
- User input is still sent to the LLM unmodified (no pre-LLM obfuscation)

### Mitigations
- Allowlist for known public information reduces false positives
- Guardrails log when triggered for monitoring and tuning
- System prompt instructs LLM not to share personal information beyond portfolio data

## References
- `src/services/chat.guardrails.ts` -- Input/output guardrail implementation
- `src/services/chat.service.ts` -- Integration in the chat flow (steps 4 and 7)
- [OWASP LLM Top 10](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
