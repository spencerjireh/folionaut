import type { ContentType } from '@/db/models'

export interface ContentListOptions {
  type?: ContentType
}

export interface ServiceResponse<T> {
  data: T
  etag: string
}
