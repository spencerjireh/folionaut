import { api, adminHeaders } from '../helpers/e2e-client'

describe('Admin authentication (E2E)', () => {
  it('returns 401 when X-Admin-Key is missing', async () => {
    const res = await api().get('/api/v1/admin/content')
    expect(res.status).toBe(401)
  })

  it('returns 401 when X-Admin-Key is wrong', async () => {
    const res = await api()
      .get('/api/v1/admin/content')
      .set('X-Admin-Key', 'wrong-key-that-is-definitely-not-valid-32c')
    expect(res.status).toBe(401)
  })

  it('returns 200 with correct admin key', async () => {
    const res = await api().get('/api/v1/admin/content').set(adminHeaders())
    expect(res.status).toBe(200)
  })

  it('all admin content routes enforce auth', async () => {
    const routes = [
      { method: 'get' as const, path: '/api/v1/admin/content' },
      { method: 'post' as const, path: '/api/v1/admin/content' },
      { method: 'get' as const, path: '/api/v1/admin/content/content_fake-id' },
      { method: 'put' as const, path: '/api/v1/admin/content/content_fake-id' },
      { method: 'delete' as const, path: '/api/v1/admin/content/content_fake-id' },
    ]

    for (const route of routes) {
      const res = await api()[route.method](route.path)
      expect(res.status).toBe(401)
    }
  })

  it('admin chat routes enforce auth', async () => {
    const res = await api().get('/api/v1/admin/chat/sessions')
    expect(res.status).toBe(401)
  })

  it('/api/metrics requires auth', async () => {
    const res = await api().get('/api/metrics')
    expect(res.status).toBe(401)
  })

  it('public routes do not require auth', async () => {
    const publicRoutes = ['/api/v1/content', '/api/health/live']

    for (const path of publicRoutes) {
      const res = await api().get(path)
      expect(res.status).not.toBe(401)
    }
  })
})
