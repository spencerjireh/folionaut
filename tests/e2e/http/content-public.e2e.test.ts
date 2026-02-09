import { api, adminHeaders, truncateAll } from '../helpers/e2e-client'

describe('Public content API (E2E)', () => {
  // Helper to seed content for tests that need it
  async function seedContent() {
    await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'project',
        slug: 'published-project',
        data: { title: 'Published Project', description: 'A published project', tags: ['node'] },
        status: 'published',
      })

    await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'project',
        slug: 'draft-project',
        data: { title: 'Draft Project', description: 'A draft project', tags: [] },
        status: 'draft',
      })

    await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'skill',
        slug: 'published-skills',
        data: { items: [{ name: 'TypeScript', category: 'language' }] },
        status: 'published',
      })
  }

  it('GET /api/v1/content returns only published items', async () => {
    await seedContent()

    const res = await api().get('/api/v1/content')
    expect(res.status).toBe(200)

    const slugs = res.body.data.map((item: { slug: string }) => item.slug)
    expect(slugs).toContain('published-project')
    expect(slugs).toContain('published-skills')
    expect(slugs).not.toContain('draft-project')
  })

  it('?type=project filters by type', async () => {
    await seedContent()

    const res = await api().get('/api/v1/content?type=project')
    expect(res.status).toBe(200)

    for (const item of res.body.data) {
      expect(item.type).toBe('project')
    }
  })

  it('GET /api/v1/content/project/:slug returns the item', async () => {
    await seedContent()

    const res = await api().get('/api/v1/content/project/published-project')
    expect(res.status).toBe(200)
    expect(res.body.data.slug).toBe('published-project')
    expect(res.body.data.data).toHaveProperty('title', 'Published Project')
  })

  it('draft slug returns 404', async () => {
    await seedContent()

    const res = await api().get('/api/v1/content/project/draft-project')
    expect(res.status).toBe(404)
  })

  it('GET /api/v1/content/bundle returns grouped content', async () => {
    await seedContent()

    const res = await api().get('/api/v1/content/bundle')
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('projects')
    expect(res.body.data).toHaveProperty('skills')
    expect(Array.isArray(res.body.data.projects)).toBe(true)
  })

  it('empty DB returns empty arrays', async () => {
    const res = await api().get('/api/v1/content')
    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})
