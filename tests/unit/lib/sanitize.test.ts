import { sanitizeSlug, escapeHtml, isValidUrl } from '@/lib/sanitize'

describe('sanitizeSlug', () => {
  it('should convert to lowercase', () => {
    expect(sanitizeSlug('Hello World')).toBe('hello-world')
  })

  it('should replace non-alphanumeric characters with hyphens', () => {
    expect(sanitizeSlug('Hello_World!')).toBe('hello-world')
  })

  it('should collapse multiple hyphens', () => {
    expect(sanitizeSlug('hello---world')).toBe('hello-world')
  })

  it('should remove leading and trailing hyphens', () => {
    expect(sanitizeSlug('-hello-world-')).toBe('hello-world')
  })

  it('should handle spaces', () => {
    expect(sanitizeSlug('hello world')).toBe('hello-world')
  })

  it('should handle special characters', () => {
    expect(sanitizeSlug('hello@world#2024!')).toBe('hello-world-2024')
  })

  it('should handle already valid slugs', () => {
    expect(sanitizeSlug('hello-world')).toBe('hello-world')
  })

  it('should handle numbers', () => {
    expect(sanitizeSlug('project123')).toBe('project123')
  })

  it('should handle empty string', () => {
    expect(sanitizeSlug('')).toBe('')
  })

  it('should handle string with only special characters', () => {
    expect(sanitizeSlug('@#$%')).toBe('')
  })
})

describe('escapeHtml', () => {
  it('should escape ampersand', () => {
    expect(escapeHtml('hello & world')).toBe('hello &amp; world')
  })

  it('should escape less than', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
  })

  it('should escape greater than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b')
  })

  it('should escape double quotes', () => {
    expect(escapeHtml('he said "hello"')).toBe('he said &quot;hello&quot;')
  })

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s')
  })

  it('should escape multiple entities', () => {
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
    )
  })

  it('should handle text without special characters', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })

  it('should handle empty string', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('isValidUrl', () => {
  describe('valid URLs', () => {
    it('should accept http URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true)
    })

    it('should accept https URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
    })

    it('should accept URLs with paths', () => {
      expect(isValidUrl('https://example.com/path/to/resource')).toBe(true)
    })

    it('should accept URLs with query strings', () => {
      expect(isValidUrl('https://example.com?param=value')).toBe(true)
    })

    it('should accept URLs with ports', () => {
      expect(isValidUrl('https://example.com:8080')).toBe(true)
    })

    it('should accept URLs with fragments', () => {
      expect(isValidUrl('https://example.com#section')).toBe(true)
    })

    it('should accept URLs with subdomains', () => {
      expect(isValidUrl('https://api.example.com')).toBe(true)
    })
  })

  describe('invalid URLs', () => {
    it('should reject ftp URLs', () => {
      expect(isValidUrl('ftp://example.com')).toBe(false)
    })

    it('should reject file URLs', () => {
      expect(isValidUrl('file:///path/to/file')).toBe(false)
    })

    it('should reject javascript URLs', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false)
    })

    it('should reject malformed URLs', () => {
      expect(isValidUrl('not a url')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(isValidUrl('')).toBe(false)
    })

    it('should reject URLs without protocol', () => {
      expect(isValidUrl('example.com')).toBe(false)
    })

    it('should reject data URLs', () => {
      expect(isValidUrl('data:text/html,<h1>Hello</h1>')).toBe(false)
    })
  })
})
