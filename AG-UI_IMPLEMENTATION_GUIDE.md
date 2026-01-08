# AG-UI Implementation Guide: Streaming Custom UI Components in a Chatbot

## Table of Contents

1. [Overview](#overview)
2. [Core Architecture](#core-architecture)
3. [Key Concepts](#key-concepts)
4. [Implementation Steps](#implementation-steps)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Generative UI Components](#generative-ui-components)
8. [Complete Working Examples](#complete-working-examples)
9. [Best Practices](#best-practices)

---

## Overview

**AG-UI (Agent-User Interaction Protocol)** is an open, lightweight, event-based protocol that standardizes how AI agents stream components and data to frontend applications. The most powerful feature is the ability to generate custom UI components inside a chatbot based on user prompts.

### What Makes AG-UI Special

- **Event-Driven Architecture**: Real-time streaming of UI components and state
- **Framework Agnostic**: Works with any agent framework (LangGraph, CrewAI, LlamaIndex, etc.)
- **Bidirectional Communication**: Agents can read and write application state
- **Generative UI**: Agents can dynamically create and stream UI components
- **Tool-Based Rendering**: Custom components can be triggered via agent tool calls

---

## Core Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend      │         │   AG-UI          │         │   Backend       │
│   Application   │◄────────┤   Protocol       ├────────►│   Agent         │
│   (React/Next)  │         │   (Events)       │         │   (Python/TS)   │
└─────────────────┘         └──────────────────┘         └─────────────────┘
       │                             │                            │
       │                             │                            │
   ┌───▼────┐                  ┌────▼────┐                 ┌────▼─────┐
   │ UI     │                  │ SSE/    │                 │ LLM +    │
   │ Comp.  │                  │ WS      │                 │ Tools    │
   └────────┘                  └─────────┘                 └──────────┘
```

### Communication Flow

1. **User sends message** → Frontend sends `RunAgentInput` to backend
2. **Backend processes** → Agent runs with LLM and tools
3. **Events stream back** → Backend emits AG-UI events (SSE/WebSocket)
4. **Frontend renders** → React components update in real-time

---

## Key Concepts

### 1. Event Types

AG-UI defines ~16 standard event types:

#### **Lifecycle Events**

- `RUN_STARTED` - Agent execution begins
- `RUN_FINISHED` - Agent execution completes
- `RUN_ERROR` - Agent encountered an error
- `STEP_STARTED` / `STEP_FINISHED` - Individual step tracking

#### **Text Message Events**

- `TEXT_MESSAGE_START` - Message begins
- `TEXT_MESSAGE_CONTENT` - Streaming text chunks
- `TEXT_MESSAGE_END` - Message completes
- `TEXT_MESSAGE_CHUNK` - Convenience event (auto-expands to start→content→end)

#### **Tool Call Events**

- `TOOL_CALL_START` - Tool invocation begins
- `TOOL_CALL_ARGS` - Tool arguments streaming
- `TOOL_CALL_END` - Tool call completes
- `TOOL_CALL_RESULT` - Tool execution result

#### **State Management Events**

- `STATE_SNAPSHOT` - Complete state object
- `STATE_DELTA` - Incremental updates (JSON Patch format)

#### **Messages & Activity**

- `MESSAGES_SNAPSHOT` - All conversation messages
- `ACTIVITY_SNAPSHOT` / `ACTIVITY_DELTA` - Activity tracking

### 2. Generative UI Mechanisms

There are **three ways** to generate custom UI components:

#### **A. Tool-Based Generative UI** ⭐ (Most Common)

- Agent calls a frontend-defined tool
- Tool parameters contain UI data
- Frontend renders custom component with data
- **Example**: Haiku generator, weather cards, charts

#### **B. Agentic Generative UI (State-Based)**

- Agent updates shared state
- Frontend observes state changes
- Custom renderer displays UI based on state
- **Example**: Task progress tracker, recipe builder

#### **C. A2UI (Declarative Spec)**

- Agent emits structured UI specification
- Frontend interprets and renders
- Supports Google's A2UI, OpenAI's Open-JSON-UI, MCP-UI

---

## Implementation Steps

### Step 1: Set Up Your Project Structure

```bash
my-app/
├── frontend/                  # React/Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   └── page.tsx      # Main chat interface
│   │   ├── components/
│   │   │   └── CustomCard.tsx # Your custom UI components
│   │   └── lib/
│   │       └── agent.ts       # Agent configuration
│   └── package.json
│
└── backend/                   # Python/Node.js server
    ├── src/
    │   ├── agent.py          # Agent logic
    │   └── server.py         # HTTP endpoint
    └── requirements.txt
```

### Step 2: Install Dependencies

#### Frontend (Next.js/React)

```bash
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime
npm install @ag-ui/client rxjs
```

#### Backend (Python)

```bash
pip install ag-ui fastapi uvicorn openai
```

---

## Backend Implementation

### Basic Python Server Example

```python
# backend/src/server.py
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from ag_ui.core import (
    RunAgentInput,
    EventType,
    RunStartedEvent,
    RunFinishedEvent,
    TextMessageStartEvent,
    TextMessageContentEvent,
    TextMessageEndEvent,
    ToolCallStartEvent,
    ToolCallArgsEvent,
    ToolCallEndEvent,
)
from ag_ui.encoder import EventEncoder
import json
import uuid

app = FastAPI(title="AG-UI Custom UI Server")

@app.post("/agent")
async def agent_endpoint(input_data: RunAgentInput, request: Request):
    """Main agent endpoint that streams events"""
    accept_header = request.headers.get("accept")
    encoder = EventEncoder(accept=accept_header)

    async def event_generator():
        # 1. Start the run
        yield encoder.encode(
            RunStartedEvent(
                type=EventType.RUN_STARTED,
                thread_id=input_data.thread_id,
                run_id=input_data.run_id
            )
        )

        # 2. Get user message
        last_message = input_data.messages[-1] if input_data.messages else None
        user_prompt = last_message.content if last_message else ""

        # 3. Call LLM with tools
        response = await call_llm_with_tools(user_prompt, input_data.tools)

        # 4. Stream text response
        message_id = str(uuid.uuid4())
        yield encoder.encode(
            TextMessageStartEvent(
                type=EventType.TEXT_MESSAGE_START,
                message_id=message_id,
                role="assistant"
            )
        )

        # 5. If LLM wants to call a tool, stream the tool call
        if response.get("tool_calls"):
            for tool_call in response["tool_calls"]:
                tool_call_id = str(uuid.uuid4())

                # Start tool call
                yield encoder.encode(
                    ToolCallStartEvent(
                        type=EventType.TOOL_CALL_START,
                        tool_call_id=tool_call_id,
                        tool_call_name=tool_call["name"],
                        parent_message_id=message_id
                    )
                )

                # Stream tool arguments
                yield encoder.encode(
                    ToolCallArgsEvent(
                        type=EventType.TOOL_CALL_ARGS,
                        tool_call_id=tool_call_id,
                        delta=json.dumps(tool_call["arguments"])
                    )
                )

                # End tool call
                yield encoder.encode(
                    ToolCallEndEvent(
                        type=EventType.TOOL_CALL_END,
                        tool_call_id=tool_call_id
                    )
                )

        # 6. Stream text content
        for chunk in response.get("content", "").split():
            yield encoder.encode(
                TextMessageContentEvent(
                    type=EventType.TEXT_MESSAGE_CONTENT,
                    message_id=message_id,
                    delta=chunk + " "
                )
            )

        # 7. End message
        yield encoder.encode(
            TextMessageEndEvent(
                type=EventType.TEXT_MESSAGE_END,
                message_id=message_id
            )
        )

        # 8. Finish the run
        yield encoder.encode(
            RunFinishedEvent(
                type=EventType.RUN_FINISHED,
                thread_id=input_data.thread_id,
                run_id=input_data.run_id
            )
        )

    return StreamingResponse(
        event_generator(),
        media_type=encoder.get_content_type()
    )

async def call_llm_with_tools(prompt: str, tools: list):
    """Call your LLM with tool definitions"""
    # Implement with OpenAI, Anthropic, etc.
    # Return format: {"content": "...", "tool_calls": [...]}
    pass
```

### Tool-Based Generative UI Backend

```python
# backend/src/agent_with_tools.py
from openai import OpenAI
from typing import List, Dict

client = OpenAI()

def create_haiku_generator_agent():
    """Agent that can generate haikus as custom UI components"""

    tools = [
        {
            "type": "function",
            "function": {
                "name": "generate_haiku",
                "description": "Generate a haiku with Japanese and English text, plus an image",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "japanese": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "3 lines of haiku in Japanese"
                        },
                        "english": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "3 lines of haiku in English"
                        },
                        "image_name": {
                            "type": "string",
                            "description": "Image filename from available list"
                        },
                        "gradient": {
                            "type": "string",
                            "description": "CSS gradient for background"
                        }
                    },
                    "required": ["japanese", "english", "image_name", "gradient"]
                }
            }
        }
    ]

    return tools

async def run_agent_with_openai(prompt: str, tools: List[Dict]):
    """Run OpenAI agent with tools"""
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a creative haiku writer."},
            {"role": "user", "content": prompt}
        ],
        tools=tools,
        tool_choice="auto"
    )

    message = response.choices[0].message

    result = {
        "content": message.content or "",
        "tool_calls": []
    }

    if message.tool_calls:
        for tool_call in message.tool_calls:
            result["tool_calls"].append({
                "id": tool_call.id,
                "name": tool_call.function.name,
                "arguments": json.loads(tool_call.function.arguments)
            })

    return result
