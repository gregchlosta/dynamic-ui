import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Message from './Message'
import DynamicUIComponent from './DynamicUIComponent'
import type { Message as MessageType, AGUIEvent, ToolCallState } from '../types'

const ChatInterface = () => {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [input, setInput] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: MessageType = {
      id: uuidv4(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/agui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          threadId: uuidv4(),
          runId: uuidv4(),
        }),
      })

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let currentMessageId: string | null = null
      let currentMessageContent = ''
      let currentToolCall: ToolCallState | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6)) as AGUIEvent

              switch (eventData.type) {
                case 'text_message.start':
                  currentMessageId = eventData.messageId
                  currentMessageContent = ''
                  break

                case 'text_message.content':
                  currentMessageContent += eventData.delta
                  setMessages((prev) => {
                    const existing = prev.find((m) => m.id === currentMessageId)
                    if (existing) {
                      return prev.map((m) =>
                        m.id === currentMessageId
                          ? { ...m, content: currentMessageContent }
                          : m
                      )
                    } else {
                      return [
                        ...prev,
                        {
                          id: currentMessageId!,
                          role: 'assistant',
                          content: currentMessageContent,
                          timestamp: new Date().toISOString(),
                        },
                      ]
                    }
                  })
                  break

                case 'tool_call.start':
                  currentToolCall = {
                    id: eventData.toolCallId,
                    name: eventData.toolCallName,
                    args: '',
                  }
                  break

                case 'tool_call.args':
                  if (currentToolCall) {
                    currentToolCall.args += eventData.delta
                  }
                  break

                case 'tool_call.end':
                  if (currentToolCall) {
                    // Add tool call UI component
                    try {
                      const parsedArgs = JSON.parse(currentToolCall.args)
                      // Capture the tool call data before setting state
                      const toolCallData: MessageType = {
                        id: currentToolCall.id,
                        role: 'tool',
                        toolName: currentToolCall.name,
                        toolArgs: parsedArgs,
                        timestamp: new Date().toISOString(),
                      }
                      setMessages((prev) => [...prev, toolCallData])
                    } catch (error) {
                      console.error(
                        'Error parsing tool arguments:',
                        error,
                        currentToolCall?.args
                      )
                    }
                    currentToolCall = null
                  }
                  break

                case 'run.finished':
                  setIsLoading(false)
                  break

                case 'run.error':
                  console.error('Run error:', eventData)
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: uuidv4(),
                      role: 'assistant',
                      content: `Error: ${eventData.message}`,
                      timestamp: new Date().toISOString(),
                      isError: true,
                    },
                  ])
                  setIsLoading(false)
                  break
              }
            } catch (error) {
              console.error('Error parsing SSE event:', error, line)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.',
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ])
      setIsLoading(false)
    }
  }

  const suggestions = [
    '📊 Show me a sales chart',
    "🌤️ What's the weather like?",
    '✅ Create a task list',
    '📈 Display revenue growth data',
    '🎯 Show project progress',
    '🖼️ Display a card grid',
  ]

  return (
    <div className='flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-xl overflow-hidden'>
      {/* Messages Area */}
      <div className='flex-1 overflow-y-auto p-6 space-y-4'>
        {messages.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-center'>
            <div className='text-6xl mb-4'>💬</div>
            <h2 className='text-2xl font-bold text-gray-800 mb-2'>
              Welcome to Dynamic UI Chat!
            </h2>
            <p className='text-gray-600 mb-8 max-w-md'>
              Ask me to create visualizations and I'll generate beautiful UI
              components for you in real-time.
            </p>

            <div className='grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl'>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() =>
                    setInput(suggestion.replace(/[^\w\s?]/g, '').trim())
                  }
                  className='px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg text-sm font-medium text-gray-700 transition-all hover:shadow-md'
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) =>
              message.role === 'tool' ? (
                <DynamicUIComponent
                  key={message.id}
                  toolName={message.toolName!}
                  toolArgs={message.toolArgs!}
                />
              ) : (
                <Message key={message.id} message={message} />
              )
            )}
            {isLoading && (
              <div className='flex items-center space-x-2 text-gray-500'>
                <div className='animate-bounce'>●</div>
                <div className='animate-bounce delay-100'>●</div>
                <div className='animate-bounce delay-200'>●</div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className='border-t border-gray-200 p-4 bg-gray-50'>
        <form onSubmit={sendMessage} className='flex gap-2'>
          <input
            type='text'
            value={input}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setInput(e.target.value)
            }
            placeholder='Ask me to visualize something...'
            className='flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            disabled={isLoading}
          />
          <button
            type='submit'
            disabled={isLoading || !input.trim()}
            className='px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatInterface
