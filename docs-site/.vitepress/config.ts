import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid(defineConfig({
  title: 'Folionaut',
  description: 'Architecture and API documentation for Folionaut',
  base: '/folionaut/',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    // Favicons
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/folionaut/favicon-32x32.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/folionaut/favicon-16x16.png' }],
    // Apple Touch Icon
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: '/folionaut/apple-touch-icon.png' }],
    // Web Manifest for PWA/Android
    ['link', { rel: 'manifest', href: '/folionaut/site.webmanifest' }],
    // Open Graph
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Folionaut' }],
    ['meta', { property: 'og:description', content: 'AI & MCP enhanced portfolio content management system' }],
    ['meta', { property: 'og:image', content: 'https://spencerjireh.github.io/folionaut/og-image.png' }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    // Twitter Card
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Folionaut' }],
    ['meta', { name: 'twitter:description', content: 'AI & MCP enhanced portfolio content management system' }],
    ['meta', { name: 'twitter:image', content: 'https://spencerjireh.github.io/folionaut/og-image.png' }],
    // Theme Color
    ['meta', { name: 'theme-color', content: '#445566' }]
  ],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Architecture', link: '/architecture/' },
      { text: 'API', link: '/api/' },
      { text: 'Integrations', link: '/integrations/' },
      { text: 'Operations', link: '/operations/' },
      { text: 'Decisions', link: '/decisions/' }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Configuration', link: '/guide/configuration' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/' },
            { text: 'High-Level Design', link: '/architecture/high-level-design' },
            { text: 'Low-Level Design', link: '/architecture/low-level-design' },
            { text: 'Content Model', link: '/architecture/content-model' }
          ]
        }
      ],
      '/api/': [
        {
          text: 'API',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Reference', link: '/api/reference' }
          ]
        }
      ],
      '/integrations/': [
        {
          text: 'Integrations',
          items: [
            { text: 'Overview', link: '/integrations/' },
            { text: 'MCP Server & AI Tools', link: '/integrations/mcp-server' },
            { text: 'Frontend', link: '/integrations/frontend' }
          ]
        }
      ],
      '/operations/': [
        {
          text: 'Operations',
          items: [
            { text: 'Overview', link: '/operations/' },
            { text: 'Runbook', link: '/operations/runbook' },
            { text: 'Deployment', link: '/operations/deployment' }
          ]
        }
      ],
      '/decisions/': [
        {
          text: 'Architecture Decisions',
          items: [
            { text: 'Overview', link: '/decisions/' },
            { text: 'ADR-001: Database Choice', link: '/decisions/001-database-choice' },
            { text: 'ADR-002: Caching Strategy', link: '/decisions/002-caching-strategy' },
            { text: 'ADR-003: LLM Abstraction', link: '/decisions/003-llm-abstraction' },
            { text: 'ADR-004: Repository Pattern', link: '/decisions/004-repository-pattern' },
            { text: 'ADR-005: Observability', link: '/decisions/005-observability' },
            { text: 'ADR-006: PII Protection', link: '/decisions/006-pii-obfuscation' },
            { text: 'ADR-007: Content Model', link: '/decisions/007-content-model-flexibility' },
            { text: 'ADR-008: Shared Tools', link: '/decisions/008-shared-tools-architecture' }
          ]
        }
      ]
    },

    search: {
      provider: 'local'
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/spencerjireh/folionaut' }
    ],

    editLink: {
      pattern: 'https://github.com/spencerjireh/folionaut/edit/main/docs-site/:path',
      text: 'Edit this page on GitHub'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2026'
    }
  },

  mermaid: {
    theme: 'neutral',
    themeVariables: {
      primaryColor: '#445566',
      primaryTextColor: '#1a1a2e',
      primaryBorderColor: '#667788',
      lineColor: '#667788',
      secondaryColor: '#f5f5f5',
      tertiaryColor: '#e8e8e8',
      fontFamily: 'Inter, system-ui, sans-serif'
    }
  },

  mermaidPlugin: {
    class: 'mermaid'
  }
}))
