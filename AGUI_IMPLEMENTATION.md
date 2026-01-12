# AGUI (Tool-Based UI) - Implementation Guide

## Overview

**AGUI** (Agent-User Interaction) is a tool-based approach where AI agents call pre-defined tools to render specific UI components. This provides type-safe, performant, and predictable UI generation.

## Architecture

```
User Request → Agent Selects Tool → Backend Emits Tool Call → Frontend Maps to Component
```

### How It Works

1. User sends a message (e.g., "Show me a sales chart")
2. AI agent analyzes the request and selects appropriate tool (`show_chart`)
3. Backend emits `TOOL_CALL` events with tool name and arguments
4. Frontend router maps tool to pre-built component
5. Component renders with provided data

## Project Structure

```
agui/
├── src/
│   ├── components/
│   │   ├── ChatInterface.tsx       # Main chat UI with SSE handling
│   │   ├── Message.tsx             # Message display component
│   │   ├── DynamicUIComponent.tsx  # Tool → Component router
│   │   └── ui/
│   │       ├── ChartComponent.tsx      # Charts (Bar, Line, Area, Pie)
│   │       ├── WeatherCard.tsx         # Weather display
│   │       ├── TaskList.tsx            # Interactive task list
│   │       ├── CardGrid.tsx            # Card collections
│   │       └── ProgressTracker.tsx     # Progress visualization
│   ├── types.ts                    # TypeScript definitions
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Backend Tools

The backend defines 5 tools that the agent can call:

### 1. show_chart

```typescript
{
  name: 'show_chart',
  description: 'Display a chart with data visualization',
  parameters: {
    title: string,
    type: 'bar' | 'line' | 'area' | 'pie',
    data: Array<{ name: string, value: number }>
  }
}
```

### 2. show_weather_card

```typescript
{
  name: 'show_weather_card',
  description: 'Display weather forecast',
  parameters: {
    city: string,
    temperature: number,
    condition: string,
    humidity: number,
    windSpeed: number,
    forecast: Array<{ day: string, temp: number, condition: string }>
  }
}
```

### 3. show_task_list

```typescript
{
  name: 'show_task_list',
  description: 'Display interactive task list',
  parameters: {
    title: string,
    tasks: Array<{
      id: string,
      text: string,
      completed: boolean,
      priority: 'high' | 'medium' | 'low'
    }>
  }
}
```

### 4. show_card_grid

```typescript
{
  name: 'show_card_grid',
  description: 'Display a grid of cards',
  parameters: {
    title: string,
    cards: Array<{
      id: string,
      title: string,
      description: string,
      image?: string,
      tags?: string[]
    }>
  }
}
```

### 5. show_progress_tracker

```typescript
{
  name: 'show_progress_tracker',
  description: 'Display multi-step progress',
  parameters: {
    title: string,
    currentStep: number,
    steps: Array<{
      label: string,
      status: 'pending' | 'in-progress' | 'completed'
    }>
  }
}
```

## Event Flow

### AG-UI Protocol Events

**1. RUN_STARTED**

```typescript
{
  type: 'run.started',
  threadId: string,
  runId: string
}
```

**2. TEXT_MESSAGE_START**

```typescript
{
  type: 'text_message.start',
  messageId: string,
  role: 'assistant'
}
```

**3. TEXT_MESSAGE_CONTENT**

```typescript
{
  type: 'text_message.content',
  messageId: string,
  delta: string
}
```

**4. TOOL_CALL_START**

```typescript
{
  type: 'tool_call.start',
  toolCallId: string,
  toolCallName: string,
  parentMessageId: string
}
```

**5. TOOL_CALL_ARGS**

```typescript
{
  type: 'tool_call.args',
  toolCallId: string,
  delta: string  // JSON chunk
}
```

**6. TOOL_CALL_END**

```typescript
{
  type: 'tool_call.end',
  toolCallId: string
}
```

**7. RUN_FINISHED**

```typescript
{
  type: 'run.finished',
  threadId: string,
  runId: string
}
```

## Frontend Implementation

### ChatInterface Component

Handles SSE stream parsing and state management:

```typescript
const sendMessage = async () => {
  const response = await fetch('/api/agui', {
    method: 'POST',
    body: JSON.stringify({ messages, threadId, runId }),
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  // Parse SSE events
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const eventData = JSON.parse(line.slice(6))

      switch (eventData.type) {
        case 'tool_call.start':
        // Initialize tool call state
        case 'tool_call.args':
        // Accumulate arguments
        case 'tool_call.end':
        // Render component
      }
    }
  }
}
```

### DynamicUIComponent Router

Maps tool names to components:

```typescript
const DynamicUIComponent = ({ toolName, toolArgs }) => {
  switch (toolName) {
    case 'show_chart':
      return <ChartComponent {...toolArgs} />
    case 'show_weather_card':
      return <WeatherCard {...toolArgs} />
    case 'show_task_list':
      return <TaskList {...toolArgs} />
    case 'show_card_grid':
      return <CardGrid {...toolArgs} />
    case 'show_progress_tracker':
      return <ProgressTracker {...toolArgs} />
    default:
      return <div>Unknown tool: {toolName}</div>
  }
}
```

## Setup & Running

### Installation

```bash
cd agui
npm install
```

### Development

```bash
npm run dev
# Runs on http://localhost:5173
```

### Build

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

## Example Prompts

Try these to see AGUI in action:

- "Show me a bar chart of quarterly sales"
- "What's the weather in San Francisco?"
- "Create a task list for my project"
- "Display a grid of product cards"
- "Show progress for a 5-step deployment process"

## Advantages

✅ **Type Safety** - Full TypeScript support, compile-time errors
✅ **Performance** - Pre-built, optimized components
✅ **Predictable** - Know exactly what will render
✅ **Easy Debugging** - Clear component hierarchy
✅ **Rich Components** - Can use complex libraries (Recharts)

## Limitations

❌ **Limited Flexibility** - Only 5 component types
❌ **Requires Coding** - Each new component needs implementation
❌ **Fixed Layouts** - Can't combine components in new ways
❌ **Less Creative** - Agent limited to pre-defined tools

## When to Use AGUI

Choose AGUI when:

- Building dashboards with known component types
- Type safety is critical
- Performance is a priority
- Team prefers explicit definitions
- UI requirements are well-defined

## Adding New Components

1. **Create Component**

   ```bash
   # In agui/src/components/ui/
   touch NewComponent.tsx
   ```

2. **Define Tool in Backend**

   ```typescript
   // backend/src/server.ts
   {
     type: 'function',
     function: {
       name: 'show_new_component',
       description: '...',
       parameters: { ... }
     }
   }
   ```

3. **Add to Router**
   ```typescript
   // agui/src/components/DynamicUIComponent.tsx
   case 'show_new_component':
     return <NewComponent {...toolArgs} />
   ```

## Tech Stack

- **React 18** - UI library
- **TypeScript 5.9** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Recharts** - Data visualization
- **SSE** - Server-Sent Events for streaming

## API Endpoint

```
POST /api/agui
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Show me a chart" }
  ],
  "threadId": "uuid",
  "runId": "uuid"
}

Response: text/event-stream (SSE)
```

---

**AGUI provides a robust, type-safe approach to dynamic UI generation perfect for applications with well-defined component requirements.**
