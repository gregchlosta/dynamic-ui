# AGUI Complete Walkthrough: Backend + Frontend

## Architecture Overview

**AGUI** = Agent-Generated UI (Tool-based approach where AI calls specific pre-defined tools for each UI component)

**Flow**: User types message → Frontend sends to backend → Backend calls OpenAI with 5 predefined tools → OpenAI calls specific tools → Backend streams tool calls → Frontend routes to specific components → React renders pre-built components

---

## 📊 Step-by-Step Flow

### **STEP 1: User Interaction (Frontend)**

**File**: `agui/src/components/ChatInterface.tsx`

```
User types: "Show me a weather card for San Francisco"
↓
Clicks "Send" button
↓
sendMessage() function executes
```

**What happens:**

1. Creates user message object with `crypto.randomUUID()` for ID
2. Adds message to local state via `setMessages()`
3. Clears input field
4. Sets `isLoading = true`

---

### **STEP 2: HTTP Request to Backend**

**File**: `agui/src/components/ChatInterface.tsx`

```typescript
fetch(`${API_URL}/api/agui`, {
  method: 'POST',
  body: JSON.stringify({
    messages: [...messages, userMessage].map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    threadId: crypto.randomUUID(),
    runId: crypto.randomUUID(),
  }),
})
```

**Key points:**

- Sends **entire conversation history**
- Generates new `threadId` and `runId` for tracking
- Content-Type: `application/json`
- Uses `/api/agui` endpoint (different from A2UI)

---

### **STEP 3: Backend Receives Request**

**File**: `backend/src/server.ts` (line 197)

```typescript
app.post('/api/agui', async (req, res) => {
  const { messages, threadId, runId } = req.body

  // Set up Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
```

**What happens:**

1. Extracts `messages`, `threadId`, `runId` from request body
2. **Sets up SSE** - Streaming protocol for real-time updates
3. Keeps connection open for streaming events

---

### **STEP 4: Backend Sends RUN_STARTED Event**

**File**: `backend/src/server.ts`

```typescript
res.write(
  encodeSSE({
    type: EventType.RUN_STARTED,
    threadId: currentThreadId,
    runId: currentRunId,
  })
)
```

**Format (over the wire):**

```
data: {"type":"run.started","threadId":"abc123","runId":"xyz789"}

```

---

### **STEP 5: Backend Defines 5 Pre-Built Tools**

**File**: `backend/src/server.ts` (lines 211-342)

```typescript
const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'render_chart',
      description: 'Display a chart visualization with multiple data series',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          type: {
            type: 'string',
            enum: ['line', 'bar', 'area'],
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
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'render_weather_card',
      description: 'Display a weather information card',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' },
          temperature: { type: 'number' },
          condition: { type: 'string' },
          humidity: { type: 'number' },
          windSpeed: { type: 'number' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'render_task_list',
      description: 'Display a list of tasks with completion status',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
                completed: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'render_card_grid',
      description: 'Display a grid of cards with icons and metrics',
      parameters: {
        type: 'object',
        properties: {
          cards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                value: { type: 'string' },
                icon: { type: 'string' },
                trend: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'render_progress_tracker',
      description: 'Display progress tracking with multiple items',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                progress: { type: 'number' },
                status: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
]
```

**Key characteristics:**

- **Fixed set of tools** - Only 5 pre-defined components
- **Strict schemas** - Each tool has specific parameters
- **Type validation** - OpenAI validates parameters match schema
- **Less flexible** than A2UI but more controlled

---

### **STEP 6: Backend Calls OpenAI API**

**File**: `backend/src/server.ts`

```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    {
      role: 'system',
      content: `You are a helpful AI assistant that can create visualizations...
      
      Available tools:
      - render_chart: For data visualizations (line, bar, area charts)
      - render_weather_card: For weather information
      - render_task_list: For todo lists and task tracking
      - render_card_grid: For dashboard-style metric cards
      - render_progress_tracker: For progress bars and status tracking`,
    },
    ...openAIMessages,
  ],
  tools: tools,
  tool_choice: 'auto',
  stream: true, // STREAMING enabled!
})
```

**What OpenAI receives:**

- System prompt describing 5 available tools
- Full conversation history
- Tool definitions with JSON schemas
- Stream mode enabled for real-time responses

**What OpenAI streams back:**

- Text deltas (character by character)
- Tool call deltas (arguments streaming in)
- Finish reasons

---

