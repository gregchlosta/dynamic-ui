# Dynamic UI Chat

A monorepo demonstrating two approaches to AI-powered dynamic UI generation using Claude.

## Apps

### 1. Backend (`apps/backend`)

Express server that handles chat requests and streams responses using Claude API.

**Features:**

- Serves two different UI generation endpoints
- Server-Sent Events (SSE) streaming
- Anthropic Claude integration

### 2. AGUI (`apps/agui`)

Tool-based dynamic UI using the AG-UI Protocol with predefined React components.

**Features:**

- Uses `@ag-ui/client` SDK
- Predefined components: Charts, Weather Cards, Task Lists, Card Grids, Progress Trackers
- Claude calls tool functions to render specific UI components

### 3. A2UI (`apps/a2ui`)

Declarative UI specification approach where Claude generates complete UI structures.

**Features:**

- Custom UI renderer interpreting JSON specifications
- Flexible component system (containers, cards, grids, metrics, badges, etc.)
- Claude generates any UI by specifying component hierarchies

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Anthropic API key

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Create a `.env` file in `apps/backend/`:

```bash
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
```

### Running the Apps

**Start all apps (recommended):**

```bash
npm run dev
```

**Or start individually:**

Backend (required):

```bash
npm run dev:backend
```

AGUI frontend:

```bash
npm run dev:agui
```

A2UI frontend:

```bash
npm run dev:a2ui
```

### Accessing the Apps

- **Backend API**: http://localhost:3001
- **AGUI**: http://localhost:5173
- **A2UI**: http://localhost:5174

## Developer Walkthrough: Understanding AGUI vs A2UI

This section explains how both UI generation approaches work in this codebase, helping you understand the architecture, data flow, and key differences.

---

### 🎯 Overview: Two Approaches to Dynamic UI

This project demonstrates two distinct methods for AI-generated user interfaces:

1. **AGUI (AG-UI Protocol)**: Tool-based approach with predefined React components
2. **A2UI (Agent-to-UI)**: Declarative specification approach with flexible component trees

---

### 📊 AGUI: Tool-Based Dynamic UI

#### **How It Works**

AGUI uses the **AG-UI Protocol** where Claude has access to specific "tools" (like `show_chart`, `show_weather_card`, `show_task_list`). When a user asks for something, Claude decides which tool to call and passes the appropriate data.

#### **Architecture Flow**

```
User Message → Backend → Claude API (with tools) → Tool Calls → Frontend → Renders Predefined Components
```

#### **Key Files**

- **Backend Handler & Tool Definitions**: [`apps/backend/src/handlers/agui.ts`](apps/backend/src/handlers/agui.ts)
- **Frontend Component Mapper**: [`apps/agui/src/components/DynamicUIComponent.tsx`](apps/agui/src/components/DynamicUIComponent.tsx)
- **Pre-built UI Components**: [`apps/agui/src/components/ui/`](apps/agui/src/components/ui/)

#### **How It Works Step-by-Step**

1. **User sends a message** (e.g., "Show me a sales chart")

2. **Backend receives request** and forwards to Claude with tool definitions:

   ```typescript
   // From agui.ts handler
   {
     name: 'show_chart',
     description: 'Display a chart with data visualization...',
     parameters: {
       type: 'object',
       properties: {
         title: { type: 'string' },
         type: { enum: ['bar', 'line', 'area', 'pie'] },
         data: { type: 'array', items: {...} }
       }
     }
   }
   ```

3. **Claude decides to call a tool** and generates structured data:

   ```json
   {
     "tool": "show_chart",
     "args": {
       "title": "Monthly Sales",
       "type": "bar",
       "data": [
         { "name": "Jan", "value": 1200 },
         { "name": "Feb", "value": 1900 }
       ]
     }
   }
   ```

4. **Backend streams events** via Server-Sent Events (SSE):
   - `TOOL_CALL_START` - Tool invocation begins
   - `TOOL_CALL_ARGS` - Arguments stream in
   - `TOOL_CALL_END` - Tool call complete

5. **Frontend receives tool call** and maps to pre-built component:

   ```tsx
   // DynamicUIComponent.tsx
   switch (toolName) {
     case 'show_chart':
       return <ChartComponent {...toolArgs} />
     case 'show_weather_card':
       return <WeatherCard {...toolArgs} />
     // ...
   }
   ```

6. **Pre-built component renders** with the provided data

#### **Available AGUI Tools**

- 🔹 `show_chart` - Bar, line, area, and pie charts
- 🔹 `show_weather_card` - Weather forecasts with 3-day outlook
- 🔹 `show_task_list` - Interactive task lists with priorities
- 🔹 `show_card_grid` - Grid of cards with status indicators
- 🔹 `show_progress_tracker` - Multi-step progress visualization

#### **Pros & Cons**

✅ **Pros:**

- Consistent, polished UI components
- Type-safe with Zod validation
- Easy to add new tools/components
- Works with AG-UI ecosystem

❌ **Cons:**

- Limited to predefined components
- Can't create new UI patterns on the fly
- Requires backend changes to add new components

---

### 🎨 A2UI: Declarative Specification Approach

#### **How It Works**

A2UI gives Claude a single powerful tool: `render_custom_ui`. Instead of predefined components, Claude generates a **declarative UI specification** (JSON tree) that describes the entire UI structure.

#### **Architecture Flow**

```
User Message → Backend → Claude API (with render_custom_ui) → UI Spec JSON → Frontend Renderer → Dynamic Components
```

#### **Key Files**

- **Backend**: [`apps/backend/src/handlers/a2ui.ts`](apps/backend/src/handlers/a2ui.ts)
- **Frontend Renderer**: [`apps/a2ui/src/components/A2UIRenderer.tsx`](apps/a2ui/src/components/A2UIRenderer.tsx)
- **Type Definitions**: [`apps/a2ui/src/types.ts`](apps/a2ui/src/types.ts)

