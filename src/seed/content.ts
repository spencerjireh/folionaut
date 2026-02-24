/**
 * Derives seed content from profile data.
 * Produces separate rows per entity, matching production database shape.
 */

import { PROFILE_DATA } from './data'
import type { CreateContentDto } from '@/db/models'

/**
 * Derives seed content from PROFILE_DATA.
 * Returns content items ready for database insertion.
 */
export function deriveSeedContent(): CreateContentDto[] {
  const content: CreateContentDto[] = []

  // Bio
  content.push({
    type: 'bio',
    slug: 'main',
    data: {
      name: PROFILE_DATA.bio.firstName,
      lastName: PROFILE_DATA.bio.lastName,
      title: PROFILE_DATA.bio.title,
      blurb: PROFILE_DATA.bio.blurb,
    },
    status: 'published',
    sortOrder: 0,
  })

  // Contact
  content.push({
    type: 'contact',
    slug: 'main',
    data: {
      title: PROFILE_DATA.contact.title,
      subtitle: PROFILE_DATA.contact.subtitle,
      email: PROFILE_DATA.contact.email,
      github: PROFILE_DATA.contact.github,
      linkedin: PROFILE_DATA.contact.linkedin,
      footer: PROFILE_DATA.contact.footer,
    },
    status: 'published',
    sortOrder: 0,
  })

  // Education (single row)
  content.push({
    type: 'education',
    slug: PROFILE_DATA.education.slug,
    data: {
      degree: PROFILE_DATA.education.degree,
      institution: PROFILE_DATA.education.institution,
      year: PROFILE_DATA.education.year,
    },
    status: 'published',
    sortOrder: 0,
  })

  // Experience (separate row per entry)
  for (const [index, exp] of PROFILE_DATA.experience.entries()) {
    content.push({
      type: 'experience',
      slug: exp.slug,
      data: {
        year: exp.year,
        title: exp.title,
        company: exp.company,
        duration: exp.duration,
        website: exp.website,
        description: exp.description,
        tech: exp.tech,
        responsibilities: exp.responsibilities,
      },
      status: 'published',
      sortOrder: index,
    })
  }

  // Skills (separate row per skill)
  for (const [index, skill] of PROFILE_DATA.skills.entries()) {
    content.push({
      type: 'skill',
      slug: skill.slug,
      data: {
        name: skill.name,
        context: skill.context,
        tier: skill.tier,
      },
      status: 'published',
      sortOrder: index,
    })
  }

  // Projects (separate row per project)
  for (const [index, project] of PROFILE_DATA.projects.entries()) {
    const data: Record<string, unknown> = {
      num: project.num,
      title: project.title,
      tags: project.tags,
      techStack: project.techStack,
      links: project.links,
      descriptions: project.descriptions,
      highlights: project.highlights,
    }
    if (project.techStackMobile) data.techStackMobile = project.techStackMobile
    if (project.extraMeta) data.extraMeta = project.extraMeta
    if (project.metaNote) data.metaNote = project.metaNote
    if (project.highlightsTitle) data.highlightsTitle = project.highlightsTitle

    content.push({
      type: 'project',
      slug: project.slug,
      data,
      status: 'published',
      sortOrder: index,
    })
  }

  // Hobbies (separate row per hobby)
  for (const [index, hobby] of PROFILE_DATA.hobbies.entries()) {
    content.push({
      type: 'hobby',
      slug: hobby.slug,
      data: {
        name: hobby.name,
        description: hobby.description,
      },
      status: 'published',
      sortOrder: index,
    })
  }

  // Links
  content.push({
    type: 'link',
    slug: 'main',
    data: {
      github: PROFILE_DATA.links.github,
      linkedin: PROFILE_DATA.links.linkedin,
      resumePath: PROFILE_DATA.links.resumePath,
      email: PROFILE_DATA.links.email,
    },
    status: 'published',
    sortOrder: 0,
  })

  return content
}
