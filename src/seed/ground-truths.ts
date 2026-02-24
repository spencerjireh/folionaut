/**
 * Derived ground truths and assertion helpers.
 * All values are computed from PROFILE_DATA to maintain consistency.
 */

import { PROFILE_DATA } from './data'

// --- Skill classification ---
// Skills are stored flat with tiers in prod. These sets classify them
// by traditional category for eval assertions that ask about
// "programming languages", "frameworks", or "databases".

const LANGUAGE_NAMES = new Set([
  'Python', 'JavaScript/TypeScript', 'Java', 'C++', 'PHP',
])

const FRAMEWORK_NAMES = new Set([
  'React', 'Next.js', 'Node.js', 'FastAPI', 'Spring Boot',
  'NestJS', 'Express', 'LangChain', 'LangGraph', 'Scikit-learn',
])

const DATABASE_NAMES = new Set([
  'PostgreSQL', 'MongoDB',
])

/**
 * Computed ground truth statements derived from profile data.
 */
export const groundTruths = {
  /**
   * Current employer description.
   */
  get currentEmployer(): string {
    const exp = PROFILE_DATA.experience[0]
    return `${PROFILE_DATA.bio.firstName} currently works at ${exp.company} as a ${exp.title}.`
  },

  /**
   * Current company name only.
   */
  get currentCompanyName(): string {
    return PROFILE_DATA.experience[0].company
  },

  /**
   * Current role title.
   */
  get currentRole(): string {
    return PROFILE_DATA.experience[0].title
  },

  /**
   * List of programming languages (classified from flat skills).
   */
  get programmingLanguages(): string[] {
    return PROFILE_DATA.skills
      .filter((s) => LANGUAGE_NAMES.has(s.name))
      .map((s) => s.name)
  },

  /**
   * List of frameworks (classified from flat skills).
   */
  get frameworks(): string[] {
    return PROFILE_DATA.skills
      .filter((s) => FRAMEWORK_NAMES.has(s.name))
      .map((s) => s.name)
  },

  /**
   * List of databases (classified from flat skills).
   */
  get databases(): string[] {
    return PROFILE_DATA.skills
      .filter((s) => DATABASE_NAMES.has(s.name))
      .map((s) => s.name)
  },

  /**
   * All skills.
   */
  get allSkills(): string[] {
    return PROFILE_DATA.skills.map((s) => s.name)
  },

  /**
   * Education summary.
   */
  get education(): string {
    const edu = PROFILE_DATA.education
    return `${edu.degree} from ${edu.institution}`
  },

  /**
   * Education institution name.
   */
  get educationInstitution(): string {
    return PROFILE_DATA.education.institution
  },

  /**
   * Project names.
   */
  get projectNames(): string[] {
    return PROFILE_DATA.projects.map((p) => p.title)
  },

  /**
   * Full name.
   */
  get fullName(): string {
    return `${PROFILE_DATA.bio.firstName} ${PROFILE_DATA.bio.lastName}`
  },

  /**
   * First name only.
   */
  get firstName(): string {
    return PROFILE_DATA.bio.firstName.split(' ')[0]
  },

  /**
   * Public contact email.
   */
  get email(): string {
    return PROFILE_DATA.contact.email
  },

  /**
   * Experience duration string (e.g. "July 2024 - Present").
   */
  get experienceDuration(): string {
    return PROFILE_DATA.experience[0].duration
  },

  /**
   * Total experience entries.
   */
  get totalExperiences(): number {
    return PROFILE_DATA.experience.length
  },

  /**
   * Project descriptions keyed by slug (first description).
   */
  get projectDescriptions(): Record<string, string> {
    return Object.fromEntries(
      PROFILE_DATA.projects.map((p) => [p.slug, p.descriptions[0] ?? ''])
    )
  },

  /**
   * Project tags keyed by slug.
   */
  get projectTags(): Record<string, string[]> {
    return Object.fromEntries(
      PROFILE_DATA.projects.map((p) => [p.slug, p.tags])
    )
  },

  /**
   * Tech from the intern experience entry.
   */
  get internTech(): string[] {
    const intern = PROFILE_DATA.experience.find((e) => e.title.toLowerCase().includes('intern'))
    return intern ? [...intern.tech] : []
  },

  /**
   * Tech from the current (first) experience entry.
   */
  get currentRoleTech(): string[] {
    return [...PROFILE_DATA.experience[0].tech]
  },

  /**
   * Social links (LinkedIn and GitHub).
   */
  get socialLinks(): { linkedin: string; github: string } {
    return {
      linkedin: PROFILE_DATA.contact.linkedin,
      github: PROFILE_DATA.contact.github,
    }
  },

  /**
   * Education degree string (e.g. "BS Computer Science").
   */
  get educationDegree(): string {
    return PROFILE_DATA.education.degree
  },

  /**
   * Education year.
   */
  get educationYear(): string {
    return PROFILE_DATA.education.year
  },

  /**
   * Description text from the current role.
   */
  get currentRoleDescription(): string {
    return PROFILE_DATA.experience[0].description
  },

  /**
   * Description text from the intern role.
   */
  get internRoleDescription(): string {
    const intern = PROFILE_DATA.experience.find((e) => e.title.toLowerCase().includes('intern'))
    return intern?.description ?? ''
  },

  /**
   * Flattened unique set of all project tags.
   */
  get allProjectTags(): string[] {
    const tags = new Set(PROFILE_DATA.projects.flatMap((p) => p.tags))
    return [...tags]
  },

  /**
   * List of hobby names.
   */
  get hobbyNames(): string[] {
    return PROFILE_DATA.hobbies.map((h) => h.name)
  },
}

