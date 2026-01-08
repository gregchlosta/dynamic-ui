import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import OpenAI from 'openai'

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// AG-UI Event Types
const EventType = {
  RUN_STARTED: 'run.started',
  RUN_FINISHED: 'run.finished',
  RUN_ERROR: 'run.error',
  TEXT_MESSAGE_START: 'text_message.start',
  TEXT_MESSAGE_CONTENT: 'text_message.content',
  TEXT_MESSAGE_END: 'text_message.end',
  TOOL_CALL_START: 'tool_call.start',
  TOOL_CALL_ARGS: 'tool_call.args',
  TOOL_CALL_END: 'tool_call.end',
}

// Define available tools for dynamic UI generation
const tools = [
  {
    type: 'function',
    function: {
      name: 'show_chart',
      description:
        'Display a chart with data visualization when user asks for charts, graphs, or data visualization',
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
            },
            description: 'Data points for the chart',
          },
        },
        required: ['title', 'type', 'data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'show_weather_card',
      description:
        'Display a weather forecast card when user asks about weather',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name' },
          temperature: {
            type: 'number',
            description: 'Current temperature in Fahrenheit',
          },
          condition: {
            type: 'string',
            description: 'Weather condition (sunny, cloudy, rainy, etc.)',
          },
          humidity: { type: 'number', description: 'Humidity percentage' },
          windSpeed: { type: 'number', description: 'Wind speed in mph' },
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
  },
  {
    type: 'function',
    function: {
      name: 'show_task_list',
      description:
        'Display an interactive task list or to-do list when user wants to track tasks',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task list title' },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
                completed: { type: 'boolean' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'] },
              },
            },
            description: 'Array of tasks',
          },
        },
        required: ['title', 'tasks'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'show_card_grid',
      description:
        'Display a grid of cards with images and information when showing multiple items',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Grid title' },
          cards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                image: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
              },
            },
            description: 'Array of cards to display',
          },
        },
        required: ['title', 'cards'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'show_progress_tracker',
      description:
        'Display a progress tracker for multi-step processes or projects',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Project title' },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                status: {
                  type: 'string',
                  enum: ['pending', 'in-progress', 'completed'],
                },
                description: { type: 'string' },
              },
            },
            description: 'Steps in the process',
          },
        },
        required: ['title', 'steps'],
      },
    },
  },
]

// Encode events in SSE format
function encodeSSE(event) {
  return `data: ${JSON.stringify(event)}\n\n`
}

// Main agent endpoint
app.post('/api/agent', async (req, res) => {
  const { messages, threadId, runId } = req.body

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const currentThreadId = threadId || uuidv4()
  const currentRunId = runId || uuidv4()

  try {
    // Send RUN_STARTED event
    res.write(
      encodeSSE({
        type: EventType.RUN_STARTED,
        threadId: currentThreadId,
        runId: currentRunId,
      })
    )

    // Get user's last message
    const userMessage = messages[messages.length - 1]?.content || ''

    // Filter out 'tool' role messages (UI components) before sending to OpenAI
    const openAIMessages = messages.filter((msg) => msg.role !== 'tool')

    // Call OpenAI with tools
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant that can generate visual UI components in response to user requests. 
          When users ask for things that can be visualized (charts, weather, tasks, cards, progress), call the appropriate tool to show them a beautiful UI component.
          Be creative and provide realistic data when generating these components.`,
        },
        ...openAIMessages,
      ],
      tools: tools,
      tool_choice: 'auto',
    })

    const assistantMessage = response.choices[0].message
    const messageId = uuidv4()

    // Send TEXT_MESSAGE_START
    res.write(
      encodeSSE({
        type: EventType.TEXT_MESSAGE_START,
        messageId: messageId,
        role: 'assistant',
      })
    )

    // If there are tool calls, handle them
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      for (const toolCall of assistantMessage.tool_calls) {
        const toolCallId = uuidv4()

        // Send TOOL_CALL_START
        res.write(
          encodeSSE({
            type: EventType.TOOL_CALL_START,
            toolCallId: toolCallId,
            toolCallName: toolCall.function.name,
            parentMessageId: messageId,
          })
        )

        // Send TOOL_CALL_ARGS
        res.write(
          encodeSSE({
            type: EventType.TOOL_CALL_ARGS,
            toolCallId: toolCallId,
            delta: toolCall.function.arguments,
          })
        )

        // Send TOOL_CALL_END
        res.write(
          encodeSSE({
            type: EventType.TOOL_CALL_END,
            toolCallId: toolCallId,
          })
        )
      }
    }

    // Send text content if any
    if (assistantMessage.content) {
      res.write(
        encodeSSE({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: messageId,
          delta: assistantMessage.content,
        })
      )
    } else {
      // Default message if only tool calls
      res.write(
        encodeSSE({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: messageId,
          delta: "Here's what I generated for you:",
        })
      )
    }

    // Send TEXT_MESSAGE_END
    res.write(
      encodeSSE({
        type: EventType.TEXT_MESSAGE_END,
        messageId: messageId,
      })
    )

    // Send RUN_FINISHED
    res.write(
      encodeSSE({
        type: EventType.RUN_FINISHED,
        threadId: currentThreadId,
        runId: currentRunId,
      })
    )

    res.end()
  } catch (error) {
    console.error('Error:', error)

    res.write(
      encodeSSE({
        type: EventType.RUN_ERROR,
        message: error.message,
        code: 'INTERNAL_ERROR',
      })
    )

    res.end()
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => {
  console.log(`🚀 Backend server running on http://localhost:${port}`)
})