### **STEP 7: Backend Processes Streaming Response**

**File**: `backend/src/server.ts` (lines 235-330)

```typescript
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta

  // Handle text content streaming
  if (delta?.content) {
    if (!currentMessageId) {
      currentMessageId = uuidv4()
      res.write(
        encodeSSE({
          type: EventType.TEXT_MESSAGE_START,
          messageId: currentMessageId,
          role: 'assistant',
        })
      )
    }

    res.write(
      encodeSSE({
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: currentMessageId,
        delta: delta.content,
      })
    )
  }

  // Handle tool call streaming
  if (delta?.tool_calls) {
    for (const toolCall of delta.tool_calls) {
      const index = toolCall.index

      if (!toolCalls[index]) {
        // New tool call starting
        toolCalls[index] = {
          id: toolCall.id || '',
          name: toolCall.function?.name || '',
          arguments: '',
        }

        res.write(
          encodeSSE({
            type: EventType.TOOL_CALL_START,
            toolCallId: toolCalls[index].id,
            toolCallName: toolCalls[index].name,
            parentMessageId: currentMessageId!,
          })
        )
      }

      // Accumulate tool arguments
      if (toolCall.function?.arguments) {
        toolCalls[index].arguments += toolCall.function.arguments

        res.write(
          encodeSSE({
            type: EventType.TOOL_CALL_ARGS,
            toolCallId: toolCalls[index].id,
            delta: toolCall.function.arguments,
          })
        )
      }
    }
  }
}
```

**Streaming behavior:**

1. **Chunks arrive** in real-time from OpenAI
2. **Text deltas** sent immediately to frontend
3. **Tool call deltas** accumulate arguments piece by piece
4. **Events emitted** for start/content/args
5. **No waiting** for complete response

---

### **STEP 8: Backend Emits Complete Tool Calls**

**File**: `backend/src/server.ts`

```typescript
// After streaming completes, emit TOOL_CALL_END for each tool
for (const toolCall of Object.values(toolCalls)) {
  if (toolCall.id && toolCall.name) {
    res.write(
      encodeSSE({
        type: EventType.TOOL_CALL_END,
        toolCallId: toolCall.id,
      })
    )
  }
}
```

**Example complete tool call event sequence:**

```
data: {"type":"tool_call.start","toolCallId":"call_abc123","toolCallName":"render_weather_card","parentMessageId":"msg_456"}

data: {"type":"tool_call.args","toolCallId":"call_abc123","delta":"{\"location\""}

data: {"type":"tool_call.args","toolCallId":"call_abc123","delta":":\"San Francisco\""}

data: {"type":"tool_call.args","toolCallId":"call_abc123","delta":",\"temperature\":72"}

data: {"type":"tool_call.args","toolCallId":"call_abc123","delta":",\"condition\":\"Sunny\"}"}

data: {"type":"tool_call.end","toolCallId":"call_abc123"}
```

---

### **STEP 9: Backend Sends RUN_FINISHED**

**File**: `backend/src/server.ts`

```typescript
res.write(
  encodeSSE({
    type: EventType.RUN_FINISHED,
    threadId: currentThreadId,
    runId: currentRunId,
  })
)

res.end()
```

---

### **STEP 10: Frontend Processes SSE Stream**

**File**: `agui/src/components/ChatInterface.tsx`

```typescript
const reader = response.body?.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value)
  const lines = chunk.split('\n')

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const eventData = JSON.parse(line.slice(6))

      switch (eventData.type) {
        case 'text_message.start':
          currentMessageId = eventData.messageId
          currentMessageContent = ''
          break

        case 'text_message.content':
          currentMessageContent += eventData.delta
          // Update or create message in state
          break

        case 'tool_call.start':
          toolCalls[eventData.toolCallId] = {
            id: eventData.toolCallId,
            name: eventData.toolCallName,
            arguments: '',
          }
          break

        case 'tool_call.args':
          toolCalls[eventData.toolCallId].arguments += eventData.delta
          break

        case 'tool_call.end':
          // Parse complete arguments
          const args = JSON.parse(toolCalls[eventData.toolCallId].arguments)

          // Add tool call message
          setMessages((prev) => [
            ...prev,
            {
              id: eventData.toolCallId,
              role: 'assistant',
              toolCall: {
                name: toolCalls[eventData.toolCallId].name,
                args: args,
              },
              timestamp: new Date().toISOString(),
            },
          ])
          break

        case 'run.finished':
          setIsLoading(false)
          break
      }
    }
  }
}
```

