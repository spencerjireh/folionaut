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

  /**
   * Project descriptions keyed by slug.
   */
  get projectDescriptions(): Record<string, string> {
    return Object.fromEntries(PROFILE_DATA.projects.map((p) => [p.slug, p.description]))
  },

  /**
   * Project tags keyed by slug.
   */
  get projectTags(): Record<string, string[]> {
    return Object.fromEntries(PROFILE_DATA.projects.map((p) => [p.slug, p.tags]))
  },

  /**
   * Skills from the Java Intern experience entry.
   */
  get internSkills(): string[] {
    const intern = PROFILE_DATA.experience.find((e) => e.role.toLowerCase().includes('intern'))
    return intern ? [...intern.skills] : []
  },

  /**
   * Skills from the current (first) experience entry.
   */
  get currentRoleSkills(): string[] {
    return [...PROFILE_DATA.experience[0].skills]
  },

  /**
   * Social links (LinkedIn and GitHub).
   */
  get socialLinks(): { linkedin: string; github: string } {
    return { ...PROFILE_DATA.social }
  },

  /**
   * Education field of study.
   */
  get educationField(): string {
    return PROFILE_DATA.education[0].field
  },

  /**
   * Education degree type (e.g. "BS").
   */
  get educationDegreeType(): string {
    return PROFILE_DATA.education[0].degree
  },

  /**
   * Education location.
   */
  get educationLocation(): string {
    return PROFILE_DATA.education[0].location ?? ''
  },

  /**
   * Portfolio website URL.
   */
  get website(): string {
    return PROFILE_DATA.website
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
    const intern = PROFILE_DATA.experience.find((e) => e.role.toLowerCase().includes('intern'))
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

  /**
   * Matches any tag from any project.
   */
  anyProjectTag(): string {
    const tags = new Set(PROFILE_DATA.projects.flatMap((p) => p.tags))
    return [...tags].map((t) => t.toLowerCase().replace(/[.+]/g, '\\$&')).join('|')
  },

  /**
   * Matches any skill from the intern role.
   */
  internSkill(): string {
    const intern = PROFILE_DATA.experience.find((e) => e.role.toLowerCase().includes('intern'))
    return (intern?.skills ?? []).map((s) => s.toLowerCase().replace(/[.+]/g, '\\$&')).join('|')
  },

  /**
   * Matches any skill from the current role.
   */
  currentRoleSkill(): string {
    return PROFILE_DATA.experience[0].skills
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
    return [PROFILE_DATA.social.linkedin, PROFILE_DATA.social.github]
      .map((u) => u.replace(/[/.+?]/g, '\\$&'))
      .join('|')
  },
}