```

### State-Based Generative UI Backend

```python
# backend/src/state_based_agent.py
from ag_ui.core import StateDeltaEvent, EventType
import json

async def stream_task_progress(task_steps: List[str]):
    """Stream task progress using state updates"""

    for i, step in enumerate(task_steps):
        # Create JSON Patch operation to update state
        delta = [
            {
                "op": "replace",
                "path": f"/steps/{i}/status",
                "value": "completed"
            }
        ]

        yield encoder.encode(
            StateDeltaEvent(
                type=EventType.STATE_DELTA,
                delta=delta
            )
        )
```

---

## Frontend Implementation

### Basic Setup with CopilotKit

```tsx
// frontend/src/app/page.tsx
'use client'
import { CopilotKit } from '@copilotkit/react-core'
import { CopilotChat } from '@copilotkit/react-ui'
import '@copilotkit/react-ui/styles.css'

export default function ChatPage() {
  return (
    <CopilotKit runtimeUrl='/api/copilotkit' showDevConsole={true}>
      <div className='h-screen w-full'>
        <CopilotChat
          labels={{
            initial: 'Hi! Ask me to generate something custom.',
          }}
        />
      </div>
    </CopilotKit>
  )
}
```

### Backend Route Handler

```typescript
// frontend/src/app/api/copilotkit/route.ts
import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from '@copilotkit/runtime'
import { HttpAgent } from '@ag-ui/client'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  // Create agent pointing to your backend
  const agent = new HttpAgent({
    url: 'http://localhost:8000/agent',
    headers: {},
  })

  const runtime = new CopilotRuntime({
    agents: [agent],
  })

  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: '/api/copilotkit',
  })

  return handleRequest(request)
}
```

---

## Generative UI Components

### Method 1: Tool-Based Generative UI (Recommended)

This is the **most powerful** approach for generating custom UI components.

#### Frontend: Define Tool and Render Component

```tsx
// frontend/src/app/custom-ui-chat.tsx
'use client'
import { CopilotKit, useCopilotAction } from '@copilotkit/react-core'
import { CopilotChat } from '@copilotkit/react-ui'
import { useState } from 'react'

