---
title: Integrations Overview
description: Guide to integrating with Folionaut
---

# Integrations Overview

Folionaut provides multiple integration points for different use cases.

## Integration Options

| Integration | Description | Use Case |
|-------------|-------------|----------|
| [MCP Server & AI Tools](/integrations/mcp-server) | Model Context Protocol + Chat tools | AI assistants (Claude, etc.) and chat |
| [Frontend](/integrations/frontend) | REST API client | Web applications |

## MCP Server & AI Tools

The MCP server enables AI assistants like Claude Desktop to interact with portfolio content directly. The same read tools power the chat endpoint via OpenAI function calling.

**Quick Setup:**

```json
{
  "mcpServers": {
    "portfolio": {
      "command": "bun",
      "args": ["run", "mcp"],
      "cwd": "/path/to/folionaut"
    }
  }
}
```

[Learn more about MCP and AI tools integration](/integrations/mcp-server)

## Frontend Integration

The REST API provides everything needed for frontend applications:

- Content bundle endpoint for fast initial load
- Individual content endpoints with caching
- AI chat integration
- ETag support for efficient caching

[Learn more about frontend integration](/integrations/frontend)

## Architecture

All integrations share the same data layer:

```mermaid
flowchart TB
    restApi["REST API<br/><i>Express</i>"]
    mcpServer["MCP Server<br/><i>MCP SDK</i>"]
    chat["Chat Service<br/><i>OpenAI</i>"]

    subgraph dataLayer["Shared Data Layer"]
        repo["Content Repository"]
    end

    turso[("Turso DB")]

    restApi --> repo
    mcpServer --> repo
    chat --> repo
    repo --> turso
```
