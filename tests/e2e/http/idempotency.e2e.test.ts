import { api, adminHeaders } from '../helpers/e2e-client'

describe('Idempotency (E2E)', () => {
  it('POST with Idempotency-Key returns 201, replay returns same body + header', async () => {
    const idempotencyKey = `idem-${Date.now()}`
    const payload = {
      type: 'project',
      data: { title: 'Idempotent Project', description: 'Testing idempotency', tags: [] },
    }

    const res1 = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .set('Idempotency-Key', idempotencyKey)
      .send(payload)

    expect(res1.status).toBe(201)

    const res2 = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .set('Idempotency-Key', idempotencyKey)
      .send(payload)

    expect(res2.status).toBe(201)
    expect(res2.body).toEqual(res1.body)
    expect(res2.headers['x-idempotent-replayed']).toBe('true')
  })

  it('different Idempotency-Key creates a new item', async () => {
    const res1 = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .set('Idempotency-Key', `key-a-${Date.now()}`)
      .send({
        type: 'project',
        slug: 'idem-a',
        data: { title: 'A', description: 'A', tags: [] },
      })

    const res2 = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .set('Idempotency-Key', `key-b-${Date.now()}`)
      .send({
        type: 'project',
        slug: 'idem-b',
        data: { title: 'B', description: 'B', tags: [] },
      })

    expect(res1.status).toBe(201)
    expect(res2.status).toBe(201)
    expect(res1.body.data.id).not.toBe(res2.body.data.id)
  })

  it('PUT with Idempotency-Key replays correctly', async () => {
    const createRes = await api()
      .post('/api/v1/admin/content')
      .set(adminHeaders())
      .send({
        type: 'project',
        data: { title: 'Put Idem', description: 'For PUT test', tags: [] },
      })

    const id = createRes.body.data.id
    const idempotencyKey = `put-idem-${Date.now()}`

    const updatePayload = {
      data: { title: 'Put Updated', description: 'Updated via PUT', tags: [] },
    }

    const res1 = await api()
      .put(`/api/v1/admin/content/${id}`)
      .set(adminHeaders())
      .set('Idempotency-Key', idempotencyKey)
      .send(updatePayload)

    expect(res1.status).toBe(200)

    const res2 = await api()
      .put(`/api/v1/admin/content/${id}`)
      .set(adminHeaders())
      .set('Idempotency-Key', idempotencyKey)
      .send(updatePayload)

    expect(res2.status).toBe(200)
    expect(res2.body).toEqual(res1.body)
    expect(res2.headers['x-idempotent-replayed']).toBe('true')
  })
})
