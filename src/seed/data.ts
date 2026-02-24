/**
 * Single source of truth for portfolio seed data.
 * Mirrors production data shapes exactly.
 * Used for both database seeding and evaluation tests.
 */

export interface ProfileData {
  bio: {
    firstName: string
    lastName: string
    title: string
    blurb: string[]
  }
  contact: {
    title: string
    subtitle: string
    email: string
    github: string
    linkedin: string
    footer: string
  }
  links: {
    github: string
    linkedin: string
    resumePath: string
    email: string
  }
  experience: Array<{
    slug: string
    year: string
    title: string
    company: string
    duration: string
    website: string
    description: string
    tech: string[]
    responsibilities: string[]
  }>
  education: {
    slug: string
    degree: string
    institution: string
    year: string
  }
  skills: Array<{
    slug: string
    name: string
    context: string
    tier: 'primary' | 'extended' | 'familiar'
  }>
  projects: Array<{
    slug: string
    num: string
    title: string
    tags: string[]
    techStack: string[]
    techStackMobile?: string
    links: Array<{ label: string; url: string }>
    extraMeta?: Array<{ label: string; value: string }>
    metaNote?: string
    descriptions: string[]
    highlightsTitle?: string
    highlights: string[]
  }>
  hobbies: Array<{ slug: string; name: string; description: string }>
}

/**
 * Real CV data for Spencer Jireh Cebrian.
 * Matches production database content exactly.
 */
