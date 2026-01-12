import React, { useState, useRef, useEffect } from 'react'
import A2UIRenderer from './A2UIRenderer'
import type { Message, AGUIEvent, UISpecEvent } from '../types'

const API_URL = 'http://localhost:3001'

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/api/a2ui`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content:
              msg.content || (msg.uiSpec ? '[Generated UI Component]' : ''),
          })),
          threadId: crypto.randomUUID(),
          runId: crypto.randomUUID(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      let currentMessageId: string | null = null
      let currentMessageContent = ''

      if (reader) {
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
                  case 'text.message.start':
                    currentMessageId = eventData.messageId
                    currentMessageContent = ''
                    break

                  case 'text.message.content':
                    if (currentMessageId === eventData.messageId) {
                      currentMessageContent += eventData.content
                      setMessages((prev) => {
                        const existing = prev.find(
                          (m) => m.id === currentMessageId
                        )
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
                    }
                    break

                  case 'text.message.end':
                    currentMessageId = null
                    break

                  case 'ui.spec':
                    const uiSpecEvent = eventData as UISpecEvent
                    setMessages((prev) => [
                      ...prev,
                      {
                        id: uiSpecEvent.specId,
                        role: 'assistant',
                        uiSpec: uiSpecEvent.specification,
                        timestamp: new Date().toISOString(),
                      },
                    ])
                    break

                  case 'run.finished':
                    setIsLoading(false)
                    break

                  case 'run.error':
                    console.error('Run error:', eventData)
                    setIsLoading(false)
                    break
                }
              } catch (e) {
                console.error('Error parsing SSE event:', e)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            '❌ Error: Could not connect to the server. Please make sure the backend is running.',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className='flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      {/* Header */}
      <div className='bg-white border-b border-gray-200 px-6 py-4 shadow-sm'>
        <h1 className='text-2xl font-bold text-gray-800'>
          🎨 A2UI Chat - Declarative UI Demo
        </h1>
        <p className='text-sm text-gray-600 mt-1'>
          Agent creates custom UIs using declarative specifications
        </p>
      </div>

      {/* Messages Container */}
      <div className='flex-1 overflow-y-auto px-6 py-4'>
        {messages.length === 0 && (
          <div className='max-w-3xl mx-auto mt-20'>
            <div className='text-center'>
              <div className='text-6xl mb-4'>🎨</div>
              <h2 className='text-3xl font-bold text-gray-800 mb-4'>
                Welcome to A2UI Chat!
              </h2>
              <p className='text-gray-600 mb-8'>
                Ask me to create dashboards, cards, forms, or any UI component.
                <br />
                I'll build them dynamically using declarative specifications.
              </p>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-left'>
                <div className='bg-white p-4 rounded-xl shadow-md border border-gray-200'>
                  <div className='text-2xl mb-2'>📊</div>
                  <h3 className='font-semibold text-gray-800 mb-2'>
                    Try asking:
                  </h3>
                  <ul className='text-sm text-gray-600 space-y-1'>
                    <li>• "Create a sales dashboard"</li>
                    <li>• "Show me a product card"</li>
                    <li>• "Build a pricing table"</li>
                  </ul>
                </div>
                <div className='bg-white p-4 rounded-xl shadow-md border border-gray-200'>
                  <div className='text-2xl mb-2'>✨</div>
                  <h3 className='font-semibold text-gray-800 mb-2'>
                    Features:
                  </h3>
                  <ul className='text-sm text-gray-600 space-y-1'>
                    <li>• Unlimited flexibility</li>
                    <li>• Dynamic composition</li>
                    <li>• Rich UI components</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className='max-w-4xl mx-auto space-y-6'>
          {messages.map((message) => {
            if (message.role === 'user') {
              return (
                <div key={message.id} className='flex justify-end'>
                  <div className='bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-md max-w-2xl'>
                    <p className='whitespace-pre-wrap'>{message.content}</p>
                  </div>
                </div>
              )
            } else if (message.uiSpec) {
              return (
                <div key={message.id} className='flex justify-start'>
                  <div className='max-w-4xl w-full'>
                    <A2UIRenderer spec={message.uiSpec} />
                  </div>
                </div>
              )
            } else {
              return (
                <div key={message.id} className='flex justify-start'>
                  <div className='bg-white px-6 py-3 rounded-2xl shadow-md max-w-2xl border border-gray-200'>
                    <p className='whitespace-pre-wrap text-gray-800'>
                      {message.content}
                    </p>
                  </div>
                </div>
              )
            }
          })}
        </div>

        {isLoading && (
          <div className='flex justify-start max-w-4xl mx-auto mt-6'>
            <div className='bg-white px-6 py-3 rounded-2xl shadow-md border border-gray-200'>
              <div className='flex items-center gap-2'>
                <div className='animate-pulse flex gap-1'>
                  <div className='w-2 h-2 bg-gray-400 rounded-full'></div>
                  <div className='w-2 h-2 bg-gray-400 rounded-full animation-delay-200'></div>
                  <div className='w-2 h-2 bg-gray-400 rounded-full animation-delay-400'></div>
                </div>
                <span className='text-gray-600 text-sm'>Creating UI...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className='bg-white border-t border-gray-200 px-6 py-4 shadow-lg'>
        <div className='max-w-4xl mx-auto flex gap-4'>
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder='Ask me to create any UI component...'
            className='flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800'
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className='px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium shadow-md'
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface
