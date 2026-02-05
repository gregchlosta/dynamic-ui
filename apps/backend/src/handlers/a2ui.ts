import { Response, Request } from 'express'
import { v4 as uuidv4 } from 'uuid'
import Anthropic from '@anthropic-ai/sdk'
import { encodeSSE } from '../utils.js'

let anthropicInstance: Anthropic | null = null

function getAnthropic(): Anthropic {
  if (!anthropicInstance) {
    anthropicInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropicInstance
}

interface A2UIRequest {
  message: string
  conversationHistory?: Message[]
}

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// A2UI tool for Anthropic
const a2uiTool = {
  name: 'render_custom_ui',
  description:
    'Generate a custom UI component specification for any visualization, dashboard, card, form, or interface. Use this to create dynamic, flexible UIs by specifying component hierarchy. IMPORTANT: If the user does not provide specific data, always generate realistic and diverse sample data to demonstrate the component capabilities.',
  input_schema: {
    type: 'object' as const,
    properties: {
      specification: {
        type: 'object' as const,
        description:
          'Complete UI specification in A2UI format with component tree',
        properties: {
          component: {
            type: 'string' as const,
            description:
              'Root component type: container, card, list, grid, heading, text, button, image, badge, divider, spacer, metric, progress, alert, link, table, code',
          },
          props: {
            type: 'object' as const,
            description:
              'Component properties (text, level, content, src, alt, label, color, items, columns, value, etc.)',
          },
          children: {
            type: 'array' as const,
            description: 'Array of child component specifications',
            items: {
              type: 'object' as const,
            },
          },
          layout: {
            type: 'string' as const,
            enum: ['vertical', 'horizontal', 'grid'],
            description: 'Layout direction for container components',
          },
          style: {
            type: 'object' as const,
            description: 'Optional CSS style properties',
          },
        },
        required: ['component'],
      },
    },
    required: ['specification'],
  },
}

const systemPrompt = `You are a creative UI designer AI with the ability to create beautiful, modern UI components using A2UI (Agent-to-UI) declarative specifications.

When users request visualizations, dashboards, cards, or any UI elements, use the render_custom_ui tool to create visually appealing, colorful, and professional interfaces.

AVAILABLE COMPONENTS:
- container: Layout wrapper (layout: vertical/horizontal/grid)
- card: Beautiful container with shadow and rounded corners
- heading: Large titles (level: 1-6)
- text: Paragraph text
- metric: Large value with label (displays prominently)
- progress: Progress bar (value: 0-100, color: blue/green/red/yellow/purple)
- badge: Colored labels (color: blue/green/red/yellow/purple/gray/orange)
- button: Interactive button
- list: Bullet point list
- grid: Multi-column layout (columns: 1-6)
- alert: Notification box (type: info/success/warning/error)
- link: Hyperlink (newTab: true/false)
- image: Display images
- table: Data tables (headers, rows)
- code: Code snippets
- divider: Horizontal line
- spacer: Vertical spacing

DESIGN PRINCIPLES - ALWAYS FOLLOW:
1. **Use Colors Extensively**: Add colored badges, use progress bars with different colors, create visual hierarchy
2. **Add Metrics**: Use 'metric' component for numbers, stats, and KPIs (large, bold, prominent)
3. **Grid Layouts**: Use grid with 2-4 columns for dashboards and card layouts
4. **Visual Hierarchy**: Mix heading levels, use badges for status, add icons with emojis
5. **Group with Cards**: Wrap related content in cards for clean separation
6. **Progress Indicators**: Show progress bars with appropriate colors (green for good, red for bad)
7. **Rich Content**: Include emojis, icons, varied text formatting
8. **Alerts for Highlights**: Use alert component for important information with appropriate types

STYLING BEST PRACTICES:
- Metrics should have large, prominent numbers
- Use badge colors meaningfully (green=success, red=error, blue=info, yellow=warning)
- Progress bars should use semantic colors
- Grid layouts make dashboards more professional
- Cards add depth and organization
- Mix components for visual interest

GOOD EXAMPLE (Dashboard):
{
  "component": "container",
  "layout": "vertical",
  "children": [
    {
      "component": "heading",
      "props": { "text": "📊 Sales Dashboard", "level": 1 }
    },
    {
      "component": "grid",
      "props": { "columns": 3 },
      "children": [
        {
          "component": "card",
          "children": [
            { "component": "metric", "props": { "value": "$45.2K", "label": "💰 Revenue" } },
            { "component": "badge", "props": { "text": "+12.5%", "color": "green" } }
          ]
        },
        {
          "component": "card",
          "children": [
            { "component": "metric", "props": { "value": "1,234", "label": "📦 Orders" } },
            { "component": "badge", "props": { "text": "+8.3%", "color": "green" } }
          ]
        },
        {
          "component": "card",
          "children": [
            { "component": "metric", "props": { "value": "89%", "label": "⭐ Satisfaction" } },
            { "component": "badge", "props": { "text": "Excellent", "color": "blue" } }
          ]
        }
      ]
    },
    {
      "component": "card",
      "children": [
        { "component": "heading", "props": { "text": "🎯 Goals Progress", "level": 3 } },
        { "component": "progress", "props": { "value": 75, "label": "Q1 Target", "color": "blue" } },
        { "component": "spacer", "props": { "height": 10 } },
        { "component": "progress", "props": { "value": 92, "label": "Customer Retention", "color": "green" } }
      ]
    }
  ]
}

Always create visually rich, colorful, and professional-looking interfaces!`

export async function handleA2UIRequest(
  body: A2UIRequest,
  res: Response,
  req: Request,
): Promise<void> {
  const { message, conversationHistory = [] } = body

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const currentThreadId = uuidv4()
  const currentRunId = uuidv4()

  try {
    // Send RUN_STARTED event
    res.write(
      encodeSSE({
        type: 'RUN_STARTED',
        threadId: currentThreadId,
        runId: currentRunId,
      }),
    )

    const anthropic = getAnthropic()

    // Build message history for Anthropic
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ]

    // Call Anthropic with streaming
    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      tools: [a2uiTool],
    })

    const messageId = uuidv4()
    let hasStartedMessage = false
    let currentToolUseId: string | null = null
    let currentToolName: string | null = null
    let accumulatedToolInput = ''

    // Process streaming events
    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'text') {
          // Start text message
          if (!hasStartedMessage) {
            res.write(
              encodeSSE({
                type: 'TEXT_MESSAGE_START',
                messageId,
                role: 'assistant',
              }),
            )
            hasStartedMessage = true
          }
        } else if (event.content_block.type === 'tool_use') {
          // Tool use started
          currentToolUseId = event.content_block.id
          currentToolName = event.content_block.name
          accumulatedToolInput = ''
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          // Stream text content
          res.write(
            encodeSSE({
              type: 'TEXT_MESSAGE_CONTENT',
              messageId,
              delta: event.delta.text,
            }),
          )
        } else if (event.delta.type === 'input_json_delta') {
          // Accumulate tool input
          accumulatedToolInput += event.delta.partial_json
        }
      } else if (event.type === 'content_block_stop') {
        if (currentToolUseId && currentToolName === 'render_custom_ui') {
          // Tool use completed - emit UI specification
          try {
            const args = JSON.parse(accumulatedToolInput)
            const specId = uuidv4()

            res.write(
              encodeSSE({
                type: 'ui.spec',
                specId,
                specification: {
                  version: '1.0',
                  ...args.specification,
                },
                parentMessageId: messageId,
              }),
            )
          } catch (e) {
            console.error('Failed to parse tool input:', e)
          }
          currentToolUseId = null
          currentToolName = null
          accumulatedToolInput = ''
        }
      } else if (event.type === 'message_stop') {
        // End text message if we started one
        if (hasStartedMessage) {
          res.write(
            encodeSSE({
              type: 'TEXT_MESSAGE_END',
              messageId,
            }),
          )
        }
      }
    }

    // Send RUN_FINISHED
    res.write(
      encodeSSE({
        type: 'RUN_FINISHED',
        threadId: currentThreadId,
        runId: currentRunId,
      }),
    )

    res.end()
  } catch (error) {
    console.error('Error in /api/a2ui:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    res.write(
      encodeSSE({
        type: 'RUN_ERROR',
        message: errorMessage,
        code: 'INTERNAL_ERROR',
      }),
    )

    res.end()
  }
}
