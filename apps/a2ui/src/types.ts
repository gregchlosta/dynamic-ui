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
  type: 'TEXT_MESSAGE_START'
  messageId: string
  role: string
}

export interface TextMessageContentEvent {
  type: 'TEXT_MESSAGE_CONTENT'
  messageId: string
  delta: string
}

export interface TextMessageEndEvent {
  type: 'TEXT_MESSAGE_END'
  messageId: string
}

export interface RunStartedEvent {
  type: 'RUN_STARTED'
  threadId: string
  runId: string
}

export interface RunFinishedEvent {
  type: 'RUN_FINISHED'
  threadId: string
  runId: string
}

export interface RunErrorEvent {
  type: 'RUN_ERROR'
  message: string
  code: string
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
