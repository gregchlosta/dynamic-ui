# A2UI (Declarative UI) - Implementation Guide

## Overview

**A2UI** (Agent-to-UI) is a declarative approach where AI agents emit UI specifications as JSON trees. The frontend interprets these specifications and dynamically renders components, enabling unlimited flexibility and creative layouts.

## Architecture

```
User Request → Agent Designs UI → Backend Emits Specification → Frontend Interprets & Renders
```

### How It Works

1. User sends a message (e.g., "Create a sales dashboard")
2. AI agent designs a complete UI layout as a component tree
3. Backend emits `ui.spec` event with UISpecification JSON
4. Frontend A2UIRenderer recursively interprets the spec
5. Dynamic component tree is rendered

## Project Structure

```
a2ui/
├── src/
│   ├── components/
│   │   ├── ChatInterface.tsx   # Main chat UI with SSE handling
│   │   └── A2UIRenderer.tsx    # Recursive UI specification interpreter
│   ├── types.ts                # TypeScript definitions
│   ├── App.tsx
│   └── main.tsx
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## UI Specification Format

### Basic Structure

```typescript
interface UISpecification {
  version: '1.0'
  component: string // Component type
  props?: Record<string, any> // Component properties
  children?: UISpecification[] // Nested components
  layout?: 'vertical' | 'horizontal' | 'grid'
  style?: Record<string, any> // Optional CSS
}
```

### Example Specification

```json
{
  "version": "1.0",
  "component": "container",
  "layout": "vertical",
  "children": [
    {
      "component": "heading",
      "props": { "text": "Sales Dashboard", "level": 1 }
    },
    {
      "component": "grid",
      "props": { "columns": 3 },
      "children": [
        {
          "component": "card",
          "children": [
            {
              "component": "metric",
              "props": { "value": "$124K", "label": "Revenue" }
            }
          ]
        },
        {
          "component": "card",
          "children": [
            {
              "component": "metric",
              "props": { "value": "342", "label": "Orders" }
            }
          ]
        }
      ]
    }
  ]
}
```

## Supported Components

### Layout Components

**container**

```typescript
props: {
  layout?: 'vertical' | 'horizontal' | 'grid'
}
children: UISpecification[]
```

**card**

```typescript
children: UISpecification[]
// Styled card container with shadow and border
```

**grid**

```typescript
props: {
  columns?: number (1-6)
}
children: UISpecification[]
```

### Content Components

**heading**

```typescript
props: {
  text: string
  level?: number (1-6)
}
```

**text**

```typescript
props: {
  content: string
}
```

**list**

```typescript
props: {
  items: string[]
}
```

**image**

```typescript
props: {
  src: string
  alt?: string
}
```

**code**

```typescript
props: {
  content: string
}
```

**table**

```typescript
props: {
  headers?: string[]
  rows: string[][]
}
```

### Interactive Components

**button**

```typescript
props: {
  label: string
}
```

**link**

```typescript
props: {
  text: string
  url: string
  newTab?: boolean
}
```

**progress**

```typescript
props: {
  value: number (0-100)
  label?: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
}
```

**metric**

```typescript
props: {
  value: string
  label: string
}
```

### UI Elements

**badge**

```typescript
props: {
  text: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray' | 'orange'
}
```

**alert**

```typescript
props: {
  type?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  message: string
}
```

**divider**

```typescript
// Horizontal line separator
```

**spacer**

```typescript
props: {
  height?: number (pixels)
}
```

## Backend Tool

The agent uses a single tool to generate any UI:

```typescript
{
  type: 'function',
  function: {
    name: 'render_custom_ui',
    description: 'Generate custom UI specification for any visualization',
    parameters: {
      type: 'object',
      properties: {
        specification: {
          type: 'object',
          properties: {
            component: { type: 'string' },
            props: { type: 'object' },
            children: { type: 'array' },
            layout: {
              type: 'string',
              enum: ['vertical', 'horizontal', 'grid']
            }
          }
        }
      }
    }
  }
}
```

## Event Flow

### A2UI Protocol Events

**1. RUN_STARTED**

```typescript
{
  type: 'run.started',
  threadId: string,
  runId: string
}
```

**2. TEXT*MESSAGE*\***

```typescript
// Same as AGUI for text messages
```

**3. ui.spec (A2UI-specific)**

```typescript
{
  type: 'ui.spec',
  specId: string,
  specification: UISpecification,
  parentMessageId?: string
}
```

**4. RUN_FINISHED**

```typescript
{
  type: 'run.finished',
  threadId: string,
  runId: string
}
```

## Frontend Implementation

### A2UIRenderer Component

Recursively interprets UI specifications:

```typescript
const UIComponent: React.FC<{ spec: UISpecification }> = ({ spec }) => {
  const { component, props = {}, children = [], layout, style } = spec

  switch (component) {
    case 'container':
      return (
        <div className={getLayoutClasses(layout)} style={style}>
          {children.map((child, idx) => (
            <UIComponent key={idx} spec={child} />
          ))}
        </div>
      )

    case 'card':
      return (
        <div className='bg-white rounded-2xl shadow-lg p-6'>
          {children.map((child, idx) => (
            <UIComponent key={idx} spec={child} />
          ))}
        </div>
      )

    case 'heading':
      const HeadingTag = `h${props.level || 2}`
      return <HeadingTag>{props.text}</HeadingTag>

    // ... 16+ component types

    default:
      return <div>Unknown component: {component}</div>
  }
}
```

### ChatInterface Component

Handles UI spec events:

```typescript
case 'ui.spec':
  const uiSpecEvent = eventData as UISpecEvent
  setMessages((prev) => [
    ...prev,
    {
      id: uiSpecEvent.specId,
      role: 'assistant',
      uiSpec: uiSpecEvent.specification,
      timestamp: new Date().toISOString()
    }
  ])
  break
