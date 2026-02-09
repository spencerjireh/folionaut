/**
 * Derived ground truths and assertion helpers.
 * All values are computed from PROFILE_DATA to maintain consistency.
 */

import { PROFILE_DATA } from './data'

/**
 * Computed ground truth statements derived from profile data.
 */
export const groundTruths = {
  /**
   * Current employer description.
   */
  get currentEmployer(): string {
    const exp = PROFILE_DATA.experience[0]
    return `${PROFILE_DATA.name.split(' ')[0]} currently works at ${exp.company} as a ${exp.role}.`
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
    return PROFILE_DATA.experience[0].role
  },

  /**
   * List of programming languages.
   */
  get programmingLanguages(): string[] {
    return [...PROFILE_DATA.skills.languages]
  },

  /**
   * List of frameworks.
   */
  get frameworks(): string[] {
    return [...PROFILE_DATA.skills.frameworks]
  },

  /**
   * List of databases from tools.
   */
  get databases(): string[] {
    return PROFILE_DATA.skills.tools.filter((t) =>
      ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'].includes(t)
    )
  },

  /**
   * All tools.
   */
  get tools(): string[] {
    return [...PROFILE_DATA.skills.tools]
  },

  /**
   * Education summary.
   */
  get education(): string {
    const edu = PROFILE_DATA.education[0]
    return `${edu.degree} in ${edu.field} from ${edu.institution}`
  },

  /**
   * Education institution name.
   */
  get educationInstitution(): string {
    return PROFILE_DATA.education[0].institution
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
    return PROFILE_DATA.name
  },

  /**
   * First name only.
   */
  get firstName(): string {
    return PROFILE_DATA.name.split(' ')[0]
  },

  /**
   * Public contact email.
   */
  get email(): string {
    return PROFILE_DATA.email
  },

  /**
   * Experience start date.
   */
  get experienceStartDate(): string {
    return PROFILE_DATA.experience[0].startDate
  },

  /**
   * Total experience entries.
   */
  get totalExperiences(): number {
    return PROFILE_DATA.experience.length
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
    return PROFILE_DATA.skills.languages.map((l) => l.toLowerCase()).join('|')
  },

  /**
   * Matches any framework from the profile.
   */
  anyFramework(): string {
    return PROFILE_DATA.skills.frameworks.map((f) => f.toLowerCase().replace('.', '\\.')).join('|')
  },

  /**
   * Matches any database from the profile.
   */
  anyDatabase(): string {
    return groundTruths.databases.map((d) => d.toLowerCase()).join('|')
  },

  /**
   * Matches any tool from the profile.
   */
  anyTool(): string {
    return PROFILE_DATA.skills.tools.map((t) => t.toLowerCase().replace(/[.+]/g, '\\$&')).join('|')
  },

  /**
   * Matches the education institution.
   */
  educationInstitution(): string {
    return PROFILE_DATA.education[0].institution.toLowerCase().replace(/\s+/g, '\\s*')
  },

  /**
   * Matches the education degree and field.
   */
  educationDegree(): string {
    const edu = PROFILE_DATA.education[0]
    return `${edu.degree}|${edu.field}|computer\\s*science`.toLowerCase()
  },

  /**
   * Matches any project name.
   */
  anyProject(): string {
    return PROFILE_DATA.projects
      .map((p) => p.title.toLowerCase().replace(/['']/g, "'?").replace(/\s+/g, '\\s*'))
      .join('|')
  },
}