**What happens:**

1. **Accumulates tool arguments** from multiple deltas
2. **Parses JSON** when tool_call.end received
3. **Creates message** with toolCall information
4. **Updates React state** to trigger re-render

---

### **STEP 11: Frontend Renders Messages**

**File**: `agui/src/components/ChatInterface.tsx`

```typescript
{
  messages.map((message) => {
    if (message.role === 'user') {
      return (
        <div className='bg-blue-600 text-white px-6 py-3 rounded-2xl'>
          <p>{message.content}</p>
        </div>
      )
    } else if (message.toolCall) {
      return (
        <div className='max-w-4xl w-full'>
          <DynamicUIComponent
            name={message.toolCall.name}
            args={message.toolCall.args}
          />
        </div>
      )
    } else {
      return (
        <div className='bg-white px-6 py-3 rounded-2xl'>
          <p>{message.content}</p>
        </div>
      )
    }
  })
}
```

**Rendering logic:**

- **User messages** → Blue bubble on right
- **Assistant text** → White bubble on left
- **Tool calls** → Pass to `DynamicUIComponent` router

---

### **STEP 12: DynamicUIComponent Routes to Specific Components**

**File**: `agui/src/components/DynamicUIComponent.tsx`

```typescript
const DynamicUIComponent: React.FC<DynamicUIComponentProps> = ({
  name,
  args,
}) => {
  switch (name) {
    case 'render_chart':
      return <ChartComponent {...args} />

    case 'render_weather_card':
      return <WeatherCard {...args} />

    case 'render_task_list':
      return <TaskList {...args} />

    case 'render_card_grid':
      return <CardGrid {...args} />

    case 'render_progress_tracker':
      return <ProgressTracker {...args} />

    default:
      return (
        <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
          <p className='text-red-800'>Unknown tool: {name}</p>
        </div>
      )
  }
}
```

**How it works:**

1. **Simple switch statement** - No recursion needed
2. **Direct component mapping** - Each tool → one component
3. **Type-safe props** - Args spread directly to component
4. **Error handling** - Unknown tools show error UI

---

### **STEP 13: Pre-Built Components Render**

#### ChartComponent

**File**: `agui/src/components/ui/ChartComponent.tsx`

```typescript
import { LineChart, BarChart, AreaChart, ... } from 'recharts'

export const ChartComponent: React.FC<ChartProps> = ({ title, type, data }) => {
  const ChartType = {
    line: LineChart,
    bar: BarChart,
    area: AreaChart,
  }[type]

  return (
    <div className='bg-white rounded-2xl shadow-lg p-6'>
      <h3 className='text-2xl font-bold mb-4'>{title}</h3>
      <ResponsiveContainer width='100%' height={300}>
        <ChartType data={data}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis dataKey='name' />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type='monotone' dataKey='value' stroke='#8884d8' />
        </ChartType>
      </ResponsiveContainer>
    </div>
  )
}
```

**Features:**

- **Recharts integration** - Professional chart library
- **Three chart types** - Line, bar, area
- **Responsive** - Adapts to container size
- **Styled** - Pre-designed with Tailwind

#### WeatherCard

**File**: `agui/src/components/ui/WeatherCard.tsx`

```typescript
export const WeatherCard: React.FC<WeatherCardProps> = ({
  location,
  temperature,
  condition,
  humidity,
  windSpeed,
}) => {
  return (
    <div className='bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg p-6 text-white'>
      <h2 className='text-3xl font-bold mb-2'>{location}</h2>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-6xl font-bold'>{temperature}°</p>
          <p className='text-xl'>{condition}</p>
        </div>
        <div className='text-right'>
          <p>💧 {humidity}%</p>
          <p>💨 {windSpeed} mph</p>
        </div>
      </div>
    </div>
  )
}
```

**Features:**

- **Gradient background** - Beautiful blue gradient
- **Large temperature** - Prominent display
- **Weather icons** - Emojis for visual appeal
- **Metrics** - Humidity and wind speed

#### TaskList

**File**: `agui/src/components/ui/TaskList.tsx`

