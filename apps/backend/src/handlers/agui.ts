import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { EventType } from '@ag-ui/core'
import { AGUI_TOOLS } from '../tools/definitions.js'
import { encodeSSE } from '../utils.js'
import Anthropic from '@anthropic-ai/sdk'

// Lazy initialize to ensure env vars are loaded
let anthropic: Anthropic | null = null
function getAnthropic() {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropic
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
    res.flushHeaders()

    const { messages, threadId, runId } = body
    const tid = threadId || uuidv4()
    const rid = runId || uuidv4()

    // Emit RUN_STARTED
    res.write(
      encodeSSE({
        type: EventType.RUN_STARTED,
        threadId: tid,
        runId: rid,
        timestamp: Date.now(),
      }),
    )

    // Convert messages to Anthropic format
    const anthropicMessages = messages
      .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg: any) => ({
        role: msg.role,
        content:
          typeof msg.content === 'string'
            ? msg.content
            : JSON.stringify(msg.content),
      }))

    // Stream from Anthropic
    const stream = getAnthropic().messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: anthropicMessages,
      tools: AGUI_TOOLS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
      })),
    })

    let currentMessageId: string | null = null
    let currentToolCallId: string | null = null

    // Process streaming events
    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if ((event as any).content_block.type === 'text') {
          currentMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          res.write(
            encodeSSE({
              type: EventType.TEXT_MESSAGE_START,
              messageId: currentMessageId,
              role: 'assistant',
              timestamp: Date.now(),
            }),
          )
        } else if ((event as any).content_block.type === 'tool_use') {
          currentToolCallId = (event as any).content_block.id
          res.write(
            encodeSSE({
              type: EventType.TOOL_CALL_START,
              toolCallId: currentToolCallId,
              toolCallName: (event as any).content_block.name,
              timestamp: Date.now(),
            }),
          )
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          res.write(
            encodeSSE({
              type: EventType.TEXT_MESSAGE_CONTENT,
              messageId: currentMessageId!,
              delta: event.delta.text,
              timestamp: Date.now(),
            }),
          )
        } else if (event.delta.type === 'input_json_delta') {
          res.write(
            encodeSSE({
              type: EventType.TOOL_CALL_ARGS,
              toolCallId: currentToolCallId!,
              delta: event.delta.partial_json,
              timestamp: Date.now(),
            }),
          )
        }
      } else if (event.type === 'content_block_stop') {
        if (currentMessageId) {
          res.write(
            encodeSSE({
              type: EventType.TEXT_MESSAGE_END,
              messageId: currentMessageId,
              timestamp: Date.now(),
            }),
          )
          currentMessageId = null
        } else if (currentToolCallId) {
          res.write(
            encodeSSE({
              type: EventType.TOOL_CALL_END,
              toolCallId: currentToolCallId,
              timestamp: Date.now(),
            }),
          )
          currentToolCallId = null
        }
      }
    }

    const finalMessage = await stream.finalMessage()

    // Emit RUN_FINISHED
    res.write(
      encodeSSE({
        type: EventType.RUN_FINISHED,
        threadId: tid,
        runId: rid,
        result: finalMessage,
        timestamp: Date.now(),
      }),
    )

    res.end()
  } catch (error: any) {
    console.error('AGUI handler error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: error.message })
    } else {
      res.write(
        encodeSSE({
          type: EventType.RUN_ERROR,
          message: error.message || 'Unknown error',
          code: error.code || 'UNKNOWN_ERROR',
          timestamp: Date.now(),
        }),
      )
      res.end()
    }
  }
}
