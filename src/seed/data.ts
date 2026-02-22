/**
 * Single source of truth for portfolio seed data.
 * This data is used for both database seeding and evaluation tests.
 */

export interface ProfileData {
  name: string
  email: string
  website: string
  social: {
    linkedin: string
    github: string
  }
  experience: Array<{
    company: string
    role: string
    description: string
    startDate: string
    endDate: string | null
    location?: string
    type: 'full-time' | 'part-time' | 'contract' | 'freelance'
    skills: string[]
  }>
  skills: {
    languages: string[]
    frameworks: string[]
    tools: string[]
  }
  projects: Array<{
    slug: string
    title: string
    description: string
    content: string
    tags: string[]
    links: {
      github?: string
      live?: string
    }
    featured: boolean
  }>
  education: Array<{
    institution: string
    degree: string
    field: string
    startDate: string
    endDate: string | null
    location?: string
  }>
  hobbies: Array<{ name: string; description: string }>
}

/**
 * Real CV data for Spencer Jireh Cebrian.
 */
export const PROFILE_DATA: ProfileData = {
  name: 'Spencer Jireh Cebrian',
  email: 'spencercebrian123@gmail.com',
  website: 'https://spencerjireh.com',
  social: {
    linkedin: 'https://linkedin.com/in/spencerjireh',
    github: 'https://github.com/spencerjireh',
  },
  experience: [
    {
      company: 'Stratpoint Technologies',
      role: 'Junior Software Engineer',
      description:
        'Developing AI-powered customer service platforms and federated ML systems. Contributing to internal R&D initiatives and supporting presales technical demonstrations.',
      startDate: '2024-09',
      endDate: null,
      location: 'Philippines',
      type: 'full-time',
      skills: ['Python', 'TypeScript', 'React.js', 'FastAPI', 'AWS CDK', 'LangGraph', 'LangChain'],
    },
    {
      company: 'Stratpoint Technologies',
      role: 'Java Intern',
      description:
        'Built payment microservices using Spring Boot and Node.js. Implemented REST APIs and integrated with payment gateways.',
      startDate: '2024-06',
      endDate: '2024-09',
      location: 'Philippines',
      type: 'part-time',
      skills: ['Java', 'Spring Boot', 'Node.js', 'PostgreSQL'],
    },
  ],
  skills: {
    languages: ['Python', 'TypeScript', 'JavaScript', 'Java'],
    frameworks: ['React.js', 'Next.js', 'Node.js', 'NestJS', 'Spring Boot', 'FastAPI'],
    tools: [
      'PostgreSQL',
      'MySQL',
      'MongoDB',
      'Redis',
      'AWS CDK',
      'Docker',
      'Kubernetes',
      'GitHub Actions',
      'LangGraph',
      'LangChain',
    ],
  },
  projects: [
    {
      slug: 'jirehs-agent',
      title: "Jireh's Agent",
      description: 'An agentic RAG system for searching and summarizing arXiv papers.',
      content:
        'Built an intelligent agent using LangGraph and LangChain that can search, retrieve, and summarize academic papers from arXiv. Features include semantic search, paper recommendations, and conversational Q&A about research topics.',
      tags: ['Python', 'LangGraph', 'LangChain', 'RAG', 'AI'],
      links: {
        github: 'https://github.com/spencerjireh/jirehs-agent',
      },
      featured: true,
    },
    {
      slug: 'eece-consultation-hub',
      title: 'EECE Consultation Hub',
      description:
        'A consultation platform serving 1000+ users for academic consultations and scheduling.',
      content:
        'Developed a full-stack consultation management system for the EECE department. Features include appointment scheduling, real-time notifications, and analytics dashboard. Served over 1000 active users.',
      tags: ['TypeScript', 'React.js', 'Node.js', 'PostgreSQL'],
      links: {
        github: 'https://github.com/spencerjireh/eece-consultation-hub',
        live: 'https://eece-hub.example.com',
      },
      featured: true,
    },
    {
      slug: 'folionaut',
      title: 'Folionaut',
      description:
        'A TypeScript/Express backend application featuring a RESTful API, AI-powered chat, and content management system.',
      content:
        'Folionaut is built with TypeScript and Express.js. It includes Redis caching, Turso/SQLite database, OpenAI integration for chat functionality, and comprehensive API endpoints for managing portfolio content.',
      tags: ['TypeScript', 'Express', 'Redis', 'SQLite', 'OpenAI'],
      links: {
        github: 'https://github.com/spencerjireh/folionaut',
        live: 'https://api.spencerjireh.com',
      },
      featured: true,
    },
  ],
  education: [
    {
      institution: 'Mapua University',
      degree: 'BS',
      field: 'Computer Science',
      startDate: '2021-08',
      endDate: '2025-05',
      location: 'Manila, Philippines',
    },
  ],
  hobbies: [
    { name: 'Reading', description: 'Avid reader across fiction, non-fiction, and manga' },
    { name: 'Chess', description: 'Plays casually online' },
    { name: 'TV and animated series', description: 'Watches a broad mix of live-action and animation' },
    { name: 'Music production', description: 'Produces beats/hip-hop and lo-fi/chill using FL Studio' },
  ],
}
