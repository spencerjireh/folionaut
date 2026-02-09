import { api, adminHeaders } from '../helpers/e2e-client'

describe('Content CRUD (E2E)', () => {
  it('creates a project via admin API -> 201 with id, slug, version=1', async () => {
    const res = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'project',
        data: {
          title: 'Test Project',
          description: 'A test project for E2E tests',
          tags: ['typescript', 'testing'],
        },
      })

    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty('id')
    expect(res.body.data.id).toMatch(/^content_/)
    expect(res.body.data.slug).toBe('test-project')
    expect(res.body.data.version).toBe(1)
  })

  it('reads back the created project -> 200', async () => {
    const createRes = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'project',
        data: { title: 'Read Back', description: 'Read it back', tags: [] },
      })

    const id = createRes.body.data.id

    const readRes = await api().get(`/api/v1/admin/content/${id}`).set(adminHeaders())
    expect(readRes.status).toBe(200)
    expect(readRes.body.data.id).toBe(id)
  })

  it('update increments version to 2', async () => {
    const createRes = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'project',
        data: { title: 'Update Me', description: 'Will be updated', tags: [] },
      })

    const id = createRes.body.data.id

    const updateRes = await api()
      .put(`/api/v1/admin/content/${id}`)
      .set(adminHeaders())
      .send({ data: { title: 'Updated Title', description: 'Updated description', tags: ['updated'] } })

    expect(updateRes.status).toBe(200)
    expect(updateRes.body.data.version).toBe(2)
  })

  it('history shows created + updated entries', async () => {
    const createRes = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'project',
        data: { title: 'History Test', description: 'For history', tags: [] },
      })

    const id = createRes.body.data.id

    await api()
      .put(`/api/v1/admin/content/${id}`)
      .set(adminHeaders())
      .send({ data: { title: 'History Updated', description: 'Updated', tags: [] } })

    const historyRes = await api()
      .get(`/api/v1/admin/content/${id}/history`)
      .set(adminHeaders())

    expect(historyRes.status).toBe(200)
    const changeTypes = historyRes.body.data.map((h: { changeType: string }) => h.changeType)
    expect(changeTypes).toContain('created')
    expect(changeTypes).toContain('updated')
  })

  it('soft delete makes item invisible on public API', async () => {
    const createRes = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'project',
        slug: 'delete-me',
        data: { title: 'Delete Me', description: 'Will be deleted', tags: [] },
        status: 'published',
      })

    const id = createRes.body.data.id

    // Soft delete
    const deleteRes = await api()
      .delete(`/api/v1/admin/content/${id}`)
      .set(adminHeaders())
    expect(deleteRes.status).toBe(200)
    expect(deleteRes.body.success).toBe(true)

    // Public API should not show it
    const publicRes = await api().get('/api/v1/content/project/delete-me')
    expect(publicRes.status).toBe(404)
  })

  it('restore reverts content to a previous version', async () => {
    // Create -> update -> restore to version 1
    const createRes = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'project',
        slug: 'restore-me',
        data: { title: 'Original Title', description: 'Original', tags: [] },
        status: 'published',
      })

    const id = createRes.body.data.id

    // Update to version 2
    await api()
      .put(`/api/v1/admin/content/${id}`)
      .set(adminHeaders())
      .send({ data: { title: 'Changed Title', description: 'Changed', tags: [] } })

    // Restore to version 1
    const restoreRes = await api()
      .post(`/api/v1/admin/content/${id}/restore`)
      .set(adminHeaders())
      .send({ version: 1 })

    expect(restoreRes.status).toBe(200)
    expect(restoreRes.body.data.version).toBe(3)
    // Data should be from version 1
    expect(restoreRes.body.data.data.title).toBe('Original Title')
  })

  it('auto-generates slug from title', async () => {
    const res = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'project',
        data: { title: 'My Cool Project!', description: 'Auto slug', tags: [] },
      })

    expect(res.status).toBe(201)
    expect(res.body.data.slug).toBe('my-cool-project')
  })

  it('duplicate slug returns 409', async () => {
    await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'project',
        slug: 'unique-slug',
        data: { title: 'First', description: 'First one', tags: [] },
      })

    const res = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'project',
        slug: 'unique-slug',
        data: { title: 'Second', description: 'Duplicate', tags: [] },
      })

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('CONFLICT')
  })

  it('invalid content type returns 400', async () => {
    const res = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'invalid_type',
        data: { title: 'Bad Type', description: 'Nope', tags: [] },
      })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('hard delete permanently removes item and cascades history', async () => {
    const createRes = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'project',
        slug: 'hard-delete-me',
        data: { title: 'Hard Delete Me', description: 'Will be hard deleted', tags: [] },
      })

    const id = createRes.body.data.id

    // Update once so there is history
    await api()
      .put(`/api/v1/admin/content/${id}`)
      .set(adminHeaders())
      .send({ data: { title: 'Updated Before Hard Delete', description: 'Updated', tags: [] } })

    // Hard delete
    const deleteRes = await api()
      .delete(`/api/v1/admin/content/${id}?hard=true`)
      .set(adminHeaders())
    expect(deleteRes.status).toBe(200)
    expect(deleteRes.body.success).toBe(true)

    // Admin GET should return 404
    const getRes = await api()
      .get(`/api/v1/admin/content/${id}`)
      .set(adminHeaders())
    expect(getRes.status).toBe(404)

    // Should not appear even with includeDeleted
    const listRes = await api()
      .get('/api/v1/admin/content?includeDeleted=true')
      .set(adminHeaders())
    const ids = listRes.body.data.map((item: { id: string }) => item.id)
    expect(ids).not.toContain(id)

    // History should be cascade-deleted
    const historyRes = await api()
      .get(`/api/v1/admin/content/${id}/history`)
      .set(adminHeaders())
    expect(historyRes.status).toBe(404)
  })

  describe('admin list query filters', () => {
    it('includeDeleted=true shows soft-deleted items', async () => {
      const createRes = await api()
        .post('/api/v1/admin/content')
        .set(adminHeaders())
        .send({
          type: 'project',
          slug: 'filter-deleted',
          data: { title: 'Filter Deleted', description: 'Will be soft deleted', tags: [] },
        })

      const id = createRes.body.data.id

      // Soft delete
      await api().delete(`/api/v1/admin/content/${id}`).set(adminHeaders())

      // Default list should not contain it
      const defaultList = await api()
        .get('/api/v1/admin/content')
        .set(adminHeaders())
      const defaultIds = defaultList.body.data.map((item: { id: string }) => item.id)
      expect(defaultIds).not.toContain(id)

      // includeDeleted should contain it with non-null deletedAt
      const deletedList = await api()
        .get('/api/v1/admin/content?includeDeleted=true')
        .set(adminHeaders())
      const deletedItem = deletedList.body.data.find((item: { id: string }) => item.id === id)
      expect(deletedItem).toBeDefined()
      expect(deletedItem.deletedAt).not.toBeNull()
    })

    it('status filter returns only matching items', async () => {
      await api()
        .post('/api/v1/admin/content')
        .set(adminHeaders())
        .send({
          type: 'project',
          slug: 'filter-draft',
          data: { title: 'Draft Project', description: 'Draft', tags: [] },
          status: 'draft',
        })

      await api()
        .post('/api/v1/admin/content')
        .set(adminHeaders())
        .send({
          type: 'project',
          slug: 'filter-published',
          data: { title: 'Published Project', description: 'Published', tags: [] },
          status: 'published',
        })

      const res = await api()
        .get('/api/v1/admin/content?status=draft')
        .set(adminHeaders())

      expect(res.status).toBe(200)
      for (const item of res.body.data) {
        expect(item.status).toBe('draft')
      }
      const slugs = res.body.data.map((item: { slug: string }) => item.slug)
      expect(slugs).not.toContain('filter-published')
    })

    it('type filter returns only matching content type', async () => {
      await api()
        .post('/api/v1/admin/content')
        .set(adminHeaders())
        .send({
          type: 'project',
          slug: 'filter-type-proj',
          data: { title: 'Type Filter Project', description: 'Project', tags: [] },
        })

      await api()
        .post('/api/v1/admin/content')
        .set(adminHeaders())
        .send({
          type: 'skill',
          slug: 'filter-type-skill',
          data: { items: [{ name: 'Go', category: 'language' }] },
        })

      const res = await api()
        .get('/api/v1/admin/content?type=project')
        .set(adminHeaders())

      expect(res.status).toBe(200)
      for (const item of res.body.data) {
        expect(item.type).toBe('project')
      }
      const slugs = res.body.data.map((item: { slug: string }) => item.slug)
      expect(slugs).not.toContain('filter-type-skill')
    })
  })

  describe('pagination', () => {
    it('limit and offset paginate results without overlap', async () => {
      // Create 4 projects
      for (let i = 0; i < 4; i++) {
        await api()
          .post('/api/v1/admin/content')
          .set(adminHeaders())
          .send({
            type: 'project',
            slug: `paginate-${i}`,
            data: { title: `Paginate ${i}`, description: `Page item ${i}`, tags: [] },
          })
      }

      const page1 = await api()
        .get('/api/v1/admin/content?limit=2&offset=0')
        .set(adminHeaders())
      expect(page1.status).toBe(200)
      expect(page1.body.data.length).toBe(2)

      const page2 = await api()
        .get('/api/v1/admin/content?limit=2&offset=2')
        .set(adminHeaders())
      expect(page2.status).toBe(200)
      expect(page2.body.data.length).toBe(2)

      // No overlap
      const page1Ids = page1.body.data.map((item: { id: string }) => item.id)
      const page2Ids = page2.body.data.map((item: { id: string }) => item.id)
      for (const id of page1Ids) {
        expect(page2Ids).not.toContain(id)
      }

      // Beyond data returns empty
      const page3 = await api()
        .get('/api/v1/admin/content?limit=2&offset=4')
        .set(adminHeaders())
      expect(page3.status).toBe(200)
      expect(page3.body.data.length).toBe(0)
    })
  })

  describe('multiple content types', () => {
    const contentTypes = [
      {
        type: 'project',
        data: { title: 'Project', description: 'A project', tags: [] },
      },
      {
        type: 'experience',
        slug: 'e2e-experience',
        data: {
          items: [
            {
              company: 'Acme',
              role: 'Developer',
              startDate: '2023-01',
              endDate: null,
              skills: [],
            },
          ],
        },
      },
      {
        type: 'skill',
        slug: 'e2e-skills',
        data: { items: [{ name: 'TypeScript', category: 'language' }] },
      },
      {
        type: 'about',
        data: { title: 'About Me', content: 'Some content about me.' },
      },
      {
        type: 'contact',
        slug: 'e2e-contact',
        data: {
          name: 'Test User',
          title: 'Developer',
          email: 'test@example.com',
          social: {},
        },
      },
      {
        type: 'education',
        slug: 'e2e-education',
        data: {
          items: [
            {
              institution: 'MIT',
              degree: 'BS Computer Science',
              startDate: '2019-09',
              endDate: '2023-06',
            },
          ],
        },
      },
    ]

    it.each(contentTypes)('creates content of type "$type"', async ({ type, data, ...rest }) => {
      const res = await api()
        .post('/api/v1/admin/content')
        .set(adminHeaders())
        .send({ type, data, ...rest })

      expect(res.status).toBe(201)
      expect(res.body.data.type).toBe(type)
    })
  })
})
