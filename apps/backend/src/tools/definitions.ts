import { z } from 'zod'
import { Tool } from '@ag-ui/core'

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

export const ChartToolSchema = z.object({
  title: z.string(),
  type: z.enum(['bar', 'line', 'area', 'pie']),
  data: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
    }),
  ),
})

export const WeatherToolSchema = z.object({
  city: z.string(),
  temperature: z.number(),
  condition: z.string(),
  humidity: z.number(),
  windSpeed: z.number(),
  forecast: z.array(
    z.object({
      day: z.string(),
      high: z.number(),
      low: z.number(),
      condition: z.string(),
    }),
  ),
})

export const TaskListToolSchema = z.object({
  title: z.string(),
  tasks: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      completed: z.boolean(),
      priority: z.enum(['high', 'medium', 'low']),
    }),
  ),
})

export const CardGridToolSchema = z.object({
  title: z.string(),
  cards: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      status: z.enum(['active', 'pending', 'completed']),
      metadata: z.record(z.string(), z.any()).optional(),
    }),
  ),
})

export const ProgressToolSchema = z.object({
  title: z.string(),
  steps: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      status: z.enum(['completed', 'in-progress', 'pending']),
      description: z.string().optional(),
    }),
  ),
  currentStep: z.number(),
})

// ============================================================================
// TypeScript Types (Inferred from Zod Schemas)
// ============================================================================

export type ChartToolArgs = z.infer<typeof ChartToolSchema>
export type WeatherToolArgs = z.infer<typeof WeatherToolSchema>
export type TaskListToolArgs = z.infer<typeof TaskListToolSchema>
export type CardGridToolArgs = z.infer<typeof CardGridToolSchema>
export type ProgressToolArgs = z.infer<typeof ProgressToolSchema>

// ============================================================================
// AG-UI Tool Definitions
// ============================================================================

export const AGUI_TOOLS: Tool[] = [
  {
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
    description: 'Display a weather forecast card when user asks about weather',
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
      'Display an interactive task list or to-do list when user wants to track tasks',
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
      'Display a grid of cards for showing multiple items or options',
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
    description: 'Display a progress tracker showing steps in a process',
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
