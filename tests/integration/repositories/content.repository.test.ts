import { createTestDb, initializeSchema, cleanupTestDb, closeTestDb, type TestDb } from '../../helpers/test-db'

const mockDb = vi.hoisted(() => ({ db: null as any }))
vi.mock('@/db/client', () => ({ get db() { return mockDb.db } }))

describe('ContentRepository Integration', () => {
  let testDb: TestDb
  let repository: import('@/repositories/content.repository').ContentRepository

  beforeAll(async () => {
    testDb = createTestDb()
    await initializeSchema(testDb.db)
    mockDb.db = testDb.db
    const { ContentRepository } = await import('@/repositories/content.repository')
    repository = new ContentRepository()
  })

  beforeEach(async () => {
    await cleanupTestDb(testDb.db)
  })

  afterAll(() => {
    closeTestDb(testDb)
  })

  describe('findById', () => {
    it('should return content by id', async () => {
      const created = await repository.create({
        type: 'project',
        slug: 'test-project',
        data: { title: 'Test Project' },
      })

      const found = await repository.findById(created.id)

      expect(found).not.toBeNull()
      expect(found!.id).toBe(created.id)
      expect(found!.slug).toBe('test-project')
    })

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('content_nonexistent')
      expect(found).toBeNull()
    })

    it('should not return soft-deleted content', async () => {
      const created = await repository.create({
        type: 'project',
        slug: 'deleted-project',
        data: { title: 'Deleted Project' },
      })
      await repository.delete(created.id)

      const found = await repository.findById(created.id)
      expect(found).toBeNull()
    })
  })

  describe('findBySlug', () => {
    it('should return content by type and slug', async () => {
      await repository.create({
        type: 'project',
        slug: 'my-project',
        data: { title: 'My Project' },
      })

      const found = await repository.findBySlug('project', 'my-project')

      expect(found).not.toBeNull()
      expect(found!.slug).toBe('my-project')
      expect(found!.type).toBe('project')
    })

    it('should return null for wrong type', async () => {
      await repository.create({
        type: 'project',
        slug: 'my-project',
        data: { title: 'My Project' },
      })

      const found = await repository.findBySlug('experience', 'my-project')
      expect(found).toBeNull()
    })

    it('should return null for non-existent slug', async () => {
      const found = await repository.findBySlug('project', 'nonexistent')
      expect(found).toBeNull()
    })
  })

  describe('slugExists', () => {
    it('should return true if slug exists for type', async () => {
      await repository.create({
        type: 'project',
        slug: 'existing-slug',
        data: { title: 'Existing' },
      })

      const exists = await repository.slugExists('project', 'existing-slug')
      expect(exists).toBe(true)
    })

    it('should return false if slug does not exist', async () => {
      const exists = await repository.slugExists('project', 'nonexistent')
      expect(exists).toBe(false)
    })

    it('should return false when excludeId matches', async () => {
      const created = await repository.create({
        type: 'project',
        slug: 'my-slug',
        data: { title: 'My Content' },
      })

      const exists = await repository.slugExists('project', 'my-slug', created.id)
      expect(exists).toBe(false)
    })

    it('should return true for soft-deleted content slug', async () => {
      const created = await repository.create({
        type: 'project',
        slug: 'deleted-slug',
        data: { title: 'Deleted' },
      })
      await repository.delete(created.id)

      const exists = await repository.slugExists('project', 'deleted-slug')
      expect(exists).toBe(true)
    })
  })

  describe('findByType', () => {
    it('should return all content of a type', async () => {
      await repository.create({ type: 'project', slug: 'project-1', data: { title: 'P1' } })
      await repository.create({ type: 'project', slug: 'project-2', data: { title: 'P2' } })
      await repository.create({ type: 'experience', slug: 'exp-1', data: { title: 'E1' } })

      const projects = await repository.findByType('project')

      expect(projects).toHaveLength(2)
      expect(projects.every((p) => p.type === 'project')).toBe(true)
    })

    it('should return empty array if no content of type', async () => {
      const projects = await repository.findByType('project')
      expect(projects).toHaveLength(0)
    })

    it('should order by sortOrder then createdAt desc', async () => {
      await repository.create({ type: 'project', slug: 'p1', data: {}, sortOrder: 2 })
      await repository.create({ type: 'project', slug: 'p2', data: {}, sortOrder: 1 })
      await repository.create({ type: 'project', slug: 'p3', data: {}, sortOrder: 1 })

      const projects = await repository.findByType('project')

      expect(projects[0].sortOrder).toBe(1)
      expect(projects[1].sortOrder).toBe(1)
      expect(projects[2].sortOrder).toBe(2)
    })
  })

  describe('findAll', () => {
    it('should return all content with default pagination', async () => {
      await repository.create({ type: 'project', slug: 'p1', data: {} })
      await repository.create({ type: 'experience', slug: 'e1', data: {} })

      const all = await repository.findAll()

      expect(all).toHaveLength(2)
    })

    it('should filter by type', async () => {
      await repository.create({ type: 'project', slug: 'p1', data: {} })
      await repository.create({ type: 'experience', slug: 'e1', data: {} })

      const projects = await repository.findAll({ type: 'project' })

      expect(projects).toHaveLength(1)
      expect(projects[0].type).toBe('project')
    })

    it('should filter by status', async () => {
      await repository.create({ type: 'project', slug: 'p1', data: {}, status: 'draft' })
      await repository.create({ type: 'project', slug: 'p2', data: {}, status: 'published' })

      const published = await repository.findAll({ status: 'published' })

      expect(published).toHaveLength(1)
      expect(published[0].status).toBe('published')
    })

    it('should include deleted when requested', async () => {
      const created = await repository.create({ type: 'project', slug: 'p1', data: {} })
      await repository.delete(created.id)

      const withoutDeleted = await repository.findAll()
      const withDeleted = await repository.findAll({ includeDeleted: true })

      expect(withoutDeleted).toHaveLength(0)
      expect(withDeleted).toHaveLength(1)
    })

    it('should paginate results', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.create({ type: 'project', slug: `p${i}`, data: {}, sortOrder: i })
      }

      const page1 = await repository.findAll({ limit: 2, offset: 0 })
      const page2 = await repository.findAll({ limit: 2, offset: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(2)
    })
  })

  describe('findByIdIncludingDeleted', () => {
    it('should return soft-deleted content', async () => {
      const created = await repository.create({ type: 'project', slug: 'p1', data: {} })
      await repository.delete(created.id)

      const found = await repository.findByIdIncludingDeleted(created.id)

      expect(found).not.toBeNull()
      expect(found!.deletedAt).not.toBeNull()
    })
  })

  describe('findPublished', () => {
    it('should return only published content', async () => {
      await repository.create({ type: 'project', slug: 'p1', data: {}, status: 'draft' })
      await repository.create({ type: 'project', slug: 'p2', data: {}, status: 'published' })

      const published = await repository.findPublished()

      expect(published).toHaveLength(1)
      expect(published[0].status).toBe('published')
    })

    it('should filter by type when provided', async () => {
      await repository.create({ type: 'project', slug: 'p1', data: {}, status: 'published' })
      await repository.create({ type: 'experience', slug: 'e1', data: {}, status: 'published' })

      const projects = await repository.findPublished('project')

      expect(projects).toHaveLength(1)
      expect(projects[0].type).toBe('project')
    })
  })

  describe('create', () => {
    it('should create content with history entry', async () => {
      const created = await repository.create(
        { type: 'project', slug: 'new-project', data: { title: 'New' } },
        'admin'
      )

      expect(created.id).toMatch(/^content_/)
      expect(created.slug).toBe('new-project')
      expect(created.version).toBe(1)
      expect(created.data).toEqual({ title: 'New' })

      const history = await repository.getHistory(created.id)
      expect(history).toHaveLength(1)
      expect(history[0].changeType).toBe('created')
      expect(history[0].changedBy).toBe('admin')
    })

    it('should set default status to draft', async () => {
      const created = await repository.create({ type: 'project', slug: 'p1', data: {} })
      expect(created.status).toBe('draft')
    })

    it('should allow custom status', async () => {
      const created = await repository.create({
        type: 'project',
        slug: 'p1',
        data: {},
        status: 'published',
      })
      expect(created.status).toBe('published')
    })
  })

  describe('updateWithHistory', () => {
    it('should update content and create history entry', async () => {
      const created = await repository.create({
        type: 'project',
        slug: 'p1',
        data: { title: 'Original' },
      })

      const updated = await repository.updateWithHistory(
        created.id,
        { data: { title: 'Updated' } },
        'editor'
      )

      expect(updated).not.toBeNull()
      expect(updated!.version).toBe(2)
      expect(updated!.data).toEqual({ title: 'Updated' })

      const history = await repository.getHistory(created.id)
      expect(history).toHaveLength(2)
    })

    it('should return null for non-existent id', async () => {
      const result = await repository.updateWithHistory('content_fake', { status: 'published' })
      expect(result).toBeNull()
    })

    it('should update slug', async () => {
      const created = await repository.create({ type: 'project', slug: 'old-slug', data: {} })

      const updated = await repository.updateWithHistory(created.id, { slug: 'new-slug' })

      expect(updated!.slug).toBe('new-slug')
    })

    it('should update status', async () => {
      const created = await repository.create({ type: 'project', slug: 'p1', data: {} })

      const updated = await repository.updateWithHistory(created.id, { status: 'published' })

      expect(updated!.status).toBe('published')
    })

    it('should update sortOrder', async () => {
      const created = await repository.create({ type: 'project', slug: 'p1', data: {} })

      const updated = await repository.updateWithHistory(created.id, { sortOrder: 5 })

      expect(updated!.sortOrder).toBe(5)
    })
  })

  describe('delete (soft)', () => {
    it('should soft delete content', async () => {
      const created = await repository.create({ type: 'project', slug: 'p1', data: {} })

      const result = await repository.delete(created.id, 'admin')

      expect(result).toBe(true)

      const found = await repository.findById(created.id)
      expect(found).toBeNull()

      const foundIncluding = await repository.findByIdIncludingDeleted(created.id)
      expect(foundIncluding!.deletedAt).not.toBeNull()
    })

    it('should create history entry for delete', async () => {
      const created = await repository.create({ type: 'project', slug: 'p1', data: {} })
      await repository.delete(created.id, 'admin')

      const history = await repository.getHistory(created.id)
      const deleteEntry = history.find((h) => h.changeType === 'deleted')
      expect(deleteEntry).toBeDefined()
      expect(deleteEntry!.changedBy).toBe('admin')
    })

    it('should return false for non-existent id', async () => {
      const result = await repository.delete('content_fake')
      expect(result).toBe(false)
    })
  })

  describe('hardDelete', () => {
    it('should permanently delete content', async () => {
      const created = await repository.create({ type: 'project', slug: 'p1', data: {} })

      const result = await repository.hardDelete(created.id)

      expect(result).toBe(true)

      const found = await repository.findByIdIncludingDeleted(created.id)
      expect(found).toBeNull()
    })

    it('should return false for non-existent id', async () => {
      const result = await repository.hardDelete('content_fake')
      expect(result).toBe(false)
    })

    it('should cascade delete history', async () => {
      const created = await repository.create({ type: 'project', slug: 'p1', data: {} })
      await repository.updateWithHistory(created.id, { status: 'published' })

      await repository.hardDelete(created.id)

      const history = await repository.getHistory(created.id)
      expect(history).toHaveLength(0)
    })
  })

  describe('getHistory', () => {
    it('should return history in descending version order', async () => {
      const created = await repository.create({ type: 'project', slug: 'p1', data: {} })
      await repository.updateWithHistory(created.id, { status: 'published' })
      await repository.updateWithHistory(created.id, { sortOrder: 1 })

      const history = await repository.getHistory(created.id)

      expect(history).toHaveLength(3)
      expect(history[0].version).toBe(2)
      expect(history[1].version).toBe(1)
      expect(history[2].version).toBe(1) // Created entry
    })

    it('should paginate history', async () => {
      const created = await repository.create({ type: 'project', slug: 'p1', data: {} })
      for (let i = 0; i < 5; i++) {
        await repository.updateWithHistory(created.id, { sortOrder: i })
      }

      const page = await repository.getHistory(created.id, 2, 1)

      expect(page).toHaveLength(2)
    })
  })

  describe('restoreVersion', () => {
    it('should restore content to previous version', async () => {
      const created = await repository.create({
        type: 'project',
        slug: 'p1',
        data: { title: 'Version 1' },
      })
      await repository.updateWithHistory(created.id, { data: { title: 'Version 2' } })

      const restored = await repository.restoreVersion(created.id, 1, 'admin')

      expect(restored).not.toBeNull()
      expect(restored!.version).toBe(3)
      expect(restored!.data).toEqual({ title: 'Version 1' })
    })

    it('should create history entry for restore', async () => {
      const created = await repository.create({
        type: 'project',
        slug: 'p1',
        data: { title: 'V1' },
      })
      await repository.updateWithHistory(created.id, { data: { title: 'V2' } })
      await repository.restoreVersion(created.id, 1, 'admin')

      const history = await repository.getHistory(created.id)
      const restoreEntry = history.find((h) => h.changeType === 'restored')
      expect(restoreEntry).toBeDefined()
    })

    it('should return null for non-existent content', async () => {
      const result = await repository.restoreVersion('content_fake', 1)
      expect(result).toBeNull()
    })

    it('should return null for non-existent version', async () => {
      const created = await repository.create({ type: 'project', slug: 'p1', data: {} })

      const result = await repository.restoreVersion(created.id, 999)

      expect(result).toBeNull()
    })
  })

  describe('getBundle', () => {
    it('should group published content by type', async () => {
      await repository.create({ type: 'project', slug: 'p1', data: {}, status: 'published' })
      await repository.create({ type: 'project', slug: 'p2', data: {}, status: 'published' })
      await repository.create({ type: 'experience', slug: 'e1', data: {}, status: 'published' })
      await repository.create({ type: 'about', slug: 'about', data: {}, status: 'published' })
      await repository.create({ type: 'contact', slug: 'contact', data: {}, status: 'published' })
      await repository.create({ type: 'project', slug: 'draft', data: {}, status: 'draft' })

      const bundle = await repository.getBundle()

      expect(bundle['project']).toHaveLength(2)
      expect(bundle['experience']).toHaveLength(1)
      expect(bundle['about']).toHaveLength(1)
      expect(bundle['contact']).toHaveLength(1)
      expect(bundle['education']).toBeUndefined()
      expect(bundle['skill']).toBeUndefined()
    })

    it('should return empty bundle when no published content', async () => {
      await repository.create({ type: 'project', slug: 'p1', data: {}, status: 'draft' })

      const bundle = await repository.getBundle()

      expect(Object.keys(bundle)).toHaveLength(0)
    })
  })

  describe('getTypes', () => {
    it('should count only published content', async () => {
      await repository.create({ type: 'project', slug: 'p1', data: {}, status: 'published' })
      await repository.create({ type: 'project', slug: 'p2', data: {}, status: 'published' })
      await repository.create({ type: 'project', slug: 'p3', data: {}, status: 'draft' })
      await repository.create({ type: 'experience', slug: 'e1', data: {}, status: 'published' })
      await repository.create({ type: 'experience', slug: 'e2', data: {}, status: 'archived' })
      await repository.create({ type: 'skill', slug: 's1', data: {}, status: 'draft' })

      const types = await repository.getTypes()

      expect(types).toEqual([
        { type: 'experience', count: 1 },
        { type: 'project', count: 2 },
      ])
    })

    it('should return empty array when no published content', async () => {
      await repository.create({ type: 'project', slug: 'p1', data: {}, status: 'draft' })

      const types = await repository.getTypes()

      expect(types).toEqual([])
    })

    it('should exclude soft-deleted content', async () => {
      const created = await repository.create({ type: 'project', slug: 'p1', data: {}, status: 'published' })
      await repository.delete(created.id)

      const types = await repository.getTypes()

      expect(types).toEqual([])
    })
  })
})
