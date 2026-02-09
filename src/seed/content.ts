/**
 * Derives seed content from profile data.
 * Transforms PROFILE_DATA into CreateContentDto[] for database seeding.
 */

import { PROFILE_DATA } from './data'
import type { CreateContentDto } from '@/db/models'

/**
 * Derives seed content from PROFILE_DATA.
 * Returns content items ready for database insertion.
 */
export function deriveSeedContent(): CreateContentDto[] {
  const content: CreateContentDto[] = []

  // About page (PageDataSchema)
  content.push({
    type: 'about',
    slug: 'about',
    data: {
      title: `About ${PROFILE_DATA.name}`,
      content: `${PROFILE_DATA.name} is a software engineer specializing in full-stack development and AI/ML systems. Currently working at ${PROFILE_DATA.experience[0].company} as a ${PROFILE_DATA.experience[0].role}, focusing on ${PROFILE_DATA.experience[0].description.split('.')[0].toLowerCase()}.`,
    },
    status: 'published',
    sortOrder: 0,
  })

  // Contact page (SiteConfigDataSchema)
  content.push({
    type: 'contact',
    slug: 'contact',
    data: {
      name: PROFILE_DATA.name,
      title: 'Software Engineer',
      email: PROFILE_DATA.email,
      social: {
        linkedin: PROFILE_DATA.social.linkedin,
        github: PROFILE_DATA.social.github,
        website: PROFILE_DATA.website,
      },
      chatEnabled: true,
    },
    status: 'published',
    sortOrder: 0,
  })

  // Experience (ExperienceListDataSchema)
  content.push({
    type: 'experience',
    slug: 'experience',
    data: {
      items: PROFILE_DATA.experience.map((exp) => ({
        company: exp.company,
        role: exp.role,
        description: exp.description,
        startDate: exp.startDate,
        endDate: exp.endDate,
        location: exp.location,
        type: exp.type,
        skills: exp.skills,
      })),
    },
    status: 'published',
    sortOrder: 0,
  })

  // Education (EducationListDataSchema)
  content.push({
    type: 'education',
    slug: 'education',
    data: {
      items: PROFILE_DATA.education.map((edu) => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        startDate: edu.startDate,
        endDate: edu.endDate,
        location: edu.location,
      })),
    },
    status: 'published',
    sortOrder: 0,
  })

  // Skills (SkillsListDataSchema)
  content.push({
    type: 'skill',
    slug: 'skills',
    data: {
      items: [
        ...PROFILE_DATA.skills.languages.map((name, i) => ({
          name,
          category: 'language' as const,
          proficiency: 5 - Math.floor(i / 2),
        })),
        ...PROFILE_DATA.skills.frameworks.map((name, i) => ({
          name,
          category: 'framework' as const,
          proficiency: 5 - Math.floor(i / 3),
        })),
        ...PROFILE_DATA.skills.tools.map((name, i) => ({
          name,
          category: 'tool' as const,
          proficiency: 4 - Math.floor(i / 4),
        })),
      ],
    },
    status: 'published',
    sortOrder: 0,
  })

  // Projects (ProjectDataSchema)
  PROFILE_DATA.projects.forEach((project, index) => {
    content.push({
      type: 'project',
      slug: project.slug,
      data: {
        title: project.title,
        description: project.description,
        content: project.content,
        tags: project.tags,
        links: project.links,
        featured: project.featured,
      },
      status: 'published',
      sortOrder: index,
    })
  })

  return content
}
