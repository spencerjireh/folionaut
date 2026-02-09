import { Router, type Request, type Response } from 'express'
import { chatService } from '@/services/chat.service'
import { extractClientIP, hashIP } from '@/lib/ip'
import { asyncHandler } from '@/lib/async-handler'

export const chatRouter = Router()

/**
 * POST /api/v1/chat
 * Send a message to the chat assistant.
 *
 * Body: { message: string, visitorId: string }
 * Query: { includeToolCalls?: 'true' }
 * Response: { sessionId, message: { id, role, content, createdAt }, tokensUsed, toolCalls? }
 */
chatRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    // Validate request body
    const { message, visitorId } = chatService.validateSendMessageRequest(req.body)

    // Extract and hash client IP for rate limiting
    const clientIP = extractClientIP(req)
    const ipHash = hashIP(clientIP)

    // Get user agent
    const userAgent = req.headers['user-agent']

    // Check if tool calls should be included in response
    const includeToolCalls = req.query.includeToolCalls === 'true'

    // Send message and get response
    const response = await chatService.sendMessage({
      visitorId,
      ipHash,
      message,
      userAgent,
      includeToolCalls,
    })

    res.json(response)
  })
)
