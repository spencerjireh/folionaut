import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { contentRepository } from '@/repositories/content.repository'

export function registerContentResources(server: McpServer) {
  // List all published content
  server.resource('folionaut://content', 'folionaut://content', async () => {
    const items = await contentRepository.findPublished()

    const results = items.map((item) => ({
      id: item.id,
      slug: item.slug,
      type: item.type,
      data: item.data,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))

    return {
      contents: [
        {
          uri: 'folionaut://content',
          mimeType: 'application/json',
          text: JSON.stringify(results, null, 2),
        },
      ],
    }
  })

  // List content by type - dynamic discovery via ResourceTemplate
  const typeTemplate = new ResourceTemplate('folionaut://content/{type}', {
    list: async () => {
      const types = await contentRepository.getTypes()
      return {
        resources: types.map((t) => ({
          uri: `folionaut://content/${t.type}`,
          name: `${t.type} (${t.count} items)`,
          mimeType: 'application/json',
        })),
      }
    },
  })

  server.resource('content-by-type', typeTemplate, async (uri, variables) => {
    const type = variables.type as string
    const items = await contentRepository.findPublished(type)

    const results = items.map((item) => ({
      id: item.id,
      slug: item.slug,
      type: item.type,
      data: item.data,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }))

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(results, null, 2),
        },
      ],
    }
  })

  // Single content item by type and slug - dynamic discovery via ResourceTemplate
  const itemTemplate = new ResourceTemplate('folionaut://content/{type}/{slug}', {
    list: async () => {
      const items = await contentRepository.findPublished()
      return {
        resources: items.map((item) => ({
          uri: `folionaut://content/${item.type}/${item.slug}`,
          name: `${item.type}/${item.slug}`,
          mimeType: 'application/json',
        })),
      }
    },
  })

  server.resource('content-item', itemTemplate, async (uri, variables) => {
    const type = variables.type as string
    const slug = variables.slug as string
    const item = await contentRepository.findBySlug(type, slug)

    if (!item) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify({ error: `Content not found: ${type}/${slug}` }),
          },
        ],
      }
    }

    const result = {
      id: item.id,
      slug: item.slug,
      type: item.type,
      data: item.data,
      status: item.status,
      version: item.version,
      sortOrder: item.sortOrder,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(result, null, 2),
        },
      ],
    }
  })
}
