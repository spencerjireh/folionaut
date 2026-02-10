---
title: Chat Endpoint
description: AI chat API endpoint with tool use and guardrails
---

# Chat Endpoint

Public endpoint for AI-powered portfolio chat. No authentication required.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat` | Send chat message |

## POST /chat

Send a chat message and receive an AI response. The chat service includes input/output guardrails for content safety and PII protection.

**Request Body**

```json
{
  "message": "Tell me about your TypeScript experience",
  "visitorId": "visitor-unique-id"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | User message (1-2000 chars) |
| `visitorId` | string | Yes | Client-generated visitor identifier (1-100 chars) |

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `includeToolCalls` | boolean | `false` | Include tool call details in response |

**Response**

```json
{
  "sessionId": "sess_abc123",
  "message": {
    "id": "msg_xyz789",
    "role": "assistant",
    "content": "I have extensive experience with TypeScript...",
    "createdAt": "2025-01-25T10:00:00Z"
  },
  "tokensUsed": 150,
  "toolCalls": []
}
```

::: tip
The `toolCalls` field is only included when `includeToolCalls=true` is passed as a query parameter.
:::

**Error Responses**

- `429 Too Many Requests` - Rate limited
- `502 Bad Gateway` - LLM service unavailable

## See Also

- [MCP Server & AI Tools](/integrations/mcp-server) - Tools available to the chat AI
- [Conventions](/api/conventions) - Rate limiting details
- [Schemas & Errors](/api/schemas) - ChatResponse schema and error codes
