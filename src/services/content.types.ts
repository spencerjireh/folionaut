export interface ContentListOptions {
  type?: string
}

export interface ServiceResponse<T> {
  data: T
  etag: string
}
