import type { ZodError } from 'zod'

export function parseZodErrors(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root'
    if (!fields[path]) fields[path] = []
    fields[path].push(issue.message)
  }
  return fields
}
