---
title: MCP Server & AI Tools
description: Model Context Protocol server and chat tool integration
---

# MCP Server & AI Tools

## Overview

Folionaut provides AI tools through two interfaces:

1. **MCP Server** -- a [Model Context Protocol](https://modelcontextprotocol.io/) server for AI assistants like Claude Desktop. Supports 7 tools (read + write) via **two transports**: stdio (local) and Streamable HTTP (remote).
2. **Chat Service** -- an OpenAI function-calling integration that gives the chat endpoint access to the 4 read-only tools.

Both share the same core tool implementations in `src/tools/core/`, ensuring consistent behavior.

```mermaid
flowchart TB
    subgraph SharedTools["Shared Tools Layer (src/tools/core/)"]
        List["listContent()"]
        Get["getContent()"]
        Search["searchContent()"]
    end

    subgraph Transports["MCP Transports"]
        Stdio["Stdio Transport\nbun run mcp\n(local, standalone process)"]
        HTTP["Streamable HTTP Transport\nPOST/GET/DELETE /api/mcp\n(remote, Express-mounted)"]
    end

    MCP["MCP Server\n7 tools (read + write)\nMCP SDK response format"]
    Chat["Chat Service\n4 tools (read only)\nOpenAI function calling"]

    SharedTools --> MCP
    SharedTools --> Chat
    MCP --> Stdio
    MCP --> HTTP
```

## Transports

The MCP server is available over two transports. Both expose the same tools, resources, and prompts.

### Stdio (Local)

The stdio transport runs the MCP server as a standalone child process. This is the standard approach for local AI assistants like Claude Desktop.

- Start with: `bun run mcp`
- Communication over stdin/stdout using JSON-RPC
- Requires database environment variables to be set in the process

### Streamable HTTP (Remote)

The Streamable HTTP transport mounts the MCP server on the Express application at `/api/mcp`, protected by admin authentication.

- **Endpoint**: `POST/GET/DELETE /api/mcp`
- **Auth**: Requires `X-Admin-Key` header (same as other admin endpoints)
- **Sessions**: Stateful sessions managed via the `mcp-session-id` response/request header
- **Protocol**:
  - `POST /api/mcp` -- Send JSON-RPC requests (initialize, tool calls, etc.)
  - `GET /api/mcp` -- Open SSE stream for server-initiated notifications
  - `DELETE /api/mcp` -- Terminate an MCP session

This transport enables remote MCP clients, CI/CD integrations, and any HTTP-capable tool to interact with the MCP server without spawning a local process.

## Content Types

All tools operate on the unified content model. Content types are **free-form strings** matching `/^[a-z0-9-]+$/` (max 100 characters). There is no fixed enum -- you can use any type string. Common examples include `project`, `experience`, `education`, `skill`, `about`, `contact`, `blog-post`, `certification`, `testimonial`, etc.

Use the `list_types` tool to discover which types currently exist in the database.

See [Content Model Reference](/architecture/content-model) for details on the data column and custom content types.

---

## Shared Read Tools

These 4 tools are available in both the MCP server and the chat service.

### `list_types`

List all distinct content types that exist in the database.

```typescript
// No input parameters

interface ListTypesOutput {
  types: string[]    // e.g., ["project", "experience", "blog-post", "certification"]
}
```

**Example invocation:**
```
User: "What kinds of content do you have?"
AI calls: list_types()
```

### `list_content`

List content items by type with optional status filter.

```typescript
interface ListContentInput {
  type: string                                  // Content type (e.g., "project", "blog-post")
  status?: 'draft' | 'published' | 'archived'  // default: 'published'
  limit?: number                                // default: 50, max: 100
}

interface ListContentOutput {
  items: Array<{
    id: string
    slug: string
    type: string
    data: Record<string, unknown>
    status: string
    version: number
    sortOrder: number
    createdAt: string
    updatedAt: string
  }>
}
```

**Example invocation:**
```
User: "Show me all published projects"
AI calls: list_content({ type: "project", status: "published" })
```

### `get_content`

Get a single content item by type and slug.

```typescript
interface GetContentInput {
  type: string     // Content type (e.g., "project", "blog-post")
  slug: string
}

interface GetContentOutput {
  item: {
    id: string
    slug: string
    type: string
    data: Record<string, unknown>
    status: string
    version: number
    sortOrder: number
    createdAt: string
    updatedAt: string
  }
}
```

**Example invocation:**
```
User: "Tell me about the folionaut project"
AI calls: get_content({ type: "project", slug: "folionaut" })
```

### `search_content`

Search content by query across title, description, name, and other text fields.

```typescript
interface SearchContentInput {
  query: string                                  // Search query
  type?: string                                  // Optional type filter (e.g., "project")
  limit?: number                                 // default: 10, max: 50
}

interface SearchContentOutput {
  items: Array<{
    id: string
    slug: string
    type: string
    data: Record<string, unknown>
    status: string
  }>
}
```

**Example invocation:**
```
User: "What projects use TypeScript?"
AI calls: search_content({ query: "typescript", type: "project" })
```

---

## MCP-Only Write Tools

These tools are only available through the MCP server (not in chat).

### `create_content`

Create new content. Returns `{ item: {...} }` with the created content.

```typescript
interface CreateContentInput {
  type: string                                   // Any string matching /^[a-z0-9-]+$/
  slug?: string                                  // Auto-generated from title/name if not provided
  data: Record<string, unknown>                  // Any JSON object
  status?: 'draft' | 'published' | 'archived'   // default: 'draft'
  sortOrder?: number                             // default: 0
}
```

### `update_content`

Update existing content with version history tracking. Returns `{ item: {...} }` with the updated content.

```typescript
interface UpdateContentInput {
  id: string                                     // Content ID to update
  slug?: string
  data?: Record<string, unknown>
  status?: 'draft' | 'published' | 'archived'
  sortOrder?: number
}
```

### `delete_content`

Soft delete content (can be restored later). Returns `{ id, type, slug }` of the deleted content.

```typescript
interface DeleteContentInput {
  id: string                                     // Content ID to delete
}
```

---

## MCP Resources

Resources are URIs that AI can read to get content. Unlike tools, resources are read-only and follow a URI pattern. Resource templates use **dynamic discovery** -- the available types are determined at runtime from the database, not from a hardcoded list.

| URI | Description | Returns |
|-----|-------------|---------|
| `folionaut://content` | All published content | JSON array of all content items |
| `folionaut://content/{type}` | Content by type | JSON array of content for specified type |
| `folionaut://content/{type}/{slug}` | Single content item | Full content item JSON |

The `{type}` parameter accepts any valid content type string. The MCP server uses `ResourceTemplate` with a `list` callback that queries the database for all distinct types, so clients automatically discover available content types without any hardcoded configuration.

**Example URIs:**
- `folionaut://content/project`
- `folionaut://content/blog-post`
- `folionaut://content/certification`
- `folionaut://content/project/folionaut`

## MCP Prompts

Pre-defined prompt templates for common use cases.

### `summarize_portfolio`

Generate a summary of the entire portfolio covering professional background, key skills, notable projects, and career trajectory. Takes no arguments.

### `explain_project`

Explain a project's technical decisions and architecture.

```typescript
interface ExplainProjectInput {
  slug: string
  depth: 'overview' | 'detailed' | 'deep-dive'
}
```

### `compare_skills`

Compare the portfolio owner's skills to a job requirement.

```typescript
interface CompareSkillsInput {
  requiredSkills: string[]
  niceToHave?: string[]
}
```

---

## Chat Integration

The chat service (`POST /api/v1/chat`) uses OpenAI function calling to give the AI assistant access to the same 4 read tools. The chat service also includes:

- **Input guardrails** -- validates and sanitizes user messages before sending to the LLM
- **Output guardrails** -- checks LLM responses for PII leakage before returning to the user
- **PII sanitization** -- LLM responses are checked for PII and redacted before returning to the user

### Tool Call Flow

```mermaid
flowchart TD
    A[1. User sends message] --> B[2. Input guardrails check]
    B -->|Blocked| F2[Return guardrail response]
    B -->|Passed| C[3. Build conversation + system prompt]
    C --> D[4. Call LLM with tools]
    D --> E{LLM decides}

    E -->|tool_call| G[5. Execute tool]
    E -->|response| H[6. Output guardrails check]

    G --> I[7. Add tool result to history]
    I --> J{Iteration < 5?}
    J -->|Yes| D
    J -->|No| H

    H -->|Passed| F[Return to user]
    H -->|PII detected| F3[Return sanitized response]
```

### Sequence Diagram

```mermaid
sequenceDiagram
    participant Client
    participant ChatSvc as Chat Service
    participant LLM
    participant Tools

    Client->>ChatSvc: POST /chat "What projects use React?"
    ChatSvc->>ChatSvc: Input guardrails
    ChatSvc->>LLM: messages + tools
    LLM-->>ChatSvc: tool_call: search_content {query: "react"}
    ChatSvc->>Tools: search_content({query: "react"})
    Tools-->>ChatSvc: [{slug: "portfolio", data: {tags: ["react"]}}]
    ChatSvc->>LLM: messages + tool_result
    LLM-->>ChatSvc: "I found 2 React projects..."
    ChatSvc->>ChatSvc: Output guardrails
    ChatSvc-->>Client: {message: "I found 2 React..."}
```

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_TOOL_ITERATIONS` | 5 | Maximum tool call rounds per request |

---

## Configuration

### Claude Desktop Setup (Stdio)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "portfolio": {
      "command": "bun",
      "args": ["run", "mcp"],
      "cwd": "/path/to/folionaut",
      "env": {
        "TURSO_DATABASE_URL": "libsql://...",
        "TURSO_AUTH_TOKEN": "..."
      }
    }
  }
}
```

Restart Claude Desktop to activate the integration.

### Remote HTTP Setup

For remote MCP clients that support HTTP transport, point them at the deployed server:

```json
{
  "mcpServers": {
    "portfolio": {
      "url": "https://your-domain.com/api/mcp",
      "headers": {
        "X-Admin-Key": "your-admin-api-key"
      }
    }
  }
}
```

**Testing with curl:**

```bash
# Initialize a new MCP session
curl -X POST https://your-domain.com/api/mcp \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your-admin-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": { "name": "curl-test", "version": "1.0.0" }
    }
  }'
# The response includes a mcp-session-id header for subsequent requests
```

### Environment Variables

The MCP server requires the same database environment variables as the main application:

| Variable | Description | Required |
|----------|-------------|----------|
| `TURSO_DATABASE_URL` | Database connection | Yes |
| `TURSO_AUTH_TOKEN` | Database auth | Yes |
| `ADMIN_API_KEY` | For write operations (min 32 chars) | Yes |
| `LLM_API_KEY` | LLM provider API key | Yes |

## Shared Architecture

The MCP server shares the same data layer as the REST API, regardless of transport:

```mermaid
flowchart TB
    StdioClient["Local MCP Client\n(Claude Desktop)"]
    HTTPClient["Remote MCP Client\n(HTTP)"]

    subgraph App["Application"]
        REST["REST API (Express)"]
        MCPHTTP["MCP HTTP Router\nPOST/GET/DELETE /api/mcp"]
        MCPStdio["MCP Stdio Server\nbun run mcp"]
        Chat["Chat Service (OpenAI)"]

        REST --> Repo
        MCPHTTP --> Repo
        MCPStdio --> Repo
        Chat --> Repo

        Repo["Content Repository"]
    end

    StdioClient -->|stdio| MCPStdio
    HTTPClient -->|HTTPS + X-Admin-Key| MCPHTTP

    Repo --> DB[(Turso DB)]
```

This ensures consistent data access and version history tracking across both transports.

**Schema conversion** for OpenAI function calling:

```typescript
// Zod schemas are converted to JSON Schema for OpenAI via zod-to-json-schema
import { zodToJsonSchema } from 'zod-to-json-schema'
const jsonSchema = zodToJsonSchema(ListContentInputSchema)
```

See [ADR-008: Shared Tools Architecture](/decisions/008-shared-tools-architecture) for the full decision record.

## Error Handling

MCP errors follow the protocol specification:

| Code | Meaning |
|------|---------|
| -32600 | Invalid request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |
| -32001 | Resource not found |
| -32002 | Validation failed |

## Example Session

```
Human: What TypeScript projects does this portfolio have?

[Claude calls search_content({ query: "typescript", type: "project" })]

Claude: Based on the portfolio, there are 3 TypeScript projects:

1. **Folionaut** - A full-featured Express API with content management...
2. **Task Manager CLI** - A command-line task manager with local SQLite...
3. **React Dashboard** - An admin dashboard using TypeScript and React Query...

Would you like more details about any of these?
```
