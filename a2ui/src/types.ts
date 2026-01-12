// A2UI Type Definitions - Declarative UI Specification

export interface UISpecification {
  version: '1.0'
  component: string
  props?: Record<string, any>
  children?: UISpecification[]
  layout?: 'vertical' | 'horizontal' | 'grid'
  style?: Record<string, any>
}

export interface UISpecEvent {
  type: 'ui.spec'
  specId: string
  specification: UISpecification
  parentMessageId?: string
}

export interface TextMessageStartEvent {
  type: 'text.message.start'
  messageId: string
}

export interface TextMessageContentEvent {
  type: 'text.message.content'
  messageId: string
  content: string
}

export interface TextMessageEndEvent {
  type: 'text.message.end'
  messageId: string
}

export interface RunStartedEvent {
  type: 'run.started'
  runId: string
}

export interface RunFinishedEvent {
  type: 'run.finished'
  runId: string
}

export interface RunErrorEvent {
  type: 'run.error'
  runId: string
  error: string
}

export type AGUIEvent =
  | RunStartedEvent
  | RunFinishedEvent
  | RunErrorEvent
  | TextMessageStartEvent
  | TextMessageContentEvent
  | TextMessageEndEvent
  | UISpecEvent

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content?: string
  uiSpec?: UISpecification
  timestamp: string
}

export interface AgentRequest {
  message: string
}
