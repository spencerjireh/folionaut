import { randomUUID } from 'node:crypto'
import { Router, type Request, type Response } from 'express'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js'
import { registerTools } from './tools'
import { registerResources } from './resources'
import { registerPrompts } from './prompts'

const SESSION_TTL_MS = 30 * 60 * 1000 // 30 minutes
const REAP_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

interface SessionEntry {
  transport: StreamableHTTPServerTransport
  lastAccessed: number
}

const sessions = new Map<string, SessionEntry>()

// Reaper interval to evict stale sessions
const reaper = setInterval(() => {
  const now = Date.now()
  for (const [sessionId, entry] of sessions) {
    if (now - entry.lastAccessed > SESSION_TTL_MS) {
      entry.transport.close()
      sessions.delete(sessionId)
    }
  }
}, REAP_INTERVAL_MS)
reaper.unref()

function touchSession(sessionId: string) {
  const entry = sessions.get(sessionId)
  if (entry) {
    entry.lastAccessed = Date.now()
  }
}

function createMcpSession(): {
  server: McpServer
  transport: StreamableHTTPServerTransport
} {
  const server = new McpServer({
    name: 'folionaut-mcp',
    version: '1.0.0',
  })

  registerTools(server)
  registerResources(server)
  registerPrompts(server)

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId: string) => {
      sessions.set(sessionId, { transport, lastAccessed: Date.now() })
    },
  })

  transport.onclose = () => {
    const sid = transport.sessionId
    if (sid) {
      sessions.delete(sid)
    }
  }

  return { server, transport }
}

export function closeMcpSessions() {
  for (const [sessionId, entry] of sessions) {
    entry.transport.close()
    sessions.delete(sessionId)
  }
}

export const mcpRouter = Router()

// POST -- JSON-RPC requests
mcpRouter.post('/', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined

  try {
    if (sessionId && sessions.has(sessionId)) {
      touchSession(sessionId)
      const { transport } = sessions.get(sessionId)!
      await transport.handleRequest(req, res, req.body)
      return
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      const { server, transport } = createMcpSession()
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
      return
    }

    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    })
  } catch {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      })
    }
  }
})

// GET -- SSE stream for server-initiated notifications
mcpRouter.get('/', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined

  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Invalid or missing session ID',
      },
      id: null,
    })
    return
  }

  touchSession(sessionId)
  const { transport } = sessions.get(sessionId)!
  await transport.handleRequest(req, res)
})

// DELETE -- session cleanup
mcpRouter.delete('/', async (req: Request, res: Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined

  if (!sessionId || !sessions.has(sessionId)) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Invalid or missing session ID',
      },
      id: null,
    })
    return
  }

  touchSession(sessionId)
  const { transport } = sessions.get(sessionId)!
  await transport.handleRequest(req, res)
})
