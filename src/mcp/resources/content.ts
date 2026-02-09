import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { contentRepository } from '@/repositories/content.repository'
import { contentTypeEnum, type ContentType } from '@/db/schema'

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

  // List content by type - register one resource per type
  for (const type of contentTypeEnum) {
    server.resource(`folionaut://content/${type}`, `folionaut://content/${type}`, async () => {
      const items = await contentRepository.findPublished(type as ContentType)

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
            uri: `folionaut://content/${type}`,
            mimeType: 'application/json',
            text: JSON.stringify(results, null, 2),
          },
        ],
      }
    })

    // Single content item by type and slug - use ResourceTemplate
    const template = new ResourceTemplate(`folionaut://content/${type}/{slug}`, {
      list: async () => {
        const items = await contentRepository.findPublished(type as ContentType)
        return {
          resources: items.map((item) => ({
            uri: `folionaut://content/${type}/${item.slug}`,
            name: `${type}/${item.slug}`,
            mimeType: 'application/json',
          })),
        }
      },
    })

    server.resource(`content-${type}-item`, template, async (uri, variables) => {
      const slug = variables.slug as string
      const item = await contentRepository.findBySlug(type as ContentType, slug)

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
}
