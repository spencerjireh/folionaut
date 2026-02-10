---
title: API Overview
description: REST API overview and endpoint summary
---

# API Overview

Folionaut exposes a REST API for content management and AI chat functionality.

**Base URL**: `https://your-domain.com/api/v1`

## Endpoint Summary

### Content (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/content` | [List content items](/api/content#get-content) |
| GET | `/api/v1/content/:type/:slug` | [Get single content item](/api/content#get-content-type-slug) |
| GET | `/api/v1/content/bundle` | [Get all content in one request](/api/content#get-content-bundle) |

### Chat (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat` | [Send chat message](/api/chat#post-chat) |

### Admin Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/content` | [List all content (including drafts)](/api/admin#post-admin-content) |
| GET | `/api/v1/admin/content/:id` | [Get content by ID](/api/admin#get-admin-content-id) |
| POST | `/api/v1/admin/content` | [Create content](/api/admin#post-admin-content) |
| PUT | `/api/v1/admin/content/:id` | [Update content](/api/admin#put-admin-content-id) |
| DELETE | `/api/v1/admin/content/:id` | [Delete content](/api/admin#delete-admin-content-id) |
| GET | `/api/v1/admin/content/:id/history` | [Get version history](/api/admin#get-admin-content-id-history) |
| POST | `/api/v1/admin/content/:id/restore` | [Restore to previous version](/api/admin#post-admin-content-id-restore) |

### Admin Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/chat/sessions` | [List chat sessions](/api/admin#admin-chat) |
| GET | `/api/v1/admin/chat/sessions/:id` | [Get session with messages](/api/admin#admin-chat) |
| DELETE | `/api/v1/admin/chat/sessions/:id` | [End/delete session](/api/admin#admin-chat) |

### Health & Infrastructure

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/live` | [Liveness probe](/api/infrastructure#get-health-live) |
| GET | `/api/health/ready` | [Readiness probe](/api/infrastructure#get-health-ready) |
| GET | `/api/health/startup` | [Startup probe](/api/infrastructure#get-health-startup) |
| GET | `/api/metrics` | [Prometheus metrics](/api/infrastructure#get-metrics) (requires `X-Admin-Key`) |

### MCP over HTTP

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/mcp` | [MCP JSON-RPC requests](/api/infrastructure#mcp-over-http) |
| GET | `/api/mcp` | [SSE stream](/api/infrastructure#get-api-mcp) |
| DELETE | `/api/mcp` | [Terminate MCP session](/api/infrastructure#delete-api-mcp) |

## Quick Links

- [Conventions](/api/conventions) - Authentication, headers, rate limiting, pagination, caching
- [Schemas & Errors](/api/schemas) - Response schemas and error codes
