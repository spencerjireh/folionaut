---
title: Content Endpoints
description: Public content retrieval API endpoints
---

# Content Endpoints

Public endpoints for retrieving portfolio content. No authentication required.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/content` | List content items |
| GET | `/api/v1/content/:type/:slug` | Get single content item |
| GET | `/api/v1/content/bundle` | Get all content in one request |

## GET /content

List content items with optional filtering.

**Query Parameters**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | - | Filter by content type. Any string matching `/^[a-z0-9-]+$/` (e.g., `project`, `experience`, `blog-post`, `certification`) |

::: info
This endpoint always returns published content only. To list drafts or archived content, use the admin endpoint `GET /api/v1/admin/content`.
:::

**Response**

```json
{
  "data": [
    {
      "id": "content_abc123",
      "type": "project",
      "slug": "my-project",
      "data": {
        "title": "My Project",
        "description": "A great project"
      },
      "status": "published",
      "version": 1,
      "sortOrder": 0,
      "createdAt": "2025-01-25T10:00:00Z",
      "updatedAt": "2025-01-25T10:00:00Z"
    }
  ]
}
```

## GET /content/:type/:slug

Get a single content item by type and slug.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Content type (any string matching `/^[a-z0-9-]+$/`) |
| `slug` | string | URL-friendly identifier |

**Response**

```json
{
  "data": {
    "id": "content_abc123",
    "type": "project",
    "slug": "my-project",
    "data": {
      "title": "My Project",
      "description": "A great project",
      "content": "## Overview\n\nThis project...",
      "tags": ["typescript", "express"],
      "featured": true
    },
    "status": "published",
    "version": 3,
    "sortOrder": 1,
    "createdAt": "2025-01-25T10:00:00Z",
    "updatedAt": "2025-01-26T15:30:00Z"
  }
}
```

## GET /content/bundle

Get all published content organized by type. See [Content Model - Content Bundle](/architecture/content-model#content-bundle) for the full type definition.

**Response**

```json
{
  "data": {
    "project": [...],
    "experience": [...],
    "education": [...],
    "skill": [...],
    "about": [...],
    "contact": [...],
    "blog-post": [...],
    "certification": [...]
  }
}
```

::: tip
The bundle is a dynamic `Record<string, ContentWithData[]>`. Keys correspond to the raw content type strings in the database, and all values are arrays. The set of keys depends on which types exist in your database -- custom types appear automatically.
:::

## See Also

- [Admin Content Endpoints](/api/admin) - Create, update, delete content
- [Content Model](/architecture/content-model) - Data column structure and custom types
- [Conventions](/api/conventions) - Caching, filtering, and pagination
