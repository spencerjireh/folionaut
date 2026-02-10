---
title: Admin Endpoints
description: Admin content CRUD, version history, and chat session management
---

# Admin Endpoints

All admin endpoints require the `X-Admin-Key` header.

## Admin Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/content` | List all content (including drafts) |
| GET | `/api/v1/admin/content/:id` | Get content by ID |
| POST | `/api/v1/admin/content` | Create content |
| PUT | `/api/v1/admin/content/:id` | Update content |
| DELETE | `/api/v1/admin/content/:id` | Delete content |
| GET | `/api/v1/admin/content/:id/history` | Get version history |
| POST | `/api/v1/admin/content/:id/restore` | Restore to previous version |

### POST /admin/content

Create new content.

**Headers**

| Header | Required | Description |
|--------|----------|-------------|
| `X-Admin-Key` | Yes | Admin API key |
| `Idempotency-Key` | Recommended | Unique request ID |

**Request Body**

```json
{
  "type": "project",
  "slug": "new-project",
  "data": {
    "title": "New Project",
    "description": "An exciting new project",
    "tags": ["typescript"],
    "featured": false
  },
  "status": "draft",
  "sortOrder": 0
}
```

**Response** (201 Created)

```json
{
  "data": {
    "id": "content_new123",
    "type": "project",
    "slug": "new-project",
    "data": {...},
    "status": "draft",
    "version": 1,
    "sortOrder": 0,
    "createdAt": "2025-01-26T10:00:00Z",
    "updatedAt": "2025-01-26T10:00:00Z"
  }
}
```

### GET /admin/content/:id

Get a single content item by ID, including drafts and archived items.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Content ID |

**Response**

```json
{
  "data": {
    "id": "content_abc123",
    "type": "project",
    "slug": "my-project",
    "data": {...},
    "status": "draft",
    "version": 2,
    "sortOrder": 0,
    "createdAt": "2025-01-25T10:00:00Z",
    "updatedAt": "2025-01-26T10:00:00Z",
    "deletedAt": null
  }
}
```

### PUT /admin/content/:id

Update existing content.

**Request Body**

```json
{
  "data": {
    "title": "Updated Title",
    "description": "Updated description"
  },
  "status": "published"
}
```

**Response**

Returns the updated content item wrapped in `{ "data": {...} }` with incremented version.

### DELETE /admin/content/:id

Delete a content item.

**Query Parameters**
- `hard`: Set to `true` for permanent deletion (default: soft delete)

### GET /admin/content/:id/history

Get version history for a content item.

**Response**

```json
{
  "data": [
    {
      "id": "history_xyz789",
      "contentId": "content_abc123",
      "version": 3,
      "data": {...},
      "changeType": "updated",
      "changedBy": "admin",
      "changeSummary": "Updated title, description",
      "createdAt": "2025-01-26T15:30:00Z"
    }
  ]
}
```

### POST /admin/content/:id/restore

Restore content to a previous version.

**Request Body**

```json
{
  "version": 2
}
```

**Response**

Returns the content item wrapped in `{ "data": {...} }` with the restored data and a new version number.

## Admin Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/chat/sessions` | List chat sessions |
| GET | `/api/v1/admin/chat/sessions/:id` | Get session with messages |
| DELETE | `/api/v1/admin/chat/sessions/:id` | End/delete session |

## See Also

- [Content Endpoints](/api/content) - Public content retrieval
- [Content Model](/architecture/content-model) - Data column structure and custom types
- [Conventions](/api/conventions) - Authentication, pagination, idempotency
