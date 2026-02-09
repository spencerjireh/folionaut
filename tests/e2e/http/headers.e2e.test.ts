import { api, adminHeaders } from '../helpers/e2e-client'

describe('Response headers (E2E)', () => {
  it('every response has X-Request-Id', async () => {
    const res = await api().get('/')
    expect(res.headers['x-request-id']).toBeDefined()
    expect(typeof res.headers['x-request-id']).toBe('string')
  })

  it('content list response has ETag', async () => {
    const res = await api().get('/api/v1/content')
    expect(res.status).toBe(200)
    expect(res.headers['etag']).toBeDefined()
  })

  it('conditional request with matching ETag returns 304', async () => {
    const res1 = await api().get('/api/v1/content')
    const etag = res1.headers['etag']
    expect(etag).toBeDefined()

    const res2 = await api().get('/api/v1/content').set('If-None-Match', etag)
    expect(res2.status).toBe(304)
  })

  it('Helmet security headers are present', async () => {
    const res = await api().get('/')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
    expect(res.headers['x-frame-options']).toBeDefined()
  })

  it('CORS preflight from allowed origin returns correct headers', async () => {
    const res = await api()
      .options('/api/v1/content')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET')
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000')
  })

  it('disallowed origin gets no CORS headers', async () => {
    const res = await api()
      .options('/api/v1/content')
      .set('Origin', 'http://evil.com')
      .set('Access-Control-Request-Method', 'GET')
    expect(res.headers['access-control-allow-origin']).toBeUndefined()
  })
})