```

## Setup & Running

### Installation

```bash
cd a2ui
npm install
```

### Development

```bash
npm run dev
# Runs on http://localhost:5174
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

Try these to see A2UI in action:

- "Create a sales dashboard with revenue metrics and graphs"
- "Design a product card for wireless headphones with pricing"
- "Build a pricing comparison table for 3 subscription tiers"
- "Create a project status overview with progress bars"
- "Design a feature list with badges and descriptions"

## Complex Example

User: "Create a product dashboard"

Agent generates:

```json
{
  "component": "container",
  "layout": "vertical",
  "children": [
    {
      "component": "heading",
      "props": { "text": "Product Dashboard", "level": 1 }
    },
    {
      "component": "grid",
      "props": { "columns": 4 },
      "children": [
        {
          "component": "card",
          "children": [
            {
              "component": "metric",
              "props": { "value": "1,234", "label": "Total Sales" }
            },
            {
              "component": "badge",
              "props": { "text": "+12%", "color": "green" }
            }
          ]
        },
        {
          "component": "card",
          "children": [
            {
              "component": "metric",
              "props": { "value": "$45.2K", "label": "Revenue" }
            },
            {
              "component": "badge",
              "props": { "text": "+8%", "color": "green" }
            }
          ]
        },
        {
          "component": "card",
          "children": [
            {
              "component": "metric",
              "props": { "value": "89%", "label": "Satisfaction" }
            },
            {
              "component": "badge",
              "props": { "text": "Excellent", "color": "blue" }
            }
          ]
        },
        {
          "component": "card",
          "children": [
            {
              "component": "metric",
              "props": { "value": "456", "label": "Active Users" }
            },
            {
              "component": "badge",
              "props": { "text": "Live", "color": "green" }
            }
          ]
        }
      ]
    },
    {
      "component": "divider"
    },
    {
      "component": "card",
      "children": [
        {
          "component": "heading",
          "props": { "text": "Recent Activity", "level": 3 }
        },
        {
          "component": "list",
          "props": {
            "items": [
              "✅ Order #1234 completed",
              "🔄 Processing payment for Order #1235",
              "📦 Shipped Order #1233",
              "⭐ New 5-star review received"
            ]
          }
        }
      ]
    }
  ]
}
```

## Advantages

✅ **Unlimited Flexibility** - Create any UI layout
✅ **No Code Changes** - New patterns without frontend updates
✅ **Composable** - Build complex UIs from primitives
✅ **Agent Creativity** - AI designs the UI structure
✅ **Smaller Bundle** - No heavy dependencies

## Limitations

⚠️ **Runtime Validation** - Type errors at runtime, not compile-time
⚠️ **Performance** - Dynamic rendering slower than pre-built
⚠️ **Debugging Complexity** - Harder to trace issues
⚠️ **Security** - Must sanitize all inputs carefully
⚠️ **No Rich Libraries** - Can't use Recharts-level components by default

## Security Considerations

### Input Sanitization

```typescript
// ❌ DANGEROUS - Never do this
onClick={() => eval(props.action)}

// ✅ SAFE - Use whitelisted actions
const allowedActions = {
  'submit': handleSubmit,
  'cancel': handleCancel
}
onClick={() => allowedActions[props.action]?.()}
```

### Validation

```typescript
// Validate component types
const allowedComponents = [
  'container', 'card', 'heading', 'text',
  'button', 'image', 'list', 'grid', ...
]

if (!allowedComponents.includes(spec.component)) {
  console.warn('Unknown component:', spec.component)
  return <div>Invalid component</div>
}
```

### Depth Limiting

```typescript
// Prevent infinite recursion
const MAX_DEPTH = 10

function renderSpec(spec, depth = 0) {
  if (depth > MAX_DEPTH) {
    return <div>Max depth exceeded</div>
  }
  // ... render logic
}
```

## When to Use A2UI

Choose A2UI when:

- Building flexible platforms or no-code tools
- UI requirements are unknown upfront
- Want agent to design creatively
- Need rapid prototyping
- Building extensible systems

## Adding New Component Types

1. **Add to A2UIRenderer.tsx**

```typescript
case 'new_component':
  return (
    <div className='custom-style'>
      {props.content}
    </div>
  )
```

2. **Update System Prompt** (backend)

```typescript
;`Available components: container, card, new_component, ...`
```

That's it! No other changes needed.

## Tech Stack

- **React 18** - UI library
- **TypeScript 5.9** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **SSE** - Server-Sent Events for streaming

## API Endpoint

```
POST /api/a2ui
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Create a dashboard" }
  ],
  "threadId": "uuid",
  "runId": "uuid"
}

Response: text/event-stream (SSE)
```

## Performance Tips

1. **Memoize components** for repeated specs
2. **Lazy load** heavy components
3. **Limit nesting depth** in specifications
4. **Cache** common component patterns
5. **Use virtual scrolling** for large lists

---

**A2UI provides unmatched flexibility for dynamic UI generation, perfect for applications where the agent needs creative freedom to design custom interfaces.**