interface Haiku {
  japanese: string[]
  english: string[]
  image_name: string
  gradient: string
}

export default function CustomUIChat() {
  const [haikus, setHaikus] = useState<Haiku[]>([])

  // Define the tool that will trigger custom UI rendering
  useCopilotAction({
    name: 'generate_haiku',
    description: 'Generate a beautiful haiku with visual presentation',
    parameters: [
      {
        name: 'japanese',
        type: 'string[]',
        required: true,
        description: '3 lines of haiku in Japanese',
      },
      {
        name: 'english',
        type: 'string[]',
        required: true,
        description: '3 lines of haiku in English translation',
      },
      {
        name: 'image_name',
        type: 'string',
        required: true,
        description: 'Background image filename',
      },
      {
        name: 'gradient',
        type: 'string',
        required: true,
        description: 'CSS gradient for card background',
      },
    ],
    handler: async ({ japanese, english, image_name, gradient }) => {
      // Update local state
      const newHaiku: Haiku = {
        japanese,
        english,
        image_name,
        gradient,
      }
      setHaikus((prev) => [newHaiku, ...prev])

      return 'Haiku generated successfully!'
    },
    // 🎨 This is where the magic happens - custom rendering!
    render: ({ args }) => {
      if (!args.japanese) return null

      return (
        <HaikuCard
          japanese={args.japanese}
          english={args.english}
          image_name={args.image_name}
          gradient={args.gradient}
        />
      )
    },
  })

  return (
    <CopilotKit runtimeUrl='/api/copilotkit'>
      <div className='flex h-screen'>
        <div className='flex-1 p-8 overflow-auto'>
          <h2 className='text-2xl font-bold mb-4'>Generated Haikus</h2>
          <div className='grid gap-4'>
            {haikus.map((haiku, idx) => (
              <HaikuCard key={idx} {...haiku} />
            ))}
          </div>
        </div>

        <div className='w-96 border-l'>
          <CopilotChat
            labels={{
              initial: 'Ask me to generate a haiku!',
            }}
            suggestions={[
              { title: 'Nature Haiku', message: 'Write a haiku about nature' },
              {
                title: 'Ocean Haiku',
                message: 'Create a haiku about the ocean',
              },
            ]}
          />
        </div>
      </div>
    </CopilotKit>
  )
}

