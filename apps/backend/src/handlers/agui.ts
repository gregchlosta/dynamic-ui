import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { EventType, Tool } from '@ag-ui/core'
import { encodeSSE } from '../utils.js'
import Anthropic from '@anthropic-ai/sdk'

// ============================================================================
// AG-UI Tool Definitions
// ============================================================================

const AGUI_TOOLS: Tool[] = [
  {
    name: 'show_chart',
    description:
      'Display a chart with data visualization when user asks for charts, graphs, or data visualization. IMPORTANT: If the user does not provide specific data, generate realistic sample data that demonstrates the chart functionality. Always create the component even without user data.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Chart title',
        },
        type: {
          type: 'string',
          enum: ['bar', 'line', 'area', 'pie'],
          description: 'Chart type',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'number' },
            },
            required: ['name', 'value'],
          },
          description: 'Data points for the chart',
        },
      },
      required: ['title', 'type', 'data'],
    },
  },
  {
    name: 'show_weather_card',
    description:
      'Display a weather forecast card when user asks about weather. IMPORTANT: If no specific city or weather data is provided, generate realistic sample weather data for a default city. Always create the component even without user data.',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'City name',
        },
        temperature: {
          type: 'number',
          description: 'Current temperature in Fahrenheit',
        },
        condition: {
          type: 'string',
          description: 'Weather condition (sunny, cloudy, rainy, etc.)',
        },
        humidity: {
          type: 'number',
          description: 'Humidity percentage',
        },
        windSpeed: {
          type: 'number',
          description: 'Wind speed in mph',
        },
        forecast: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              day: { type: 'string' },
              high: { type: 'number' },
              low: { type: 'number' },
              condition: { type: 'string' },
            },
            required: ['day', 'high', 'low', 'condition'],
          },
          description: '3-day forecast',
        },
      },
      required: [
        'city',
        'temperature',
        'condition',
        'humidity',
        'windSpeed',
        'forecast',
      ],
    },
  },
  {
    name: 'show_task_list',
    description:
      'Display an interactive task list or to-do list when user wants to track tasks. IMPORTANT: If the user does not provide specific tasks, generate 3-5 realistic sample tasks that demonstrate the functionality. Always create the component even without user data.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Task list title',
        },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              text: { type: 'string' },
              completed: { type: 'boolean' },
              priority: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
              },
            },
            required: ['id', 'text', 'completed', 'priority'],
          },
        },
      },
      required: ['title', 'tasks'],
    },
  },
  {
    name: 'show_card_grid',
    description:
      'Display a grid of cards for showing multiple items or options. IMPORTANT: If the user does not provide specific cards, generate 3-4 realistic sample cards that demonstrate the grid functionality. Always create the component even without user data.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Grid title',
        },
        cards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              status: {
                type: 'string',
                enum: ['active', 'pending', 'completed'],
              },
              metadata: {
                type: 'object',
                additionalProperties: true,
              },
            },
            required: ['id', 'title', 'description', 'status'],
          },
        },
      },
      required: ['title', 'cards'],
    },
  },
  {
    name: 'show_progress_tracker',
    description:
      'Display a progress tracker showing steps in a process. IMPORTANT: If the user does not provide specific steps, generate 4-6 realistic sample steps that demonstrate the tracker functionality. Always create the component even without user data.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Progress tracker title',
        },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
              status: {
                type: 'string',
                enum: ['completed', 'in-progress', 'pending'],
              },
              description: { type: 'string' },
            },
            required: ['id', 'label', 'status'],
          },
        },
        currentStep: {
          type: 'number',
          description: 'Index of the current step',
        },
      },
      required: ['title', 'steps', 'currentStep'],
    },
  },
]

const systemPrompt = `You are a helpful UI assistant with access to visualization tools.

When users request charts, weather info, task lists, card grids, or progress trackers, use the appropriate tool to create interactive components.

IMPORTANT: If users don't provide specific data, generate realistic sample data to demonstrate the component's functionality. Always create the UI even when data isn't explicitly provided.

Be conversational and helpful in your text responses while using tools to enhance the user experience.`

// ============================================================================
// Handler
// ============================================================================

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
      system: systemPrompt,
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
