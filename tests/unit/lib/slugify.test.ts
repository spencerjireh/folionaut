import { slugify, generateUniqueSlug } from '@/lib/slugify'

describe('slugify', () => {
  it('should convert title to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('should replace spaces with hyphens', () => {
    expect(slugify('My Test Project')).toBe('my-test-project')
  })

  it('should remove special characters', () => {
    expect(slugify('Hello! World?')).toBe('hello-world')
  })

  it('should handle multiple spaces', () => {
    expect(slugify('hello    world')).toBe('hello-world')
  })

  it('should handle already valid slugs', () => {
    expect(slugify('hello-world')).toBe('hello-world')
  })

  it('should handle numbers', () => {
    expect(slugify('Project 2024')).toBe('project-2024')
  })

  it('should handle empty string', () => {
    expect(slugify('')).toBe('')
  })
})

describe('generateUniqueSlug', () => {
  it('should return base slug if it does not exist', async () => {
    const existsCheck = vi.fn().mockResolvedValue(false)

    const result = await generateUniqueSlug('my-project', existsCheck)

    expect(result).toBe('my-project')
    expect(existsCheck).toHaveBeenCalledWith('my-project')
  })

  it('should sanitize the base slug', async () => {
    const existsCheck = vi.fn().mockResolvedValue(false)

    const result = await generateUniqueSlug('My Project!', existsCheck)

    expect(result).toBe('my-project')
  })

  it('should append -1 if base slug exists', async () => {
    const existsCheck = vi
      .fn()
      .mockResolvedValueOnce(true) // my-project exists
      .mockResolvedValueOnce(false) // my-project-1 doesn't exist

    const result = await generateUniqueSlug('my-project', existsCheck)

    expect(result).toBe('my-project-1')
    expect(existsCheck).toHaveBeenCalledTimes(2)
  })

  it('should increment suffix until unique', async () => {
    const existsCheck = vi
      .fn()
      .mockResolvedValueOnce(true) // my-project exists
      .mockResolvedValueOnce(true) // my-project-1 exists
      .mockResolvedValueOnce(true) // my-project-2 exists
      .mockResolvedValueOnce(false) // my-project-3 doesn't exist

    const result = await generateUniqueSlug('my-project', existsCheck)

    expect(result).toBe('my-project-3')
    expect(existsCheck).toHaveBeenCalledTimes(4)
  })

  it('should append timestamp after 100 attempts', async () => {
    // Mock existsCheck to always return true for numbered suffixes
    const existsCheck = vi.fn().mockResolvedValue(true)

    const beforeTime = Date.now()
    const result = await generateUniqueSlug('my-project', existsCheck)
    const afterTime = Date.now()

    // Should have pattern: my-project-<timestamp>
    expect(result).toMatch(/^my-project-\d+$/)

    // Timestamp should be within test execution time
    const timestampMatch = result.match(/my-project-(\d+)/)
    if (timestampMatch) {
      const timestamp = parseInt(timestampMatch[1])
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
      expect(timestamp).toBeLessThanOrEqual(afterTime)
    }

    // Should have checked 101 times (base + 100 numbered)
    expect(existsCheck).toHaveBeenCalledTimes(101)
  })

  it('should handle async exists check', async () => {
    const existsCheck = vi.fn().mockImplementation(async (slug: string) => {
      await new Promise((resolve) => setTimeout(resolve, 1))
      return slug === 'async-project'
    })

    const result = await generateUniqueSlug('async-project', existsCheck)

    expect(result).toBe('async-project-1')
  })
})