/**
 * Regex helpers for assertions.
 * Returns case-insensitive patterns.
 */
export const assertionRegex = {
  /**
   * Matches the current company name (case-insensitive).
   */
  currentCompany(): string {
    return PROFILE_DATA.experience[0].company.toLowerCase().replace(/\s+/g, '\\s*')
  },

  /**
   * Matches any programming language from the profile.
   */
  anyLanguage(): string {
    return PROFILE_DATA.skills
      .filter((s) => LANGUAGE_NAMES.has(s.name))
      .map((s) => s.name.toLowerCase().replace(/[+]/g, '\\+').replace(/[/]/g, '|'))
      .join('|')
  },

  /**
   * Matches any framework from the profile.
   */
  anyFramework(): string {
    return PROFILE_DATA.skills
      .filter((s) => FRAMEWORK_NAMES.has(s.name))
      .map((s) => s.name.toLowerCase().replace('.', '\\.'))
      .join('|')
  },

  /**
   * Matches any database from the profile.
   */
  anyDatabase(): string {
    return PROFILE_DATA.skills
      .filter((s) => DATABASE_NAMES.has(s.name))
      .map((s) => s.name.toLowerCase())
      .join('|')
  },

  /**
   * Matches any skill from the profile.
   */
  anySkill(): string {
    return PROFILE_DATA.skills
      .map((s) => s.name.toLowerCase().replace(/[.+/]/g, '\\$&'))
      .join('|')
  },

  /**
   * Matches the education institution.
   */
  educationInstitution(): string {
    return PROFILE_DATA.education.institution.toLowerCase().replace(/\s+/g, '\\s*')
  },

  /**
   * Matches the education degree.
   */
  educationDegree(): string {
    return `${PROFILE_DATA.education.degree}|computer\\s*science`.toLowerCase()
  },

  /**
   * Matches any project name.
   */
  anyProject(): string {
    return PROFILE_DATA.projects
      .map((p) => p.title.toLowerCase().replace(/['']/g, "'?").replace(/\s+/g, '\\s*'))
      .join('|')
  },

  /**
   * Matches any tag from any project.
   */
  anyProjectTag(): string {
    const tags = new Set(PROFILE_DATA.projects.flatMap((p) => p.tags))
    return [...tags].map((t) => t.toLowerCase().replace(/[.+]/g, '\\$&')).join('|')
  },

  /**
   * Matches any tech from the intern role.
   */
  internSkill(): string {
    const intern = PROFILE_DATA.experience.find((e) => e.title.toLowerCase().includes('intern'))
    return (intern?.tech ?? []).map((s) => s.toLowerCase().replace(/[.+]/g, '\\$&')).join('|')
  },

  /**
   * Matches any tech from the current role.
   */
  currentRoleSkill(): string {
    return PROFILE_DATA.experience[0].tech
      .map((s) => s.toLowerCase().replace(/[.+]/g, '\\$&'))
      .join('|')
  },

  /**
   * Matches any hobby name from the profile.
   */
  anyHobby(): string {
    return PROFILE_DATA.hobbies
      .map((h) => h.name.toLowerCase().replace(/\s+/g, '\\s*'))
      .join('|')
  },

  /**
   * Matches LinkedIn or GitHub URL.
   */
  socialLink(): string {
    return [PROFILE_DATA.contact.linkedin, PROFILE_DATA.contact.github]
      .map((u) => u.replace(/[/.+?]/g, '\\$&'))
      .join('|')
  },
}