// Custom component that gets rendered
function HaikuCard({ japanese, english, image_name, gradient }: Haiku) {
  return (
    <div
      className='relative rounded-2xl p-8 shadow-lg overflow-hidden'
      style={{ background: gradient }}
    >
      {/* Decorative background */}
      <div className='absolute inset-0 opacity-10'>
        <div className='absolute top-0 right-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl' />
        <div className='absolute bottom-0 left-0 w-48 h-48 bg-purple-400 rounded-full blur-3xl' />
      </div>

      {/* Haiku text */}
      <div className='relative z-10 space-y-6'>
        {japanese.map((line, idx) => (
          <div key={idx} className='text-center space-y-2'>
            <p className='text-4xl font-serif font-bold text-slate-800'>
              {line}
            </p>
            <p className='text-lg font-light text-slate-600 italic'>
              {english[idx]}
            </p>
          </div>
        ))}
      </div>

      {/* Background image */}
      {image_name && (
        <div className='mt-8 pt-8 border-t border-slate-200'>
          <img
            src={`/images/${image_name}`}
            alt='Haiku scene'
            className='w-full rounded-xl shadow-xl'
          />
        </div>
      )}
    </div>
  )
}
```

### Method 2: State-Based Generative UI

Perfect for progress tracking and collaborative editing.

#### Frontend: Render from Agent State

```tsx
// frontend/src/app/state-based-ui.tsx
'use client'
import { CopilotKit, useCoAgentStateRender } from '@copilotkit/react-core'
import { CopilotChat } from '@copilotkit/react-ui'

interface TaskStep {
  description: string
  status: 'pending' | 'completed'
}

interface AgentState {
  steps: TaskStep[]
}

export default function StateBasedUI() {
  // Render custom UI based on agent state changes
  useCoAgentStateRender<AgentState>({
    name: 'task_agent',
    render: ({ state }) => {
      if (!state.steps || state.steps.length === 0) {
        return null
      }

      const completedCount = state.steps.filter(
        (s) => s.status === 'completed'
      ).length
      const progressPercent = (completedCount / state.steps.length) * 100

      return (
        <div className='rounded-xl p-6 bg-white shadow-lg'>
          {/* Progress Bar */}
          <div className='mb-5'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-xl font-bold'>Task Progress</h3>
              <span className='text-sm text-gray-500'>
                {completedCount}/{state.steps.length} Complete
              </span>
            </div>

            <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
              <div
                className='h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000'
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Step List */}
          <div className='space-y-2'>
            {state.steps.map((step, idx) => (
              <TaskStepItem
                key={idx}
                step={step}
                isActive={
                  step.status === 'pending' &&
                  idx === state.steps.findIndex((s) => s.status === 'pending')
                }
              />
            ))}
          </div>
        </div>
      )
    },
  })

  return (
    <CopilotKit runtimeUrl='/api/copilotkit' agent='task_agent'>
      <CopilotChat />
    </CopilotKit>
  )
}