#### **How It Works Step-by-Step**

1. **User sends a message** (e.g., "Create a sales dashboard")

2. **Backend receives request** with a single flexible tool:

   ```typescript
   {
     name: 'render_custom_ui',
     description: 'Generate a custom UI component specification...',
     input_schema: {
       // Accepts any component tree structure
     }
   }
   ```

3. **Claude designs the entire UI** as a declarative specification:

   ```json
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
               {
                 "component": "metric",
                 "props": { "value": "$45.2K", "label": "Revenue" }
               },
               {
                 "component": "badge",
                 "props": { "text": "+12.5%", "color": "green" }
               }
             ]
           }
           // ... more cards
         ]
       }
     ]
   }
   ```

4. **Backend streams the specification** via SSE with custom `ui.spec` event

5. **Frontend Renderer interprets the spec** recursively:

   ```tsx
   // A2UIRenderer.tsx
   const UIComponent = ({ spec }) => {
     switch (spec.component) {
       case 'container':
         return (
           <div className={getLayoutClasses(layout)}>
             {children.map((child) => (
               <UIComponent spec={child} />
             ))}
           </div>
         )
       case 'metric':
         return (
           <div>
             <span className='text-4xl'>{props.value}</span>
             <span className='text-sm'>{props.label}</span>
           </div>
         )
       // ... 15+ component types
     }
   }
   ```

6. **Components render dynamically** based on the specification

#### **Available A2UI Components**

The renderer supports 17 component types:

- **Layout**: `container`, `card`, `grid`
- **Typography**: `heading`, `text`, `code`
- **Data Display**: `metric`, `table`, `list`, `badge`, `progress`
- **Interactive**: `button`, `link`
- **Media**: `image`
- **Utility**: `divider`, `spacer`, `alert`

#### **Pros & Cons**

✅ **Pros:**

- Infinite UI flexibility
- No backend changes needed for new patterns
- Claude can compose any UI from primitives
- Great for custom dashboards and unique layouts

❌ **Cons:**

- Less consistent styling across instances
- Requires careful prompt engineering
- No built-in validation for specifications
- Can produce malformed UIs if spec is invalid

---

### 🔄 Data Flow Comparison

#### **AGUI Flow**

```
User: "Show me a weather forecast"
  ↓
Backend: Sends tools to Claude
  ↓
Claude: Calls show_weather_card(city="NYC", temp=72, ...)
  ↓
Frontend: Receives tool call → Maps to <WeatherCard /> → Renders
```

#### **A2UI Flow**

```
User: "Create a weather dashboard"
  ↓
Backend: Sends render_custom_ui tool to Claude
  ↓
Claude: Generates UI spec with containers, grids, metrics, badges
  ↓
Frontend: Receives spec → <A2UIRenderer /> interprets → Renders
```

---

### 🧩 Key Code Patterns

#### **AGUI: Adding a New Tool**

1. **Define the tool** in [`apps/backend/src/handlers/agui.ts`](apps/backend/src/handlers/agui.ts) (add to `AGUI_TOOLS` array):

   ```typescript
   {
     name: 'show_calendar',
     description: 'Display a calendar view',
     parameters: { /* schema */ }
   }
   ```

2. **Create the React component** in `apps/agui/src/components/ui/Calendar.tsx`

3. **Map in DynamicUIComponent**:
   ```tsx
   case 'show_calendar':
     return <Calendar {...toolArgs} />
   ```

#### **A2UI: Adding a New Component**

1. **Add switch case** in [`A2UIRenderer.tsx`](apps/a2ui/src/components/A2UIRenderer.tsx):

   ```tsx
   case 'calendar':
     return <div className="calendar">
       {/* Render based on props */}
     </div>
   ```

2. **Update system prompt** in [`a2ui.ts`](apps/backend/src/handlers/a2ui.ts) to document the new component

---

### 🎓 When to Use Which?

**Use AGUI when:**

- You need consistent, reusable components
- You want type safety and validation
- You have a fixed set of use cases
- You're building a component library

**Use A2UI when:**

- You need maximum flexibility
- Users want custom layouts and designs
- You don't know UI patterns in advance
- You want rapid prototyping without backend changes

---

### 🔧 Backend Architecture (Shared)

Both systems share the same backend structure:

- **Express server** with SSE streaming
- **Anthropic Claude API** integration
- **Type-safe handlers** for each approach
- **CORS enabled** for local development

Key backend files:

- [`apps/backend/src/server.ts`](apps/backend/src/server.ts) - Main Express server
- [`apps/backend/src/utils.ts`](apps/backend/src/utils.ts) - SSE encoding utilities

---

### 🚀 Extending the Project

#### **Add a new AGUI tool:**

1. Add tool definition to `AGUI_TOOLS` array in [`handlers/agui.ts`](apps/backend/src/handlers/agui.ts)
2. Create UI component in `agui/src/components/ui/`
3. Map in `DynamicUIComponent.tsx`

#### **Add a new A2UI component:**

1. Add case in `A2UIRenderer.tsx`
2. Update system prompt in `handlers/a2ui.ts`

#### **Modify streaming behavior:**

- Edit SSE event emission in handlers
- Update event listeners in frontend `ChatInterface.tsx`

---

## Architecture

```
dynamic-ui/
├── apps/
│   ├── backend/     # Express API server
│   ├── agui/        # AG-UI Protocol frontend (port 5173)
│   └── a2ui/        # Declarative UI frontend (port 5174)
└── package.json     # Workspace configuration
```

## Build

Build all apps:

```bash
npm run build
```

Build individually:

```bash
npm run build:backend
npm run build:agui
npm run build:a2ui
```
