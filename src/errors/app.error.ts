export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, code: string, statusCode: number, isOperational = true) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>

  constructor(message: string, fields: Record<string, string[]> = {}) {
    super(message, 'VALIDATION_ERROR', 400)
    this.fields = fields
  }
}

export class NotFoundError extends AppError {
  public readonly resource: string
  public readonly identifier?: string

  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`
    super(message, 'NOT_FOUND', 404)
    this.resource = resource
    this.identifier = identifier
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401)
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number

  constructor(retryAfter: number) {
    super('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429)
    this.retryAfter = retryAfter
  }
}

export class ConflictError extends AppError {
  public readonly field?: string

  constructor(message: string, field?: string) {
    super(message, 'CONFLICT', 409)
    this.field = field
  }
}

export class LLMError extends AppError {
  public readonly provider: string

  constructor(message: string, provider: string) {
    super(message, 'LLM_ERROR', 502)
    this.provider = provider
  }
}