function TaskStepItem({
  step,
  isActive,
}: {
  step: TaskStep
  isActive: boolean
}) {
  const isCompleted = step.status === 'completed'

  return (
    <div
      className={`
      flex items-center p-3 rounded-lg transition-all
      ${isCompleted ? 'bg-green-50 border border-green-200' : ''}
      ${isActive ? 'bg-blue-50 border border-blue-200 shadow-lg' : ''}
      ${!isCompleted && !isActive ? 'bg-gray-50 border border-gray-200' : ''}
    `}
    >
      {/* Status Icon */}
      <div
        className={`
        w-6 h-6 rounded-full flex items-center justify-center mr-3
        ${isCompleted ? 'bg-green-500' : ''}
        ${isActive ? 'bg-blue-500 animate-pulse' : ''}
        ${!isCompleted && !isActive ? 'bg-gray-300' : ''}
      `}
      >
        {isCompleted ? '✓' : isActive ? '⋯' : '○'}
      </div>

      {/* Step Text */}
      <div className='flex-1'>
        <div
          className={`
          font-semibold text-sm
          ${isCompleted ? 'text-green-700' : ''}
          ${isActive ? 'text-blue-700' : ''}
          ${!isCompleted && !isActive ? 'text-gray-500' : ''}
        `}
        >
          {step.description}
        </div>
        {isActive && (
          <div className='text-sm text-blue-600 animate-pulse mt-1'>
            Processing...
          </div>
        )}
      </div>
    </div>
  )
}
```

### Method 3: Shared State for Collaborative Editing

Bidirectional state where both user and agent can modify data.

```tsx
// frontend/src/app/collaborative-editor.tsx
'use client'
import { CopilotKit, useCoAgent } from '@copilotkit/react-core'
import { CopilotSidebar } from '@copilotkit/react-ui'
import { useState, useEffect } from 'react'

interface Recipe {
  title: string
  ingredients: Array<{ name: string; amount: string }>
  instructions: string[]
}

interface RecipeState {
  recipe: Recipe
}

