import { Router, type Request, type Response } from 'express'
import { chatService } from '@/services/chat.service'
import { adminAuthMiddleware } from '@/middleware/admin-auth.middleware'
import { asyncHandler } from '@/lib/async-handler'

export const adminChatRouter = Router()

// Apply admin auth to all routes
adminChatRouter.use(adminAuthMiddleware())

/**
 * GET /api/v1/admin/chat/sessions
 * List chat sessions with optional filtering.
 *
 * Query: { status?: 'active' | 'ended' | 'expired', limit?: number, offset?: number }
 */
adminChatRouter.get(
  '/sessions',
  asyncHandler(async (req: Request, res: Response) => {
    const options = chatService.validateSessionListQuery(req.query)
    const sessions = await chatService.listSessions(options)
    res.json({ data: sessions })
  })
)

/**
 * GET /api/v1/admin/chat/sessions/:id
 * Get a single session with all its messages.
 */
adminChatRouter.get(
  '/sessions/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = chatService.validateSessionIdParam(req.params)
    const session = await chatService.getSession(id)
    res.json({ data: session })
  })
)

/**
 * DELETE /api/v1/admin/chat/sessions/:id
 * End a chat session.
 */
adminChatRouter.delete(
  '/sessions/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = chatService.validateSessionIdParam(req.params)
    const result = await chatService.endSession(id)
    res.json(result)
  })
)