```typescript
export const TaskList: React.FC<TaskListProps> = ({ title, tasks }) => {
  return (
    <div className='bg-white rounded-2xl shadow-lg p-6'>
      <h3 className='text-2xl font-bold mb-4'>{title}</h3>
      <div className='space-y-3'>
        {tasks.map((task) => (
          <div
            key={task.id}
            className='flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50'
          >
            <input
              type='checkbox'
              checked={task.completed}
              readOnly
              className='w-5 h-5'
            />
            <span
              className={task.completed ? 'line-through text-gray-400' : ''}
            >
              {task.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Features:**

- **Checkboxes** - Visual completion status
- **Strike-through** - Completed tasks styled differently
- **Hover effects** - Interactive feel
- **Clean layout** - Organized list

#### CardGrid

**File**: `agui/src/components/ui/CardGrid.tsx`

```typescript
export const CardGrid: React.FC<CardGridProps> = ({ cards }) => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {cards.map((card) => (
        <div key={card.id} className='bg-white rounded-2xl shadow-lg p-6'>
          <div className='text-4xl mb-3'>{card.icon}</div>
          <h4 className='text-gray-600 text-sm font-medium'>{card.title}</h4>
          <p className='text-3xl font-bold text-gray-900 mt-2'>{card.value}</p>
          <p
            className={`text-sm mt-2 ${
              card.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {card.trend}
          </p>
        </div>
      ))}
    </div>
  )
}
```

**Features:**

- **Responsive grid** - 1/2/4 columns based on screen size
- **Metric cards** - Dashboard-style KPIs
- **Trend indicators** - Color-coded positive/negative
- **Icon support** - Emoji icons for visual identity

#### ProgressTracker

**File**: `agui/src/components/ui/ProgressTracker.tsx`

```typescript
export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  title,
  items,
}) => {
  return (
    <div className='bg-white rounded-2xl shadow-lg p-6'>
      <h3 className='text-2xl font-bold mb-4'>{title}</h3>
      <div className='space-y-4'>
        {items.map((item, idx) => (
          <div key={idx}>
            <div className='flex justify-between mb-2'>
              <span className='font-medium'>{item.name}</span>
              <span className='text-sm text-gray-600'>{item.progress}%</span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-3'>
              <div
                className='bg-blue-600 h-3 rounded-full'
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <span className='text-sm text-gray-500 mt-1'>{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Features:**

- **Progress bars** - Visual percentage completion
- **Status labels** - Text status for each item
- **Percentage display** - Numeric progress shown
- **Smooth bars** - Rounded, polished design

---

## 🎯 Complete Example: "Show me a weather card for San Francisco"

**1. User types** → "Show me a weather card for San Francisco"

**2. Frontend sends:**

```json
POST /api/agui
{
  "messages": [
    { "role": "user", "content": "Show me a weather card for San Francisco" }
  ],
  "threadId": "thread-123",
  "runId": "run-456"
}
```

**3. Backend calls OpenAI** with system prompt + 5 tools

**4. OpenAI generates:**

```json
{
  "content": "I'll show you the weather for San Francisco.",
  "tool_calls": [
    {
      "id": "call_abc123",
      "function": {
        "name": "render_weather_card",
        "arguments": "{\"location\":\"San Francisco\",\"temperature\":72,\"condition\":\"Sunny\",\"humidity\":65,\"windSpeed\":12}"
      }
    }
  ]
}
```

**5. Backend streams:**

```
data: {"type":"run.started","runId":"run-456"}
data: {"type":"text_message.start","messageId":"msg-789"}
data: {"type":"text_message.content","messageId":"msg-789","delta":"I'll show..."}
data: {"type":"text_message.end","messageId":"msg-789"}
data: {"type":"tool_call.start","toolCallId":"call_abc123","toolCallName":"render_weather_card"}
data: {"type":"tool_call.args","toolCallId":"call_abc123","delta":"{\"location\""}
data: {"type":"tool_call.args","toolCallId":"call_abc123","delta":":\"San Francisco\"}"}
data: {"type":"tool_call.end","toolCallId":"call_abc123"}
data: {"type":"run.finished","runId":"run-456"}
```

**6. Frontend accumulates** tool arguments from deltas

**7. DynamicUIComponent routes** to WeatherCard

**8. WeatherCard renders** with beautiful gradient and weather data

---

## 🔑 Key Technologies

### Backend

- **Express.js** - HTTP server
- **OpenAI API** - GPT-4o-mini with function calling (streaming)
- **Server-Sent Events (SSE)** - Streaming protocol
- **TypeScript** - Type safety
- **5 Pre-defined Tools** - Fixed component set

### Frontend

- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Utility-first styling
- **Recharts** - Professional charting library
- **Fetch API + ReadableStream** - SSE consumption
- **TypeScript** - Type safety

---

## 📋 Type Definitions

### Backend Types (`backend/src/types.ts`)

```typescript
export enum EventType {
  RUN_STARTED = 'run.started',
  RUN_FINISHED = 'run.finished',
  RUN_ERROR = 'run.error',
  TEXT_MESSAGE_START = 'text_message.start',
  TEXT_MESSAGE_CONTENT = 'text_message.content',
  TEXT_MESSAGE_END = 'text_message.end',
  TOOL_CALL_START = 'tool_call.start',
  TOOL_CALL_ARGS = 'tool_call.args',
  TOOL_CALL_END = 'tool_call.end',
}

export interface ToolCallStartEvent {
  type: EventType.TOOL_CALL_START
  toolCallId: string
  toolCallName: string
  parentMessageId: string
}

export interface ToolCallArgsEvent {
  type: EventType.TOOL_CALL_ARGS
  toolCallId: string
  delta: string
}

export interface ToolCallEndEvent {
  type: EventType.TOOL_CALL_END
  toolCallId: string
}
```

### Frontend Types (`agui/src/types.ts`)

```typescript
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content?: string
  toolCall?: {
    name: string
    args: any
  }
  timestamp: string
}

export interface ChartProps {
  title: string
  type: 'line' | 'bar' | 'area'
  data: Array<{ name: string; value: number }>
}

export interface WeatherCardProps {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
}
```

---

## 🎨 Available Tools (Components)

### 1. render_chart

**Purpose**: Display line, bar, or area charts
**Parameters:**

- `title` (string) - Chart title
- `type` (enum) - 'line', 'bar', or 'area'
- `data` (array) - Array of {name, value} objects

**Use cases:**

- Sales data over time
- Performance metrics
- Comparison charts

### 2. render_weather_card

**Purpose**: Display weather information
**Parameters:**

- `location` (string) - City/location name
- `temperature` (number) - Temperature in degrees
- `condition` (string) - Weather condition (Sunny, Cloudy, etc.)
- `humidity` (number) - Humidity percentage
- `windSpeed` (number) - Wind speed in mph

**Use cases:**

- Weather forecasts
- Current conditions
- Location-based weather

### 3. render_task_list

**Purpose**: Display todo lists and tasks
**Parameters:**

- `title` (string) - List title
- `tasks` (array) - Array of {id, text, completed} objects

**Use cases:**

- Todo lists
- Project tasks
- Checklist items

### 4. render_card_grid

**Purpose**: Display dashboard-style metric cards
**Parameters:**

- `cards` (array) - Array of {id, title, value, icon, trend} objects

**Use cases:**

- KPI dashboards
- Metric overviews
- Statistics displays

### 5. render_progress_tracker

**Purpose**: Display progress bars for multiple items
**Parameters:**

- `title` (string) - Tracker title
- `items` (array) - Array of {name, progress, status} objects

**Use cases:**

- Project progress
- Goal tracking
- Multi-step processes

---

## 🚀 AGUI vs A2UI Comparison

| Aspect            | AGUI (Tool-Based)        | A2UI (Declarative)       |
| ----------------- | ------------------------ | ------------------------ |
| **Flexibility**   | Limited to 5 components  | Unlimited combinations   |
| **Type Safety**   | ✅ Compile-time          | ⚠️ Runtime validation    |
| **Performance**   | ✅ Pre-built, optimized  | ⚠️ Dynamic rendering     |
| **Libraries**     | ✅ Can use Recharts      | ❌ Limited to primitives |
| **Complexity**    | ✅ Simple routing        | ⚠️ Recursive rendering   |
| **Extensibility** | ❌ Requires code changes | ✅ No code changes       |
| **Debugging**     | ✅ Easy to trace         | ⚠️ Harder to debug       |
| **AI Creativity** | ❌ Limited to tools      | ✅ Full creative freedom |
| **Bundle Size**   | ⚠️ Larger (Recharts)     | ✅ Smaller               |

---

## 📊 Event Flow Diagram

```
User Input
    ↓
ChatInterface.sendMessage()
    ↓
HTTP POST /api/agui
    ↓
Backend receives request
    ↓
Setup SSE connection
    ↓
Send RUN_STARTED event
    ↓
Define 5 tools (chart, weather, tasks, cards, progress)
    ↓
Call OpenAI API with tools (streaming)
    ↓
OpenAI streams response chunks
    ↓
For each chunk:
  ├─ Text delta → Send TEXT_MESSAGE_CONTENT event
  └─ Tool call delta → Send TOOL_CALL_ARGS event
    ↓
Send TOOL_CALL_END event
    ↓
Send RUN_FINISHED event
    ↓
Close SSE connection
    ↓
Frontend accumulates tool arguments
    ↓
Parse complete JSON arguments
    ↓
Update React state with tool call
    ↓
Render messages
    ↓
DynamicUIComponent routes tool name
    ↓
Specific component renders (ChartComponent, WeatherCard, etc.)
    ↓
Display beautiful pre-built UI to user
```

---

## 🎓 Key Learnings

### Advantages of Tool-Based Approach

1. **Type Safety**: Each tool has strict JSON schema validation
2. **Rich Components**: Can use complex libraries like Recharts
3. **Performance**: Pre-built components are optimized
4. **Debugging**: Easy to trace which tool was called
5. **Control**: Designers control exact UI appearance
6. **Consistency**: All instances of a component look the same

### Tool Call Streaming

OpenAI streams tool arguments incrementally:

```typescript
// First chunk
{"delta":{"tool_calls":[{"function":{"arguments":"{\""}}]}}

// Second chunk
{"delta":{"tool_calls":[{"function":{"arguments":"location"}}]}}

// Third chunk
{"delta":{"tool_calls":[{"function":{"arguments":"\":\"San"}}]}}
```

Frontend must accumulate these deltas and parse when complete.

### Component Design

Each component is:

- **Self-contained** - No dependencies on other components
- **Type-safe** - Props interface defined
- **Styled** - Pre-designed with Tailwind
- **Reusable** - Can be called multiple times

---

## 🔧 How to Add New Tools

Adding a new tool requires changes in 3 places:

### 1. Define Tool (Backend)

```typescript
// In server.ts tools array
{
  type: 'function',
  function: {
    name: 'render_calendar',
    description: 'Display a calendar with events',
    parameters: {
      type: 'object',
      properties: {
        month: { type: 'string' },
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              title: { type: 'string' },
            },
          },
        },
      },
    },
  },
}
```

### 2. Create Component (Frontend)

```typescript
// agui/src/components/ui/Calendar.tsx
export const Calendar: React.FC<CalendarProps> = ({ month, events }) => {
  return (
    <div className='bg-white rounded-2xl shadow-lg p-6'>
      <h3 className='text-2xl font-bold mb-4'>{month}</h3>
      {/* Calendar implementation */}
    </div>
  )
}
```

### 3. Add Route (Frontend)

```typescript
// In DynamicUIComponent.tsx
case 'render_calendar':
  return <Calendar {...args} />