export default function CollaborativeRecipeEditor() {
  // Shared state between frontend and agent
  const { state: agentState, setState: setAgentState } =
    useCoAgent<RecipeState>({
      name: 'recipe_agent',
      initialState: {
        recipe: {
          title: 'Your Recipe',
          ingredients: [],
          instructions: [],
        },
      },
    })

  const [localRecipe, setLocalRecipe] = useState(agentState.recipe)

  // Sync agent state to local state
  useEffect(() => {
    if (agentState.recipe) {
      setLocalRecipe(agentState.recipe)
    }
  }, [agentState.recipe])

  // Update both local and agent state
  const updateRecipe = (updates: Partial<Recipe>) => {
    const newRecipe = { ...localRecipe, ...updates }
    setLocalRecipe(newRecipe)
    setAgentState({ recipe: newRecipe })
  }

  return (
    <CopilotKit runtimeUrl='/api/copilotkit' agent='recipe_agent'>
      <div className='flex h-screen'>
        {/* Editor Panel */}
        <div className='flex-1 p-8 overflow-auto'>
          <input
            type='text'
            value={localRecipe.title}
            onChange={(e) => updateRecipe({ title: e.target.value })}
            className='text-3xl font-bold mb-6 w-full border-b-2 focus:border-blue-500'
            placeholder='Recipe Title'
          />

          <div className='mb-8'>
            <h3 className='text-xl font-semibold mb-4'>Ingredients</h3>
            {localRecipe.ingredients.map((ingredient, idx) => (
              <div key={idx} className='flex gap-2 mb-2'>
                <input
                  value={ingredient.name}
                  onChange={(e) => {
                    const newIngredients = [...localRecipe.ingredients]
                    newIngredients[idx].name = e.target.value
                    updateRecipe({ ingredients: newIngredients })
                  }}
                  className='flex-1 px-3 py-2 border rounded'
                  placeholder='Ingredient name'
                />
                <input
                  value={ingredient.amount}
                  onChange={(e) => {
                    const newIngredients = [...localRecipe.ingredients]
                    newIngredients[idx].amount = e.target.value
                    updateRecipe({ ingredients: newIngredients })
                  }}
                  className='w-32 px-3 py-2 border rounded'
                  placeholder='Amount'
                />
              </div>
            ))}
            <button
              onClick={() =>
                updateRecipe({
                  ingredients: [
                    ...localRecipe.ingredients,
                    { name: '', amount: '' },
                  ],
                })
              }
              className='mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
            >
              + Add Ingredient
            </button>
          </div>

          <div>
            <h3 className='text-xl font-semibold mb-4'>Instructions</h3>
            {localRecipe.instructions.map((instruction, idx) => (
              <div key={idx} className='mb-2'>
                <textarea
                  value={instruction}
                  onChange={(e) => {
                    const newInstructions = [...localRecipe.instructions]
                    newInstructions[idx] = e.target.value
                    updateRecipe({ instructions: newInstructions })
                  }}
                  className='w-full px-3 py-2 border rounded'
                  rows={2}
                  placeholder={`Step ${idx + 1}`}
                />
              </div>
            ))}
            <button
              onClick={() =>
                updateRecipe({
                  instructions: [...localRecipe.instructions, ''],
                })
              }
              className='mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
            >
              + Add Step
            </button>
          </div>
        </div>

        {/* Chat Sidebar - Agent can read and modify the recipe */}
        <CopilotSidebar
          defaultOpen={true}
          labels={{
            title: 'Recipe Assistant',
            initial: 'I can help you create and improve recipes!',
          }}
          suggestions={[
            {
              title: 'Add ingredients',
              message: 'Add ingredients for chocolate cake',
            },
            {
              title: 'Write instructions',
              message: 'Write baking instructions',
            },
          ]}
        />
      </div>
    </CopilotKit>
  )
}
```

---

## Complete Working Examples

### Example 1: Weather Dashboard Generator

A complete example showing how an agent can generate rich weather UI cards.

#### Backend

```python
# backend/weather_agent.py
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from ag_ui.core import *
from ag_ui.encoder import EventEncoder
import json
import uuid

app = FastAPI()

@app.post("/weather-agent")
async def weather_agent(input_data: RunAgentInput, request: Request):
    encoder = EventEncoder(accept=request.headers.get("accept"))

    async def generate_events():
        yield encoder.encode(RunStartedEvent(
            type=EventType.RUN_STARTED,
            thread_id=input_data.thread_id,
            run_id=input_data.run_id
        ))

        # Parse user message
        user_msg = input_data.messages[-1].content if input_data.messages else ""

        # Simulate calling weather API and LLM
        if "weather" in user_msg.lower():
            # Start text response
            message_id = str(uuid.uuid4())
            yield encoder.encode(TextMessageStartEvent(
                type=EventType.TEXT_MESSAGE_START,
                message_id=message_id,
                role="assistant"
            ))

            yield encoder.encode(TextMessageContentEvent(
                type=EventType.TEXT_MESSAGE_CONTENT,
                message_id=message_id,
                delta="I'll show you the weather forecast!"
            ))

            yield encoder.encode(TextMessageEndEvent(
                type=EventType.TEXT_MESSAGE_END,
                message_id=message_id
            ))

            # Trigger custom UI with tool call
            tool_call_id = str(uuid.uuid4())
            yield encoder.encode(ToolCallStartEvent(
                type=EventType.TOOL_CALL_START,
                tool_call_id=tool_call_id,
                tool_call_name="show_weather_card",
                parent_message_id=message_id
            ))

            weather_data = {
                "city": "San Francisco",
                "temperature": 68,
                "condition": "Partly Cloudy",
                "humidity": 65,
                "wind_speed": 12,
                "forecast": [
                    {"day": "Mon", "high": 70, "low": 55, "condition": "sunny"},
                    {"day": "Tue", "high": 72, "low": 57, "condition": "cloudy"},
                    {"day": "Wed", "high": 68, "low": 54, "condition": "rainy"}
                ]
            }

            yield encoder.encode(ToolCallArgsEvent(
                type=EventType.TOOL_CALL_ARGS,
                tool_call_id=tool_call_id,
                delta=json.dumps(weather_data)
            ))

            yield encoder.encode(ToolCallEndEvent(
                type=EventType.TOOL_CALL_END,
                tool_call_id=tool_call_id
            ))

        yield encoder.encode(RunFinishedEvent(
            type=EventType.RUN_FINISHED,
            thread_id=input_data.thread_id,
            run_id=input_data.run_id
        ))

    return StreamingResponse(
        generate_events(),
        media_type=encoder.get_content_type()
    )
