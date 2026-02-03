import Anthropic from '@anthropic-ai/sdk'
import { AbstractAgent } from '@ag-ui/client'
import {
  RunAgentInput,
  BaseEvent,
  EventType,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
} from '@ag-ui/core'
import { Observable } from 'rxjs'

export interface AnthropicAgentConfig {
  apiKey?: string
  model?: string
}

export class AnthropicAgent extends AbstractAgent {
  private anthropic: Anthropic
  private model: string

  constructor(config: AnthropicAgentConfig = {}) {
    super({})
    this.anthropic = new Anthropic({
      apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
    })
    this.model = config.model || 'claude-sonnet-4-20250514'
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((subscriber) => {
      ;(async () => {
        try {
          console.log('AnthropicAgent.run() called with input:', {
            threadId: input.threadId,
            runId: input.runId,
            messageCount: input.messages.length,
            toolCount: input.tools?.length || 0,
          })

          // Emit run started event
          subscriber.next({
            type: EventType.RUN_STARTED,
            threadId: input.threadId,
            runId: input.runId,
            timestamp: Date.now(),
          } as RunStartedEvent)

          // Convert AG-UI messages to Anthropic format (filter to only user/assistant)
          const messages = input.messages
            .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
            .map((msg) => ({
              role: msg.role as 'user' | 'assistant',
              content:
                typeof msg.content === 'string'
                  ? msg.content
                  : JSON.stringify(msg.content),
            }))

          console.log(
            'Filtered messages for Anthropic:',
            messages.length,
            JSON.stringify(messages, null, 2),
          )

          if (messages.length === 0) {
            throw new Error('No valid messages to send to Anthropic')
          }

          // Convert AG-UI tools to Anthropic format
          const tools =
            input.tools?.map((tool) => ({
              name: tool.name,
              description: tool.description,
              input_schema: tool.parameters,
            })) || []

          console.log(
            'Calling Anthropic with',
            messages.length,
            'messages and',
            tools.length,
            'tools',
          )

          // Stream from Anthropic
          const stream = await this.anthropic.messages.stream({
            model: this.model,
            max_tokens: 4096,
            messages,
            tools,
          })

          console.log('Anthropic stream created, starting to process events...')

          let currentMessageId: string | null = null
          let currentToolCallId: string | null = null

          // Process stream events
          for await (const event of stream) {
            console.log(
              'Anthropic event:',
              event.type,
              (event as any).content_block?.type ||
                (event as any).delta?.type ||
                '',
            )
            if (event.type === 'content_block_start') {
              if ((event as any).content_block.type === 'text') {
                // Start of text message
                currentMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                console.log(
                  'Emitting TEXT_MESSAGE_START with messageId:',
                  currentMessageId,
                )
                subscriber.next({
                  type: EventType.TEXT_MESSAGE_START,
                  messageId: currentMessageId,
                  role: 'assistant',
                  timestamp: Date.now(),
                } as TextMessageStartEvent)
              } else if (event.content_block.type === 'tool_use') {
                // Start of tool call
                currentToolCallId = event.content_block.id
                subscriber.next({
                  type: EventType.TOOL_CALL_START,
                  toolCallId: currentToolCallId,
                  toolCallName: event.content_block.name,
                  timestamp: Date.now(),
                } as ToolCallStartEvent)
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                // Text content delta
                console.log(
                  'Emitting TEXT_MESSAGE_CONTENT with delta:',
                  event.delta.text.substring(0, 20),
                )
                subscriber.next({
                  type: EventType.TEXT_MESSAGE_CONTENT,
                  messageId: currentMessageId!,
                  delta: event.delta.text,
                  timestamp: Date.now(),
                } as TextMessageContentEvent)
              } else if (event.delta.type === 'input_json_delta') {
                // Tool arguments delta
                subscriber.next({
                  type: EventType.TOOL_CALL_ARGS,
                  toolCallId: currentToolCallId!,
                  delta: event.delta.partial_json,
                  timestamp: Date.now(),
                } as ToolCallArgsEvent)
              }
            } else if (event.type === 'content_block_stop') {
              console.log(
                'content_block_stop - currentMessageId:',
                currentMessageId,
                'currentToolCallId:',
                currentToolCallId,
              )
              if (currentMessageId) {
                // End of text message
                console.log('Emitting TEXT_MESSAGE_END')
                subscriber.next({
                  type: EventType.TEXT_MESSAGE_END,
                  messageId: currentMessageId,
                  timestamp: Date.now(),
                } as TextMessageEndEvent)
                currentMessageId = null
              } else if (currentToolCallId) {
                // End of tool call
                console.log('Emitting TOOL_CALL_END')
                subscriber.next({
                  type: EventType.TOOL_CALL_END,
                  toolCallId: currentToolCallId,
                  timestamp: Date.now(),
                } as ToolCallEndEvent)
                currentToolCallId = null
              }
            }
          }

          console.log('Stream loop completed, getting final message...')
          const finalMessage = await stream.finalMessage()
          console.log('Final message received, emitting RUN_FINISHED')

          // Emit run finished event
          subscriber.next({
            type: EventType.RUN_FINISHED,
            threadId: input.threadId,
            runId: input.runId,
            result: finalMessage,
            timestamp: Date.now(),
          } as RunFinishedEvent)

          console.log('Completing subscription')
          subscriber.complete()
        } catch (error: any) {
          console.error('AnthropicAgent error:', error)
          subscriber.next({
            type: EventType.RUN_ERROR,
            message: error.message || 'Unknown error',
            code: error.code || 'UNKNOWN_ERROR',
            timestamp: Date.now(),
          } as RunErrorEvent)
          subscriber.error(error)
        }
      })()
    })
  }
}
