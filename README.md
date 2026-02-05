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
