import type { ZodSchema, z } from 'zod'
import { ValidationError } from '@/errors/app.error'
import { parseZodErrors } from './parse-errors'

export function validate<T extends ZodSchema>(schema: T, data: unknown, label: string): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ValidationError(label, parseZodErrors(result.error))
  }
  return result.data
}
