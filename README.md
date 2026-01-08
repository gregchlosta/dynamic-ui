# 🎨 Dynamic UI Chat Application

A modern chat application built with React (Vite) and Express that generates dynamic UI components in real-time using AI. When users ask for visualizations, the AI generates beautiful, interactive components directly in the chat!

![Dynamic UI Chat](https://img.shields.io/badge/React-18.2.0-blue) ![Express](https://img.shields.io/badge/Express-4.18.2-green) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-orange)

## ✨ Features

- 💬 **Real-time Chat Interface** - Smooth, responsive chat experience
- 🎨 **Dynamic UI Generation** - AI generates visual components on demand
- 📊 **Multiple Component Types**:
  - Interactive Charts (Bar, Line, Area, Pie)
  - Weather Forecast Cards
  - Task Lists with progress tracking
  - Card Grids for displaying collections
  - Progress Trackers for multi-step processes
- 🔄 **AG-UI Protocol** - Event-driven streaming architecture
- 🎯 **OpenAI Integration** - Powered by GPT-4
- ⚡ **Vite** - Lightning-fast development experience
- 🎭 **TailwindCSS** - Beautiful, modern UI design

## 🏗️ Architecture

This application uses the **AG-UI (Agent-User Interaction Protocol)** to stream events from the backend to the frontend:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   React         │         │   AG-UI          │         │   Express       │
│   Frontend      │◄────────┤   Events (SSE)   ├────────►│   Backend       │
│   (Vite)        │         │                  │         │   + OpenAI      │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

### Event Flow

1. User sends a message
2. Backend calls OpenAI with custom tools
3. OpenAI decides which tool to call based on user intent
4. Backend streams AG-UI events (SSE)
5. Frontend renders dynamic UI components

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

3. **Install Frontend Dependencies**

   ```bash
   cd ../frontend
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

### Running the Application

1. **Start the Backend Server**

   ```bash
   cd backend
   npm run dev
   ```

   Backend will run on `http://localhost:3001`

2. **Start the Frontend (in a new terminal)**

   ```bash
   cd frontend
   npm run dev
   ```

   Frontend will run on `http://localhost:5173`

3. **Open your browser**
   Navigate to `http://localhost:5173`

## 🎯 Usage Examples

Try asking the AI to generate different visualizations:

- 📊 **"Show me a sales chart"** - Generates a bar/line chart
- 🌤️ **"What's the weather in San Francisco?"** - Creates a weather card
- ✅ **"Create a task list for my project"** - Displays an interactive task list
- 📈 **"Display revenue growth data"** - Shows a line chart with data
- 🎯 **"Show project progress"** - Creates a progress tracker
- 🖼️ **"Display a card grid of products"** - Generates a grid of cards

## 📁 Project Structure

```
dynamic-ui2/
├── backend/
│   ├── src/
│   │   └── server.js          # Express server with AG-UI events
│   ├── package.json
│   ├── .env.example
│   └── .env                    # Your environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx       # Main chat component
│   │   │   ├── Message.jsx             # Message display
│   │   │   ├── DynamicUIComponent.jsx  # UI router
│   │   │   └── ui/
│   │   │       ├── ChartComponent.jsx  # Charts (Recharts)
│   │   │       ├── WeatherCard.jsx     # Weather display
│   │   │       ├── TaskList.jsx        # Interactive tasks
│   │   │       ├── CardGrid.jsx        # Card collections
│   │   │       └── ProgressTracker.jsx # Progress steps
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

## 🛠️ Technologies Used

### Frontend

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Recharts** - Charting library

### Backend

- **Express** - Web framework
- **OpenAI API** - GPT-4 integration
- **AG-UI Protocol** - Event streaming
- **Server-Sent Events (SSE)** - Real-time communication

## 🎨 Available Components

### 1. Chart Component

Displays data visualizations:

- Bar charts
- Line charts
- Area charts
- Pie charts

### 2. Weather Card

Shows weather information with:

- Current temperature and conditions
- Humidity and wind speed
- 3-day forecast

### 3. Task List

Interactive task management:

- Checkbox toggling
- Priority levels (high, medium, low)
- Progress tracking

### 4. Card Grid

Display collections of items:

- Image support
- Descriptions
- Tags

### 5. Progress Tracker

Multi-step process visualization:

- Step status (pending, in-progress, completed)
- Progress bar
- Completion celebration

## 🔧 Customization

### Adding New UI Components

1. **Create a new component** in `frontend/src/components/ui/`
2. **Define the tool** in `backend/src/server.js` tools array
3. **Add the component** to `DynamicUIComponent.jsx`

Example:

```javascript
// backend/src/server.js
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
