import { AGUIEvent } from './types.js'

// Encode events in SSE format
export function encodeSSE(event: AGUIEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}
