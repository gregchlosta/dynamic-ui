// Encode events in SSE format
export function encodeSSE(event: any): string {
  return `data: ${JSON.stringify(event)}\n\n`
}
