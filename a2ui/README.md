# A2UI Frontend - Declarative UI Specification Demo

This is a standalone frontend application demonstrating **A2UI (Agent-to-UI)** technology - a declarative approach where AI agents emit UI specifications that are interpreted and rendered dynamically.

## 🎯 What is A2UI?

Instead of calling pre-defined tools (like `show_chart`, `show_weather`), the agent creates **declarative UI specifications** - JSON objects that describe the component hierarchy, layout, and properties. The frontend interprets these specifications and renders the appropriate React components.

## 🏗️ Architecture

```
User Request
    ↓
AI Agent (GPT-4)
    ↓
render_custom_ui tool
    ↓
UISpecification JSON
    ↓
A2UIRenderer Component
    ↓
Dynamic React UI
```

## 📦 Installation

```bash
cd frontend-a2ui
npm install
```

## 🚀 Running the App

Make sure the backend is running first (port 3001), then:

```bash
npm run dev
```

The app will be available at **http://localhost:5174**

## 🎨 Supported Components

The A2UIRenderer supports these component types:

### Layout Components

- **container** - Layout wrapper with vertical/horizontal/grid layouts
- **card** - Styled card container
- **grid** - Multi-column grid layout

### Content Components

- **heading** - Headings (h1-h6)
- **text** - Paragraph text
- **list** - Bullet lists
- **image** - Images with alt text
- **code** - Code blocks with syntax highlighting
- **table** - Data tables with headers and rows

### Interactive Components

- **button** - Action buttons
- **link** - Hyperlinks
- **progress** - Progress bars with labels
- **metric** - Large metric displays

### UI Elements

- **badge** - Colored badges/tags
- **alert** - Info/success/warning/error alerts
- **divider** - Horizontal dividers
- **spacer** - Vertical spacing

## 💡 Example Usage

### Try these prompts:

**Sales Dashboard:**

```
"Create a sales dashboard with revenue metrics"
```

**Product Card:**

```
"Show me a product card for wireless headphones"
```

**Pricing Table:**

```
"Build a pricing comparison table"
```

**Project Status:**

```
"Create a project status dashboard with progress tracking"
```

## 🔍 How It Works

### 1. User sends a message

```typescript
'Create a dashboard showing project metrics'
```

### 2. Agent generates UI specification

```json
{
  "component": "container",
  "layout": "vertical",
  "children": [
    {
      "component": "heading",
      "props": { "text": "Project Dashboard", "level": 1 }
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
              "props": { "value": "87%", "label": "Completion" }
            }
          ]
        }
      ]
    }
  ]
}
```

### 3. A2UIRenderer interprets and renders

The specification is recursively rendered into React components with proper styling.

## 🆚 A2UI vs Tool-Based UI

| Feature       | Tool-Based              | A2UI                     |
| ------------- | ----------------------- | ------------------------ |
| Flexibility   | Fixed components        | Unlimited combinations   |
| Type Safety   | ✅ Strong               | ⚠️ Runtime validation    |
| Performance   | ⚡ Fast                 | 🐌 Slower (dynamic)      |
| Development   | Need to code components | Just add component types |
| AI Creativity | Limited to tools        | Fully creative           |

## 🛠️ Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **SSE** - Server-sent events for streaming
- **OpenAI GPT-4o-mini** - AI agent

## 📁 Project Structure

```
frontend-a2ui/
├── src/
│   ├── components/
│   │   ├── A2UIRenderer.tsx    # Core renderer component
│   │   └── ChatInterface.tsx   # Chat UI and SSE handling
│   ├── types.ts                # TypeScript definitions
│   ├── App.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🔐 Security Notes

- UI specifications are validated before rendering
- Unknown components show warnings instead of crashing
- No `eval()` or dangerous code execution
- All user inputs are sanitized

## 🚀 Future Enhancements

- [ ] Schema validation (Zod/Ajv)
- [ ] More component types (forms, charts, etc.)
- [ ] Animation support
- [ ] Custom theming
- [ ] Component library expansion
- [ ] Interactive callbacks

## 📚 Learn More

- See [A2UI_RESEARCH_AND_IMPLEMENTATION.md](../A2UI_RESEARCH_AND_IMPLEMENTATION.md) for full documentation
- Compare with tool-based UI in `../frontend/` directory
- Backend A2UI endpoint: `/api/chat-a2ui`

---

Built with ❤️ using A2UI technology
