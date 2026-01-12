import { Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import OpenAI from 'openai'
import type { ChatCompletionTool } from 'openai/resources/chat/completions'
import { EventType, AgentRequest, ChatMessage } from '../types.js'
import { encodeSSE } from '../utils.js'

// A2UI tool - agent can create ANY UI component declaratively
const a2uiTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'render_custom_ui',
    description:
      'Generate a custom UI component specification for any visualization, dashboard, card, form, or interface. Use this to create dynamic, flexible UIs by specifying component hierarchy.',
    parameters: {
      type: 'object',
      properties: {
        specification: {
          type: 'object',
          description:
            'Complete UI specification in A2UI format with component tree',
          properties: {
            component: {
              type: 'string',
              description:
                'Root component type: container, card, list, grid, heading, text, button, image, badge, divider, spacer',
            },
            props: {
              type: 'object',
              description:
                'Component properties (text, level, content, src, alt, label, color, items, columns, etc.)',
            },
            children: {
              type: 'array',
              description: 'Array of child component specifications',
              items: {
                type: 'object',
              },
            },
            layout: {
              type: 'string',
              enum: ['vertical', 'horizontal', 'grid'],
              description: 'Layout direction for container components',
            },
            style: {
              type: 'object',
              description: 'Optional CSS style properties',
            },
          },
          required: ['component'],
        },
      },
      required: ['specification'],
    },
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
  openai: OpenAI,
  req: AgentRequest,
  res: Response
): Promise<void> {
  const { messages, threadId, runId } = req

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

    // Filter out 'tool' role messages before sending to OpenAI
    const openAIMessages = messages.filter(
      (msg: ChatMessage) => msg.role !== 'tool'
    ) as OpenAI.Chat.Completions.ChatCompletionMessageParam[]

    // Call OpenAI with A2UI tool
    const response = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...openAIMessages,
      ],
      tools: [a2uiTool],
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

    // Send text content if any
    if (assistantMessage.content) {
      res.write(
        encodeSSE({
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: messageId,
          delta: assistantMessage.content,
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

    // Handle A2UI tool calls
    if (assistantMessage.tool_calls) {
      for (const toolCall of assistantMessage.tool_calls) {
        if (
          'function' in toolCall &&
          toolCall.function.name === 'render_custom_ui'
        ) {
          const args = JSON.parse(toolCall.function.arguments)
          const specId = uuidv4()

          // Emit UI specification event
          res.write(
            encodeSSE({
              type: 'ui.spec',
              specId: specId,
              specification: {
                version: '1.0',
                ...args.specification,
              },
              parentMessageId: messageId,
            })
          )
        }
      }
    }

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
    console.error('Error in /api/a2ui:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    res.write(
      encodeSSE({
        type: EventType.RUN_ERROR,
        message: errorMessage,
        code: 'INTERNAL_ERROR',
      })
    )

    res.end()
  }
}
