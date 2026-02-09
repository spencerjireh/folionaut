import { Router, type Request, type Response } from 'express'
import { contentService } from '@/services/content.service'
import { adminAuthMiddleware } from '@/middleware/admin-auth.middleware'
import { idempotencyMiddleware } from '@/middleware/idempotency.middleware'
import { asyncHandler } from '@/lib/async-handler'

export const adminContentRouter = Router()

// Apply admin auth to all routes
adminContentRouter.use(adminAuthMiddleware())

/**
 * GET /api/v1/admin/content
 * List all content (including drafts, optionally deleted).
 */
adminContentRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const options = contentService.validateAdminListQuery(req.query)
    const { data } = await contentService.getAllContent(options)
    res.json({ data })
  })
)

/**
 * POST /api/v1/admin/content
 * Create new content.
 */
adminContentRouter.post(
  '/',
  idempotencyMiddleware(),
  asyncHandler(async (req: Request, res: Response) => {
    const dto = contentService.validateCreateRequest(req.body)
    const changedBy = (req as Request & { userId?: string }).userId ?? 'unknown'
    const { data } = await contentService.createContent(dto, changedBy)
    res.status(201).json({ data })
  })
)

/**
 * GET /api/v1/admin/content/:id
 * Get a single content item by ID.
 */
adminContentRouter.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = contentService.validateContentIdParam(req.params)
    const { data } = await contentService.getContentById(id)
    res.json({ data })
  })
)

/**
 * PUT /api/v1/admin/content/:id
 * Update existing content.
 */
adminContentRouter.put(
  '/:id',
  idempotencyMiddleware(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = contentService.validateContentIdParam(req.params)
    const dto = contentService.validateUpdateRequest(req.body)
    const changedBy = (req as Request & { userId?: string }).userId ?? 'unknown'
    const { data } = await contentService.updateContent(id, dto, changedBy)
    res.json({ data })
  })
)

/**
 * DELETE /api/v1/admin/content/:id
 * Delete content (soft by default, hard with ?hard=true).
 */
adminContentRouter.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = contentService.validateContentIdParam(req.params)
    const { hard } = contentService.validateDeleteQuery(req.query)
    const changedBy = (req as Request & { userId?: string }).userId ?? 'unknown'
    const { success } = await contentService.deleteContent(id, hard, changedBy)
    res.json({ success })
  })
)

/**
 * GET /api/v1/admin/content/:id/history
 * Get version history for content.
 */
adminContentRouter.get(
  '/:id/history',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = contentService.validateContentIdParam(req.params)
    const { limit, offset } = contentService.validateHistoryQuery(req.query)
    const { data } = await contentService.getContentHistory(id, limit, offset)
    res.json({ data })
  })
)

/**
 * POST /api/v1/admin/content/:id/restore
 * Restore content to a previous version.
 */
adminContentRouter.post(
  '/:id/restore',
  idempotencyMiddleware(),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = contentService.validateContentIdParam(req.params)
    const { version } = contentService.validateRestoreRequest(req.body)
    const changedBy = (req as Request & { userId?: string }).userId ?? 'unknown'
    const { data } = await contentService.restoreContentVersion(id, version, changedBy)
    res.json({ data })
  })
)
