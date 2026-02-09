import { nanoid } from 'nanoid'

export type IdPrefix = 'content' | 'hist' | 'sess' | 'msg'

const prefixes: Record<IdPrefix, string> = {
  content: 'content_',
  hist: 'hist_',
  sess: 'sess_',
  msg: 'msg_',
}

export function generateId(prefix: IdPrefix): string {
  return `${prefixes[prefix]}${nanoid(21)}`
}

export function contentId(): string {
  return generateId('content')
}

export function historyId(): string {
  return generateId('hist')
}

export function sessionId(): string {
  return generateId('sess')
}

export function messageId(): string {
  return generateId('msg')
}
