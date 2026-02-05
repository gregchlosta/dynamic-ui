// Re-export AG-UI Protocol types from the official SDK
export { EventType } from '@ag-ui/core'
export type {
  BaseEvent,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
} from '@ag-ui/core'

// Message Types for UI state
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content?: string
  timestamp: string
  isError?: boolean
  toolName?: string
  toolArgs?: ToolArgs
}

// Tool Arguments Types
export interface ChartData {
  name: string
  value: number
}

export interface ShowChartArgs {
  title: string
  type: 'bar' | 'line' | 'area' | 'pie'
  data: ChartData[]
}

export interface ForecastDay {
  day: string
  high: number
  low: number
  condition: string
}

export interface ShowWeatherCardArgs {
  city: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  forecast: ForecastDay[]
}

export interface Task {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
}

export interface ShowTaskListArgs {
  title: string
  tasks: Task[]
}

export interface Card {
  title: string
  description: string
  image: string
  tags: string[]
}

export interface ShowCardGridArgs {
  title: string
  cards: Card[]
}

export interface Step {
  name: string
  status: 'pending' | 'in-progress' | 'completed'
  description: string
}

export interface ShowProgressTrackerArgs {
  title: string
  steps: Step[]
}

export type ToolArgs =
  | ShowChartArgs
  | ShowWeatherCardArgs
  | ShowTaskListArgs
  | ShowCardGridArgs
  | ShowProgressTrackerArgs

// Tool Call State
export interface ToolCallState {
  id: string
  name: string
  args: string
}
