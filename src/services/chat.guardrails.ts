/**
 * Input and output guardrails for the chat service.
 * Provides validation and sanitization for security and quality.
 */

export interface GuardrailResult {
  passed: boolean
  reason?: string
  sanitizedContent?: string
}

// PII detection patterns
const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
}

// Hobbies/personal life keywords
const HOBBIES_KEYWORDS = [
  'hobbies',
  'hobby',
  'personal life',
  'free time',
  'spare time',
  'leisure',
  'outside of work',
  'when not working',
  'interests outside',
  'favorite food',
  'favorite movie',
  'favorite music',
  'family',
  'married',
  'kids',
  'children',
  'pets',
  'dating',
  'relationship',
]

/**
 * Check if input is empty or whitespace-only.
 */
export function isEmptyOrWhitespace(input: string): boolean {
  return !input || input.trim().length === 0
}

/**
 * Detect if the question is about hobbies or personal life.
 */
export function detectHobbiesQuestion(input: string): boolean {
  const lowerInput = input.toLowerCase()
  return HOBBIES_KEYWORDS.some((keyword) => lowerInput.includes(keyword))
}

/**
 * Validate user input before sending to LLM.
 * Returns failed result with reason for edge cases that need special handling.
 */
export function validateInput(input: string): GuardrailResult {
  // Check for empty/whitespace input
  if (isEmptyOrWhitespace(input)) {
    return {
      passed: false,
      reason:
        "I didn't receive a clear message. Could you please ask a question about Spencer's portfolio, such as his projects, skills, or experience?",
    }
  }

  // Check for hobbies/personal life questions
  if (detectHobbiesQuestion(input)) {
    return {
      passed: false,
      reason:
        "I only have information about Spencer's professional portfolio, including his projects, skills, work experience, and education. I don't have details about personal hobbies or interests. Is there something about his professional background I can help you with?",
    }
  }

  return { passed: true }
}

/**
 * Detect unexpected PII in text that isn't in the allowlist.
 * Returns array of detected PII types.
 */
export function detectUnexpectedPII(text: string, allowlist: string[] = []): string[] {
  const detected: string[] = []
  const lowerAllowlist = allowlist.map((a) => a.toLowerCase())

  // Check for emails not in allowlist
  const emails = text.match(PII_PATTERNS.email) || []
  for (const email of emails) {
    if (!lowerAllowlist.some((allowed) => email.toLowerCase().includes(allowed))) {
      detected.push(`email:${email}`)
    }
  }

  // Check for phone numbers (never allowed)
  const phones = text.match(PII_PATTERNS.phone) || []
  for (const phone of phones) {
    detected.push(`phone:${phone}`)
  }

  // Check for SSNs (never allowed)
  const ssns = text.match(PII_PATTERNS.ssn) || []
  for (const ssn of ssns) {
    detected.push(`ssn:${ssn}`)
  }

  return detected
}

/**
 * Sanitize response by removing/masking PII.
 */
export function sanitizeResponse(response: string, allowedEmails: string[] = []): string {
  let sanitized = response

  // Mask SSNs
  sanitized = sanitized.replace(PII_PATTERNS.ssn, '[REDACTED SSN]')

  // Mask phone numbers
  sanitized = sanitized.replace(PII_PATTERNS.phone, '[REDACTED PHONE]')

  // Mask emails not in allowlist
  sanitized = sanitized.replace(PII_PATTERNS.email, (match) => {
    const lowerMatch = match.toLowerCase()
    const isAllowed = allowedEmails.some((allowed) => lowerMatch === allowed.toLowerCase())
    return isAllowed ? match : '[REDACTED EMAIL]'
  })

  return sanitized
}

/**
 * Validate LLM output for PII leakage.
 * allowedEmails: list of emails that are OK to include (e.g., public contact email)
 */
export function validateOutput(response: string, allowedEmails: string[] = []): GuardrailResult {
  const unexpectedPII = detectUnexpectedPII(response, allowedEmails)

  if (unexpectedPII.length > 0) {
    return {
      passed: false,
      reason: `Detected unexpected PII: ${unexpectedPII.join(', ')}`,
      sanitizedContent: sanitizeResponse(response, allowedEmails),
    }
  }

  return { passed: true }
}
