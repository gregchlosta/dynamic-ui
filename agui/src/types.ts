// Message Types
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content?: string
  timestamp: string
  isError?: boolean
  toolName?: string
  toolArgs?: ToolArgs
}

// AG-UI Event Types
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

export interface RunStartedEvent {
  type: EventType.RUN_STARTED
  threadId: string
  runId: string
}

export interface RunFinishedEvent {
  type: EventType.RUN_FINISHED
  threadId: string
  runId: string
}

export interface RunErrorEvent {
  type: EventType.RUN_ERROR
  message: string
  code: string
}

export interface TextMessageStartEvent {
  type: EventType.TEXT_MESSAGE_START
  messageId: string
  role: 'assistant' | 'user'
}

export interface TextMessageContentEvent {
  type: EventType.TEXT_MESSAGE_CONTENT
  messageId: string
  delta: string
}

export interface TextMessageEndEvent {
  type: EventType.TEXT_MESSAGE_END
  messageId: string
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

export type AGUIEvent =
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | ToolCallStartEvent
  | ToolCallArgsEvent
  | ToolCallEndEvent

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
