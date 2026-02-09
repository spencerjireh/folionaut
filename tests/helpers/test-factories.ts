import type { ContentType, ContentStatus } from '@/db/schema'
import type { ContentWithData, ChatSession, ChatMessage, ContentHistory } from '@/db/models'

let idCounter = 0

function nextId(): string {
  idCounter++
  return String(idCounter).padStart(21, '0')
}

/**
 * Resets the ID counter (call in beforeEach).
 */
export function resetIdCounter(): void {
  idCounter = 0
}

/**
 * Creates a mock content item.
 */
export function createContent(overrides: Partial<ContentWithData> = {}): ContentWithData {
  const now = new Date().toISOString()
  return {
    id: `content_${nextId()}`,
    type: 'project' as ContentType,
    slug: `test-project-${idCounter}`,
    data: {
      title: `Test Project ${idCounter}`,
      description: 'A test project description',
      tags: ['test', 'example'],
    },
    status: 'published' as ContentStatus,
    version: 1,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  }
}

/**
 * Creates a mock project content item.
 */
export function createProject(overrides: Partial<ContentWithData> = {}): ContentWithData {
  return createContent({
    type: 'project',
    data: {
      title: `Test Project ${idCounter}`,
      description: 'A test project description',
      content: 'Full project content goes here.',
      tags: ['typescript', 'testing'],
      links: {
        github: 'https://github.com/test/project',
        live: 'https://example.com',
      },
      featured: false,
    },
    ...overrides,
  })
}

/**
 * Creates a mock experience content item.
 */
export function createExperience(overrides: Partial<ContentWithData> = {}): ContentWithData {
  return createContent({
    type: 'experience',
    slug: `experience-${idCounter}`,
    data: {
      items: [
        {
          company: 'Test Company',
          role: 'Software Engineer',
          description: 'Built amazing things',
          startDate: '2020-01',
          endDate: '2023-12',
          location: 'Remote',
          type: 'full-time',
          skills: ['TypeScript', 'Node.js'],
        },
      ],
    },
    ...overrides,
  })
}

/**
 * Creates a mock skill content item.
 */
export function createSkill(overrides: Partial<ContentWithData> = {}): ContentWithData {
  return createContent({
    type: 'skill',
    slug: `skills-${idCounter}`,
    data: {
      items: [
        {
          name: 'TypeScript',
          category: 'language',
          proficiency: 5,
        },
        {
          name: 'Node.js',
          category: 'framework',
          proficiency: 4,
        },
      ],
    },
    ...overrides,
  })
}

/**
 * Creates a mock about page content item.
 */
export function createAbout(overrides: Partial<ContentWithData> = {}): ContentWithData {
  return createContent({
    type: 'about',
    slug: 'about',
    data: {
      title: 'About Me',
      content: 'I am a software engineer.',
    },
    ...overrides,
  })
}

/**
 * Creates a mock contact/config content item.
 */
export function createContact(overrides: Partial<ContentWithData> = {}): ContentWithData {
  return createContent({
    type: 'contact',
    slug: 'contact',
    data: {
      name: 'Test User',
      title: 'Software Engineer',
      email: 'test@example.com',
      social: {
        github: 'https://github.com/test',
        linkedin: 'https://linkedin.com/in/test',
      },
      chatEnabled: true,
    },
    ...overrides,
  })
}

/**
 * Creates a mock content history entry.
 */
export function createContentHistory(overrides: Partial<ContentHistory> = {}): ContentHistory {
  const now = new Date().toISOString()
  return {
    id: `hist_${nextId()}`,
    contentId: `content_${nextId()}`,
    version: 1,
    data: JSON.stringify({ title: 'Original Title', description: 'Original description' }),
    changeType: 'created',
    changedBy: 'admin',
    changeSummary: 'Created content',
    createdAt: now,
    ...overrides,
  }
}

/**
 * Creates a mock chat session.
 */
export function createChatSession(overrides: Partial<ChatSession> = {}): ChatSession {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  return {
    id: `sess_${nextId()}`,
    visitorId: `visitor-${idCounter}`,
    ipHash: 'a'.repeat(16),
    userAgent: 'Mozilla/5.0 (Test Browser)',
    messageCount: 0,
    status: 'active',
    createdAt: now.toISOString(),
    lastActiveAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    ...overrides,
  }
}

/**
 * Creates a mock chat message.
 */
export function createChatMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  const now = new Date().toISOString()
  return {
    id: `msg_${nextId()}`,
    sessionId: `sess_${nextId()}`,
    role: 'user',
    content: 'Test message content',
    tokensUsed: null,
    model: null,
    createdAt: now,
    ...overrides,
  }
}

/**
 * Creates a mock user message.
 */
export function createUserMessage(content: string, sessionId?: string): ChatMessage {
  return createChatMessage({
    role: 'user',
    content,
    sessionId: sessionId ?? `sess_${nextId()}`,
    tokensUsed: null,
    model: null,
  })
}

/**
 * Creates a mock assistant message.
 */
export function createAssistantMessage(
  content: string,
  sessionId?: string,
  tokensUsed = 50
): ChatMessage {
  return createChatMessage({
    role: 'assistant',
    content,
    sessionId: sessionId ?? `sess_${nextId()}`,
    tokensUsed,
    model: 'gpt-4o-mini',
  })
}

/**
 * Creates a valid project data object for content creation.
 */
export function createProjectData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    title: 'Test Project',
    description: 'A test project description',
    content: 'Full project content here',
    tags: ['typescript', 'testing'],
    links: {
      github: 'https://github.com/test/project',
    },
    featured: false,
    ...overrides,
  }
}

/**
 * Creates a valid experience data object.
 */
export function createExperienceData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    items: [
      {
        company: 'Test Company',
        role: 'Software Engineer',
        description: 'Building great software',
        startDate: '2020-01',
        endDate: '2023-12',
        location: 'Remote',
        type: 'full-time',
        skills: ['TypeScript', 'Node.js'],
      },
    ],
    ...overrides,
  }
}

/**
 * Creates a valid skills data object.
 */
export function createSkillsData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    items: [
      {
        name: 'TypeScript',
        category: 'language',
        proficiency: 5,
      },
    ],
    ...overrides,
  }
}

/**
 * Creates mock content bundle.
 */
export function createContentBundle() {
  return {
    projects: [createProject()],
    experiences: [createExperience()],
    education: [],
    skills: [createSkill()],
    about: createAbout(),
    contact: createContact(),
  }
}
