import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  RateLimitError,
  ConflictError,
  LLMError,
} from '@/errors/app.error'

describe('AppError', () => {
  describe('constructor', () => {
    it('should create error with correct properties', () => {
      const error = new AppError('Test error', 'TEST_CODE', 500, true)

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error.statusCode).toBe(500)
      expect(error.isOperational).toBe(true)
    })

    it('should default isOperational to true', () => {
      const error = new AppError('Test', 'TEST', 500)

      expect(error.isOperational).toBe(true)
    })

    it('should allow non-operational errors', () => {
      const error = new AppError('Test', 'TEST', 500, false)

      expect(error.isOperational).toBe(false)
    })

    it('should be instanceof Error', () => {
      const error = new AppError('Test', 'TEST', 500)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AppError)
    })

    it('should have a stack trace', () => {
      const error = new AppError('Test', 'TEST', 500)

      expect(error.stack).toBeDefined()
    })
  })
})

describe('ValidationError', () => {
  it('should create with default empty fields', () => {
    const error = new ValidationError('Invalid input')

    expect(error.message).toBe('Invalid input')
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.statusCode).toBe(400)
    expect(error.fields).toEqual({})
  })

  it('should create with field errors', () => {
    const fields = {
      email: ['Required', 'Invalid format'],
      password: ['Too short'],
    }
    const error = new ValidationError('Validation failed', fields)

    expect(error.fields).toEqual(fields)
  })

  it('should be instanceof AppError', () => {
    const error = new ValidationError('Test')

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(ValidationError)
  })
})

describe('NotFoundError', () => {
  it('should create with resource only', () => {
    const error = new NotFoundError('User')

    expect(error.message).toBe('User not found')
    expect(error.code).toBe('NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error.resource).toBe('User')
    expect(error.identifier).toBeUndefined()
  })

  it('should create with resource and identifier', () => {
    const error = new NotFoundError('User', '123')

    expect(error.message).toBe("User with identifier '123' not found")
    expect(error.resource).toBe('User')
    expect(error.identifier).toBe('123')
  })

  it('should be instanceof AppError', () => {
    const error = new NotFoundError('Resource')

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(NotFoundError)
  })
})

describe('UnauthorizedError', () => {
  it('should create with default message', () => {
    const error = new UnauthorizedError()

    expect(error.message).toBe('Unauthorized')
    expect(error.code).toBe('UNAUTHORIZED')
    expect(error.statusCode).toBe(401)
  })

  it('should create with custom message', () => {
    const error = new UnauthorizedError('Invalid credentials')

    expect(error.message).toBe('Invalid credentials')
  })

  it('should be instanceof AppError', () => {
    const error = new UnauthorizedError()

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(UnauthorizedError)
  })
})

describe('RateLimitError', () => {
  it('should create with retryAfter', () => {
    const error = new RateLimitError(60)

    expect(error.message).toBe('Rate limit exceeded')
    expect(error.code).toBe('RATE_LIMIT_EXCEEDED')
    expect(error.statusCode).toBe(429)
    expect(error.retryAfter).toBe(60)
  })

  it('should be instanceof AppError', () => {
    const error = new RateLimitError(10)

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(RateLimitError)
  })
})

describe('ConflictError', () => {
  it('should create without field', () => {
    const error = new ConflictError('Resource already exists')

    expect(error.message).toBe('Resource already exists')
    expect(error.code).toBe('CONFLICT')
    expect(error.statusCode).toBe(409)
    expect(error.field).toBeUndefined()
  })

  it('should create with field', () => {
    const error = new ConflictError('Slug already exists', 'slug')

    expect(error.message).toBe('Slug already exists')
    expect(error.field).toBe('slug')
  })

  it('should be instanceof AppError', () => {
    const error = new ConflictError('Conflict')

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(ConflictError)
  })
})

describe('LLMError', () => {
  it('should create with provider', () => {
    const error = new LLMError('Connection failed', 'openai')

    expect(error.message).toBe('Connection failed')
    expect(error.code).toBe('LLM_ERROR')
    expect(error.statusCode).toBe(502)
    expect(error.provider).toBe('openai')
  })

  it('should be instanceof AppError', () => {
    const error = new LLMError('Error', 'provider')

    expect(error).toBeInstanceOf(AppError)
    expect(error).toBeInstanceOf(LLMError)
  })
})