```

#### Frontend

```tsx
// frontend/src/app/weather-chat.tsx
'use client'
import { CopilotKit, useCopilotAction } from '@copilotkit/react-core'
import { CopilotChat } from '@copilotkit/react-ui'
import { useState } from 'react'

interface WeatherForecast {
  day: string
  high: number
  low: number
  condition: string
}

interface WeatherData {
  city: string
  temperature: number
  condition: string
  humidity: number
  wind_speed: number
  forecast: WeatherForecast[]
}

export default function WeatherChat() {
  const [weatherCards, setWeatherCards] = useState<WeatherData[]>([])

  useCopilotAction({
    name: 'show_weather_card',
    description: 'Display a weather forecast card',
    parameters: [
      { name: 'city', type: 'string', required: true },
      { name: 'temperature', type: 'number', required: true },
      { name: 'condition', type: 'string', required: true },
      { name: 'humidity', type: 'number', required: true },
      { name: 'wind_speed', type: 'number', required: true },
      {
        name: 'forecast',
        type: 'object[]',
        required: true,
        description: '3-day forecast array',
      },
    ],
    handler: async (args) => {
      setWeatherCards((prev) => [args as WeatherData, ...prev])
      return 'Weather card displayed!'
    },
    render: ({ args }) => {
      const data = args as WeatherData
      if (!data.city) return null

      return <WeatherCard {...data} />
    },
  })

  return (
    <CopilotKit runtimeUrl='/api/copilotkit'>
      <div className='flex h-screen'>
        <div className='flex-1 p-8 bg-gradient-to-br from-blue-50 to-blue-100 overflow-auto'>
          <h1 className='text-3xl font-bold mb-6 text-gray-800'>
            Weather Dashboard
          </h1>
          <div className='grid gap-6'>
            {weatherCards.map((card, idx) => (
              <WeatherCard key={idx} {...card} />
            ))}
          </div>
        </div>

        <div className='w-96 border-l bg-white'>
          <CopilotChat
            labels={{
              initial: 'Ask me about the weather anywhere!',
            }}
            suggestions={[
              {
                title: 'SF Weather',
                message: "What's the weather in San Francisco?",
              },
              { title: 'NYC Forecast', message: "Show me New York's forecast" },
            ]}
          />
        </div>
      </div>
    </CopilotKit>
  )
}

