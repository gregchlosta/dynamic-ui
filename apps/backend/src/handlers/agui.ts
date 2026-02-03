import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { RunAgentInput, EventType } from '@ag-ui/core'
import { AnthropicAgent } from '../agents/anthropic-agent.js'
import { AGUI_TOOLS } from '../tools/definitions.js'
import { encodeSSE } from '../utils.js'

// Lazy-load agent to ensure environment variables are loaded
let agent: AnthropicAgent | null = null
function getAgent() {
  if (!agent) {
    agent = new AnthropicAgent({
      model: 'claude-sonnet-4-20250514',
    })
  }
  return agent
}

// Handler for AG-UI protocol requests
export async function handleAGUIRequest(
  body: any,
  res: Response,
  req?: Request,
) {
  try {
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const { messages, tools, context, state, forwardedProps, threadId, runId } =
      body

    // Create AG-UI protocol input
    const input: RunAgentInput = {
      threadId: threadId || uuidv4(),
      runId: runId || uuidv4(),
      messages: messages || [],
      tools: AGUI_TOOLS,
      context: context || [],
      state: state || {},
      forwardedProps: forwardedProps || {},
    }

    // Subscribe to agent events and stream them to client
    const subscription = getAgent()
      .run(input)
      .subscribe({
        next: (event) => {
          // Send AG-UI protocol event via SSE
          const encoded = encodeSSE(event)
          console.log(
            'Writing SSE event:',
            event.type,
            'length:',
            encoded.length,
          )
          res.write(encoded)
          // Explicitly flush for SSE streaming
          if (typeof (res as any).flush === 'function') {
            ;(res as any).flush()
          }
        },
        error: (error) => {
          console.error('Agent error:', error)
          res.write(
            encodeSSE({
              type: EventType.RUN_ERROR,
              message: error.message || 'Unknown error',
              code: error.code || 'UNKNOWN_ERROR',
              timestamp: Date.now(),
            }),
          )
          res.end()
        },
        complete: () => {
          res.end()
        },
      })

    // Handle client disconnect
    if (req) {
      req.on('close', () => {
        subscription.unsubscribe()
      })
    }
  } catch (error: any) {
    console.error('Request error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  }
}
