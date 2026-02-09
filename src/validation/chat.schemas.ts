import { z } from 'zod'

export const SendMessageRequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message must be 2000 characters or less'),
  visitorId: z
    .string()
    .min(1, 'Visitor ID is required')
    .max(100, 'Visitor ID must be 100 characters or less'),
})

export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>

export const SessionIdParamSchema = z.object({
  id: z.string().startsWith('sess_', 'Invalid session ID format'),
})

export type SessionIdParam = z.infer<typeof SessionIdParamSchema>

export const SessionListQuerySchema = z.object({
  status: z.enum(['active', 'ended', 'expired']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export type SessionListQuery = z.infer<typeof SessionListQuerySchema>
