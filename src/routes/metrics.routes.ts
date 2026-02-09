import { Router } from 'express'
import { registry } from '@/observability'

export const metricsRouter = Router()

metricsRouter.get('/', async (_req, res) => {
  try {
    const metrics = await registry.metrics()
    res.set('Content-Type', registry.contentType)
    res.send(metrics)
  } catch {
    res.status(500).send('Error collecting metrics')
  }
})