```

That's it! The AI will now use the new tool.

---

## 🐛 Error Handling

### Backend Errors

- OpenAI API failures trigger `run.error` event
- Invalid tool parameters caught by OpenAI schema validation
- Streaming errors close SSE connection gracefully

### Frontend Errors

- Unknown tool names show error UI
- Invalid JSON arguments caught and logged
- SSE parsing errors don't crash app
- Missing required props show TypeScript errors

### Validation

- **Backend**: OpenAI validates tool arguments against schema
- **Frontend**: TypeScript validates props at compile-time
- **Runtime**: React PropTypes or Zod schemas can be added

---

## 🔮 Future Enhancements

### Potential Improvements

1. **More Tools** - Add calendar, map, form, video player
2. **Interactive Tools** - Add onClick handlers and state
3. **Real-time Data** - Connect to live APIs
4. **Composition** - Allow tools to contain other tools
5. **Themes** - Dark mode, custom styling
6. **Export** - Download rendered components
7. **Customization** - User-configurable tool parameters
8. **Analytics** - Track which tools are most popular

---

## 💡 When to Use AGUI

Choose AGUI when:

- You need **rich, complex components** (charts, maps, videos)
- You want **type safety** at compile-time
- You prefer **predictable, controlled** UI
- You need **optimal performance** for specific use cases
- Your team has **design system** with pre-built components
- You want to use **third-party libraries** (Recharts, D3, etc.)

Choose A2UI when:

- You need **maximum flexibility**
- UI requirements are **unknown or changing**
- You want **agent creativity** in design
- Building **no-code/low-code** platforms
- Need **rapid prototyping** without code changes

---

**AGUI provides professional, type-safe, library-backed components perfect for dashboards and data-rich applications!** 📊✨