function WeatherCard({
  city,
  temperature,
  condition,
  humidity,
  wind_speed,
  forecast,
}: WeatherData) {
  return (
    <div className='bg-white rounded-3xl shadow-2xl p-8 max-w-2xl'>
      {/* Current Weather */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h2 className='text-4xl font-bold text-gray-800'>{city}</h2>
          <p className='text-xl text-gray-600 mt-2'>{condition}</p>
        </div>
        <div className='text-right'>
          <div className='text-6xl font-bold text-blue-600'>{temperature}°</div>
          <div className='text-sm text-gray-500 mt-2'>Fahrenheit</div>
        </div>
      </div>

      {/* Weather Details */}
      <div className='grid grid-cols-2 gap-4 mb-8'>
        <div className='bg-blue-50 rounded-xl p-4'>
          <div className='text-sm text-gray-600'>Humidity</div>
          <div className='text-2xl font-bold text-blue-600'>{humidity}%</div>
        </div>
        <div className='bg-blue-50 rounded-xl p-4'>
          <div className='text-sm text-gray-600'>Wind Speed</div>
          <div className='text-2xl font-bold text-blue-600'>
            {wind_speed} mph
          </div>
        </div>
      </div>

      {/* 3-Day Forecast */}
      <div className='border-t pt-6'>
        <h3 className='text-lg font-semibold mb-4 text-gray-700'>
          3-Day Forecast
        </h3>
        <div className='grid grid-cols-3 gap-4'>
          {forecast.map((day, idx) => (
            <div
              key={idx}
              className='text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl'
            >
              <div className='font-semibold text-gray-700'>{day.day}</div>
              <div className='text-3xl my-2'>
                {getWeatherIcon(day.condition)}
              </div>
              <div className='text-sm text-gray-600'>
                {day.high}° / {day.low}°
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function getWeatherIcon(condition: string): string {
  const icons: Record<string, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️',
  }
  return icons[condition.toLowerCase()] || '🌤️'
}
```

---

## Best Practices

### 1. **Event Ordering**

Always emit events in the correct order:

```
RUN_STARTED
  → TEXT_MESSAGE_START
    → TEXT_MESSAGE_CONTENT (multiple)
  → TEXT_MESSAGE_END
  → TOOL_CALL_START
    → TOOL_CALL_ARGS
  → TOOL_CALL_END
→ RUN_FINISHED
```

### 2. **Error Handling**

Always catch errors and emit `RUN_ERROR`:

```python
try:
    # ... agent logic
except Exception as e:
    yield encoder.encode(RunErrorEvent(
        type=EventType.RUN_ERROR,
        message=str(e),
        code="INTERNAL_ERROR"
    ))
```

### 3. **Tool Naming Conventions**

- Use clear, descriptive names: `generate_haiku`, `show_weather_card`
- Keep parameters flat when possible
- Provide detailed descriptions for LLM

### 4. **Component Composition**

Break down complex UI into smaller components:

```tsx
<CustomCard>
  <CardHeader />
  <CardContent />
  <CardFooter />
</CustomCard>
```

### 5. **State Management**

- Use `STATE_SNAPSHOT` for initial state
- Use `STATE_DELTA` (JSON Patch) for updates
- Keep state minimal and serializable

### 6. **Performance**

- Stream content incrementally (don't wait for complete response)
- Use `TEXT_MESSAGE_CHUNK` for convenience
- Debounce rapid state updates

### 7. **Security**

- Validate all tool parameters on backend
- Sanitize user input
- Never trust frontend-generated tool calls

### 8. **Testing**

Test with different event sequences:

```typescript
const mockEvents = [
  { type: 'RUN_STARTED', threadId: '1', runId: '1' },
  { type: 'TEXT_MESSAGE_START', messageId: 'm1', role: 'assistant' },
  { type: 'TEXT_MESSAGE_CONTENT', messageId: 'm1', delta: 'Hello' },
  { type: 'TOOL_CALL_START', toolCallId: 't1', toolCallName: 'test_tool' },
]
```

---

## Summary

To implement custom UI generation in your chatbot:

1. **Choose your approach**:
   - Tool-based (most flexible) for triggered UI components
   - State-based for real-time progress/updates
   - Shared state for collaborative editing

2. **Backend**: Emit AG-UI events (SSE/WebSocket)
   - `RUN_STARTED/FINISHED` for lifecycle
   - `TEXT_MESSAGE_*` for chat
   - `TOOL_CALL_*` for UI triggers
   - `STATE_*` for dynamic updates

3. **Frontend**: React hooks + custom components
   - `useCopilotAction` with `render` for tool-based UI
   - `useCoAgentStateRender` for state-based UI
   - `useCoAgent` for shared state

4. **Connect**: Use `HttpAgent` or framework-specific adapters
   - Point to your backend endpoint
   - Handle streaming responses
   - Process events in real-time

The key insight: **Agents emit structured events, frontends render custom React components**. This separation allows for rich, interactive UI while keeping agent logic clean and portable.
