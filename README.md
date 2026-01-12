# 🎨 Dynamic UI Chat Application

A modern chat application showcasing **two approaches** to AI-generated dynamic UIs:

1. **Tool-Based UI** - Pre-defined components with type safety
2. **A2UI (Agent-to-UI)** - Declarative specifications with unlimited flexibility

Built with React (Vite), Express, and OpenAI's GPT-4.

![Dynamic UI Chat](https://img.shields.io/badge/React-18.2.0-blue) ![Express](https://img.shields.io/badge/Express-4.18.2-green) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)

## ✨ Two Implementations

### 📊 AGUI - Tool-Based UI (`/frontend-agui`)

Traditional approach where the agent calls pre-defined tools:

- ✅ **Type-safe** - Full TypeScript support
- ⚡ **Fast** - Pre-built components
- 🎯 **Controlled** - Fixed component types
- Components: Charts, Weather Cards, Task Lists, Card Grids, Progress Trackers

**Port: 5173** | **Endpoint: `/api/agui`**

### 🎨 A2UI - Declarative UI (`/frontend-a2ui`)

Modern approach where the agent emits UI specifications:

- 🚀 **Flexible** - Create any UI component
- 🔧 **Composable** - Build complex layouts
- 🎭 **Creative** - Agent designs the UI
- Components: All primitives (container, card, heading, text, button, image, list, grid, badge, alert, code, table, etc.)

**Port: 5174** | **Endpoint: `/api/a2ui`**

## 🏗️ Architecture

Both implementations use the **AG-UI (Agent-User Interaction Protocol)** for streaming:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   React         │         │   AG-UI          │         │   Express       │
│   Frontend      │◄────────┤   Events (SSE)   ├────────►│   Backend       │
│   (Tool/A2UI)   │         │                  │         │   + OpenAI      │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

### Tool-Based Flow

```
User → Agent → show_chart(data) → ChartComponent
```

### A2UI Flow

```
User → Agent → render_custom_ui(UISpec) → A2UIRenderer → Dynamic Components
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API Key

### Installation

1. **Clone the repository**

   ```bash
   cd dynamic-ui2
   ```

2. **Install Backend Dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies (Both)**

   ```bash
   # AGUI - Tool-based UI
   cd ../frontend-agui
   npm install

   # A2UI
   cd ../frontend-a2ui
   npm install
   ```

4. **Configure Environment Variables**

   Create a `.env` file in the `backend` directory:

   ```bash
   cd ../backend
   cp .env.example .env
   ```

   Edit `.env` and add your OpenAI API key:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```

### Running the Applications

1. **Start the Backend Server** (Required for both)

   ```bash
   cd backend
   npm run dev
   ```

   Backend will run on `http://localhost:3001`

   - AGUI endpoint: `/api/agui`
   - A2UI endpoint: `/api/a2ui`

2. **Start Frontend - AGUI (Tool-Based)** (in a new terminal)

   ```bash
   cd frontend
   npm run dev
   ```

   Will run on `http://localhost:5173`

3. **OR Start Frontend - A2UI** (in a new terminal)

   ```bash
   cd frontend-a2ui
   npm run dev
   ```

   Will run on `http://localhost:5174`

4. **Open your browser**
   - AGUI (Tool-based): `http://localhost:5173`
   - A2UI: `http://localhost:5174`

## 🎯 Usage Examples

### Tool-Based UI Examples

Try asking the AI to generate pre-defined visualizations:

- 📊 **"Show me a sales chart"** - Generates a bar/line chart
- 🌤️ **"What's the weather in San Francisco?"** - Creates a weather card
- ✅ **"Create a task list for my project"** - Displays an interactive task list
- 📈 **"Display revenue growth data"** - Shows a line chart with data
- 🎯 **"Show project progress"** - Creates a progress tracker

### A2UI Examples

Try asking for custom, flexible UIs:

- 🎨 **"Create a sales dashboard"** - Agent designs custom dashboard
- 🛍️ **"Show me a product card for headphones"** - Custom product card
- 📋 **"Build a pricing comparison table"** - Dynamic table
- 📊 **"Create a project status overview"** - Custom metrics layout
- 🎯 **"Design a feature list with badges"** - Composed UI elements

## 📁 Project Structure

```
dynamic-ui/
├── backend/                    # Shared backend for both
│   ├── src/
│   │   ├── server.ts          # Express server with both endpoints
│   │   └── types.ts           # TypeScript definitions
│   ├── package.json
│   └── tsconfig.json
│
├── frontend-agui/              # AGUI - Tool-Based UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx       # Chat with tool handling
│   │   │   ├── Message.tsx             # Message display
│   │   │   ├── DynamicUIComponent.tsx  # UI router
│   │   │   └── ui/
│   │   │       ├── ChartComponent.tsx  # Charts (Recharts)
│   │   │       ├── WeatherCard.tsx     # Weather display
│   │   │       ├── TaskList.tsx        # Interactive tasks
│   │   │       ├── CardGrid.tsx        # Card collections
│   │   │       └── ProgressTracker.tsx # Progress steps
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── frontend-a2ui/              # A2UI - Declarative UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx       # Chat with spec handling
│   │   │   └── A2UIRenderer.tsx        # Declarative UI interpreter
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
├── A2UI_RESEARCH_AND_IMPLEMENTATION.md
├── AG-UI_IMPLEMENTATION_GUIDE.md
└── README.md
```

## 🛠️ Technologies Used

### Frontend

- **React 18** - UI library
- **TypeScript 5.9** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Recharts** - Charting library (tool-based UI)

### Backend

- **Express** - Web framework
- **TypeScript 5.9** - Type safety
- **OpenAI API** - GPT-4o-mini integration
- **AG-UI Protocol** - Event streaming
- **Server-Sent Events (SSE)** - Real-time communication

## 🎨 Component Comparison

### Tool-Based UI Components (5 pre-defined)

**1. Chart Component** - Data visualizations (Bar, Line, Area, Pie)
**2. Weather Card** - Weather with forecast
**3. Task List** - Interactive task management
**4. Card Grid** - Collections of cards
**5. Progress Tracker** - Multi-step progress

### A2UI Components (16+ primitives)

**Layout:** container, card, grid
**Content:** heading, text, list, image, code, table  
**Interactive:** button, link, progress, metric
**UI Elements:** badge, alert, divider, spacer

_Plus: Unlimited combinations by composing primitives!_

## 🔍 When to Use Which?

### Use Tool-Based UI When:

- ✅ You have a fixed set of component types
- ✅ You need type safety and autocomplete
- ✅ Performance is critical
- ✅ You want strict control over UI

### Use A2UI When:

- ✅ You want maximum flexibility
- ✅ Agent should create novel UI patterns
- ✅ You're building extensible platforms
- ✅ UI requirements change frequently
- ✅ You want the agent to be creative

## 🔧 Customization

### Adding Components to AGUI (Tool-Based)

1. **Create a new component** in `frontend-agui/src/components/ui/`
2. **Define the tool** in `backend/src/server.ts` tools array
3. **Add the component** to `DynamicUIComponent.tsx`

Example:

```typescript
// backend/src/server.ts
{
  type: 'function',
  function: {
    name: 'show_custom_component',
    description: 'Display a custom component',
    parameters: {
      type: 'object',
      properties: {
        // your parameters
      },
    },
  },
}
```

### Styling

The app uses TailwindCSS. Modify `tailwind.config.js` to customize:

- Colors
- Fonts
- Spacing
- Animations

## 🐛 Troubleshooting

### Backend won't start

- Check if port 3001 is available
- Verify your OpenAI API key is set in `.env`
- Run `npm install` in the backend directory

### Frontend won't connect

- Ensure backend is running on port 3001
- Check the Vite proxy configuration in `vite.config.js`
- Clear browser cache and restart dev server

### Components not rendering

- Check browser console for errors
- Verify tool names match between backend and frontend
- Ensure all dependencies are installed

## 📝 License

MIT License - feel free to use this project for learning and development!

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Add new UI components
- Improve existing components
- Fix bugs
- Enhance documentation

## 🙏 Credits

Built with the **AG-UI Protocol** - a lightweight, event-driven protocol for AI-powered interfaces.

---

Made with ❤️ using React, Express, and OpenAI