export const PROFILE_DATA: ProfileData = {
  bio: {
    firstName: 'Spencer Jireh',
    lastName: 'Cebrian',
    title: 'Software Engineer',
    blurb: [
      'Backend-leaning software engineer building at the intersection of <strong>full-stack development</strong> and <strong>applied AI</strong>.',
      'I build products end-to-end, from backend architecture and infrastructure to frontend, and integrate AI/ML where it makes the work better. Interested in agentic AI, financial systems, distributed systems, and self-hosting.',
    ],
  },

  contact: {
    title: "Let's Connect",
    subtitle: 'Available for opportunities',
    email: 'spencercebrian123@gmail.com',
    github: 'https://github.com/spencerjireh',
    linkedin: 'https://www.linkedin.com/in/spencerjireh',
    footer: '© 2026 Spencer Jireh G. Cebrian',
  },

  links: {
    github: 'https://github.com/spencerjireh',
    linkedin: 'https://www.linkedin.com/in/spencerjireh',
    resumePath: '/Spencer_Jireh_Cebrian_CV.pdf',
    email: 'spencercebrian123@gmail.com',
  },

  experience: [
    {
      slug: 'junior-software-engineer',
      year: '2024 - Present',
      title: 'Junior Software Engineer',
      company: 'Stratpoint Technologies, Inc.',
      duration: 'July 2024 - Present',
      website: 'https://www.stratpoint.com',
      description:
        'Full-stack Engineer @ AI Labs, working on innovative AI-powered solutions and scalable applications.',
      tech: ['Python', 'TypeScript', 'React', 'Next.js', 'FastAPI', 'AWS', 'PostgreSQL', 'Docker', 'LangChain'],
      responsibilities: [
        'Develop and maintain AI-powered applications as part of the AI Labs team',
        'Build scalable full-stack solutions using modern frameworks and cloud infrastructure',
        'Implement LLM-based features and integrate various AI/ML models into production systems',
        'Collaborate with cross-functional teams to deliver innovative software products',
      ],
    },
    {
      slug: 'java-intern',
      year: 'Feb - Jul 2024',
      title: 'Java Intern',
      company: 'Stratpoint Technologies, Inc.',
      duration: 'February 2024 - July 2024',
      website: 'https://www.stratpoint.com',
      description:
        'Backend Development with Spring Boot & Node.js. DevOps practices using Kubernetes & Docker.',
      tech: ['Java', 'Spring Boot', 'Node.js', 'NestJS', 'Kubernetes', 'Docker', 'PostgreSQL', 'MongoDB'],
      responsibilities: [
        'Developed backend services using Spring Boot and Node.js frameworks',
        'Implemented RESTful APIs and microservices architecture patterns',
        'Gained hands-on experience with Kubernetes orchestration and Docker containerization',
        'Participated in code reviews and agile development practices',
      ],
    },
    {
      slug: 'committee-chairperson',
      year: 'Aug 2022 - Jul 2023',
      title: 'Committee Chairperson',
      company: 'Junior Philippine Computer Society - Mapua University',
      duration: 'August 2022 - July 2023',
      website: 'https://www.mapua.edu.ph',
      description:
        'Project and Control Committee Chairperson. Creative Committee Chairperson.',
      tech: ['Event Management', 'Leadership', 'Project Planning', 'Adobe Creative Suite', 'Figma'],
      responsibilities: [
        'Led the Project and Control Committee, overseeing event logistics and execution',
        'Served as Creative Committee Chairperson, directing visual design and branding',
        'Coordinated with university administration and external sponsors',
        'Managed team of committee members and delegated tasks effectively',
      ],
    },
  ],

  education: {
    slug: 'bs-cs',
    degree: 'BS Computer Science',
    institution: 'Mapua University',
    year: '2025',
  },

  skills: [
    { slug: 'python', name: 'Python', context: '3+ years. FastAPI backends, ML pipelines, LangChain agents. Primary language at AI Labs.', tier: 'primary' },
    { slug: 'javascript-typescript', name: 'JavaScript/TypeScript', context: '2+ years. React/Next.js frontends, Node.js services. Strict typing advocate.', tier: 'primary' },
    { slug: 'react', name: 'React', context: 'Next.js, React Query, Zustand. Built consultation platform serving 900+ users.', tier: 'primary' },
    { slug: 'fastapi', name: 'FastAPI', context: 'Production APIs at Stratpoint. Async patterns, Pydantic validation, OpenAPI.', tier: 'primary' },
    { slug: 'postgresql', name: 'PostgreSQL', context: 'Primary database. Complex queries, migrations, used across all major projects.', tier: 'primary' },
    { slug: 'aws', name: 'AWS', context: 'EC2, S3, Lambda, RDS. Production deployments and CI/CD pipelines.', tier: 'primary' },
    { slug: 'nextjs', name: 'Next.js', context: 'App Router, SSR/SSG, API routes. Current frontend framework of choice.', tier: 'primary' },
    { slug: 'nodejs', name: 'Node.js', context: 'Express, NestJS backends. Microservices architecture at Stratpoint internship.', tier: 'extended' },
    { slug: 'docker', name: 'Docker', context: 'Containerized deployments, multi-stage builds, compose for local dev.', tier: 'extended' },
    { slug: 'langchain', name: 'LangChain', context: 'LLM orchestration, RAG pipelines, agent frameworks at AI Labs.', tier: 'extended' },
    { slug: 'spring-boot', name: 'Spring Boot', context: 'Java internship focus. RESTful services, JPA, microservices patterns.', tier: 'extended' },
    { slug: 'kubernetes', name: 'Kubernetes', context: 'Container orchestration, deployments, services. Hands-on during internship.', tier: 'extended' },
    { slug: 'express', name: 'Express', context: 'Node.js web framework. Used in Folionaut CMS and backend services at Stratpoint.', tier: 'extended' },
    { slug: 'langgraph', name: 'LangGraph', context: "Agentic AI workflows. Built Arxivian's multi-tool agent with parallel execution and retry loops.", tier: 'extended' },
    { slug: 'java', name: 'Java', context: 'Backend development during Stratpoint internship. Spring ecosystem.', tier: 'extended' },
    { slug: 'tensorflow', name: 'TensorFlow', context: 'Deep learning research. Traffic violation detection, breast cancer prediction models.', tier: 'familiar' },
    { slug: 'mongodb', name: 'MongoDB', context: 'Document stores for appropriate use cases. Used alongside PostgreSQL.', tier: 'familiar' },
    { slug: 'cpp', name: 'C++', context: 'Systems programming coursework. Algorithm implementations.', tier: 'familiar' },
    { slug: 'nestjs', name: 'NestJS', context: 'TypeScript backend framework. Modular architecture, decorators.', tier: 'familiar' },
    { slug: 'php', name: 'PHP', context: 'Legacy project maintenance. Laravel basics.', tier: 'familiar' },
    { slug: 'scikit-learn', name: 'Scikit-learn', context: 'ML model training and evaluation. Logistic Regression for CytoLens breast cancer predictor.', tier: 'familiar' },
  ],

  projects: [
    {
      slug: 'arxivian',
      num: '01',
      title: 'Arxivian',
      tags: ['Full Stack', 'AI'],
      techStack: ['React 19 / TypeScript', 'FastAPI / Python', 'LangGraph / LiteLLM', 'PostgreSQL / pgvector', 'Redis / Celery'],
      techStackMobile: 'React, FastAPI, LangGraph, pgvector, Redis',
      links: [{ label: 'GitHub', url: 'https://github.com/spencerjireh/arxivian' }],
      descriptions: [
        'An agentic RAG system for academic research. Chat with an AI agent that searches, ingests, summarizes, and explores citations across arXiv papers through a conversational interface backed by a LangGraph workflow and hybrid retrieval.',
        'The agent has access to six specialized tools, decides which to call (potentially in parallel), grades retrieved context for relevance, and streams cited answers back in real time. A communal knowledge base means every ingested paper benefits all users.',
      ],
      highlightsTitle: 'Key Features',
      highlights: [
        'LangGraph-based agent with parallel tool execution and retry loops',
        'Hybrid retrieval combining pgvector HNSW and PostgreSQL GIN/tsvector with RRF',
        'Real-time SSE streaming with Langfuse observability tracing',
        'Celery task queue with Redis for async paper ingestion',
        '466+ tests across unit, API, and LLM-backed evaluation suites',
      ],
    },
    {
      slug: 'eece-consultation-hub',
      num: '02',
      title: 'EECE Consultation Hub',
      tags: ['Web App', 'Full Stack'],
      techStack: ['React / Next.js', 'TypeScript', 'Node.js / Express', 'PostgreSQL', 'AWS (EC2, S3)'],
      techStackMobile: 'React, Next.js, TypeScript, Node.js, PostgreSQL',
      links: [{ label: 'Live Site<sup>*</sup>', url: 'https://eece-consultation-hub.spencerjireh.com/' }],
      extraMeta: [{ label: 'Users', value: '900+' }],
      metaNote: '<sup>*</sup>Active production system - please browse respectfully.',
      descriptions: [
        'An academic consultation platform developed for the Electrical and Electronics Engineering department. The system streamlines the scheduling process between students and faculty members, replacing a manual appointment system.',
        'Successfully deployed to serve over 900 users including students, faculty advisors, and department administrators. Features real-time availability updates, automated notifications, and comprehensive scheduling management.',
      ],
      highlightsTitle: 'Key Features',
      highlights: [
        'Real-time availability and scheduling system',
        'Role-based access for students, faculty, and admins',
        'Automated email notifications for appointments',
        'Dashboard analytics for department reporting',
        'Mobile-responsive design for on-the-go access',
      ],
    },
    {
      slug: 'folionaut',
      num: '03',
      title: 'Folionaut',
      tags: ['Full Stack', 'Backend'],
      techStack: ['TypeScript / Bun', 'Express', 'Turso / Drizzle ORM', 'Redis', 'OpenTelemetry / Prometheus'],
      techStackMobile: 'TypeScript, Bun, Express, Turso, Redis',
      links: [
        { label: 'GitHub', url: 'https://github.com/spencerjireh/folionaut' },
        { label: 'Docs', url: 'https://spencerjireh.github.io/folionaut/' },
      ],
      descriptions: [
        'An AI and MCP enhanced portfolio content management system. A TypeScript/Express backend featuring a flexible CMS with free-form JSON content, versioning, soft delete, and full audit trail for managing portfolio websites.',
        'Includes an AI-powered chat endpoint with PII obfuscation and tool use, plus a Model Context Protocol (MCP) server that exposes content tools to AI assistants. Built with resilience patterns including circuit breakers, token bucket rate limiting, and graceful degradation.',
      ],
      highlightsTitle: 'Key Features',
      highlights: [
        'Flexible CMS with content versioning and full audit trail',
        'AI chat with PII obfuscation and tool use for content queries',
        'MCP server integration for AI assistant interoperability',
        'Circuit breaker and token bucket rate limiting for resilience',
        'OpenTelemetry tracing and Prometheus metrics for observability',
      ],
    },
    {
      slug: 'cytolens',
      num: '04',
      title: 'CytoLens',
      tags: ['Machine Learning', 'Healthcare'],
      techStack: ['Python / FastAPI', 'Svelte', 'Scikit-learn', 'Pandas / NumPy', 'Docker'],
      techStackMobile: 'Python, FastAPI, Svelte, Scikit-learn, Docker',
      links: [
        { label: 'GitHub', url: 'https://github.com/spencerjireh/cytolens' },
        { label: 'Live Demo', url: 'https://cytolens.spencerjireh.com' },
      ],
      descriptions: [
        'A breast cancer malignancy predictor designed for use alongside cytology lab measurements. The application analyzes cell nuclei characteristics from fine needle aspirate (FNA) samples to classify tumors as benign or malignant using a Logistic Regression model.',
        'Features an interactive radar chart visualization that maps input measurements against benign and malignant profiles, giving medical staff an intuitive view of the prediction. Built with a FastAPI backend serving the ML model and a Svelte frontend, packaged in a single Docker container.',
      ],
      highlightsTitle: 'Key Features',
      highlights: [
        'Logistic Regression model trained on FNA cell nuclei measurements',
        'Interactive radar chart visualization of prediction profiles',
        'FastAPI backend with Svelte frontend in a single container',
        'Real-time predictions with confidence scoring',
        'Dockerized for consistent deployment across environments',
      ],
    },
    {
      slug: 'quantum-cash',
      num: '05',
      title: 'Quantum Cash',
      tags: ['Microservices', 'Backend'],
      techStack: ['Java / Spring Boot', 'Node.js / NestJS', 'PostgreSQL', 'Docker / Kubernetes', 'JWT Authentication'],
      techStackMobile: 'Java, Spring Boot, NestJS, PostgreSQL, Docker',
      links: [
        { label: 'GitHub (v1)', url: 'https://github.com/spencerjireh/quantum-cash-digital-wallet' },
        { label: 'GitHub (v2)', url: 'https://github.com/spencerjireh/CashDaddy' },
      ],
      descriptions: [
        'A digital wallet system built with microservices architecture, designed for scalability and security. The system handles user management, transaction processing, and account services through independent, loosely-coupled services.',
        'Implemented secure JWT-based authentication with refresh token rotation, ensuring user sessions remain protected while maintaining a smooth experience. Each microservice communicates through well-defined APIs and message queues for asynchronous operations.',
      ],
      highlightsTitle: 'Key Features',
      highlights: [
        'Microservices architecture with independent deployment',
        'JWT authentication with secure refresh token handling',
        'PostgreSQL for reliable transaction storage',
        'Containerized with Docker and orchestrated via Kubernetes',
        'RESTful APIs with comprehensive error handling',
      ],
    },
    {
      slug: 'traffic-violation-detection',
      num: '06',
      title: 'Traffic Violation Detection',
      tags: ['Research', 'Deep Learning'],
      techStack: ['Python', 'YOLOv7', 'DeepSORT', 'Faster R-CNN', 'OpenCV'],
      techStackMobile: 'Python, YOLOv7, DeepSORT, Faster R-CNN',
      links: [
        { label: 'GitHub', url: 'https://github.com/spencerjireh/YOLOv7-Deepsort-License-Plate-Coding-Detector' },
      ],
      extraMeta: [{ label: 'Type', value: 'Research' }],
      descriptions: [
        'A deep learning research project comparing state-of-the-art object detection models for automated traffic violation monitoring. The study evaluates YOLOv7, DeepSORT, and Faster R-CNN for detecting and tracking vehicles in real-time traffic footage.',
        'The research focuses on identifying specific violations such as illegal lane changes, running red lights, and improper turns. Comparative analysis includes accuracy metrics, processing speed, and real-world deployment considerations.',
      ],
      highlightsTitle: 'Research Highlights',
      highlights: [
        'Comparative analysis of YOLO, DeepSORT, and Faster R-CNN',
        'Real-time vehicle detection and tracking',
        'Custom dataset for Philippine traffic scenarios',
        'Performance benchmarking on embedded hardware',
        'Published findings and methodology documentation',
      ],
    },
  ],

  hobbies: [
    { slug: 'reading', name: 'Reading', description: 'Avid reader across fiction, non-fiction, and manga' },
    { slug: 'chess', name: 'Chess', description: 'Plays casually online' },
    { slug: 'tv-and-animation', name: 'TV and animated series', description: 'Watches a broad mix of live-action and animation' },
    { slug: 'music-production', name: 'Music production', description: 'Produces beats/hip-hop and lo-fi/chill using FL Studio' },
  ],
}
