import { useState, useRef, useEffect } from 'react'
import ChatInterface from './components/ChatInterface'
import './App.css'

function App() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'>
      <header className='bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 py-4'>
          <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
            ✨ Dynamic UI Chat
          </h1>
          <p className='text-sm text-gray-600 mt-1'>
            Ask me to visualize anything - charts, weather, tasks, and more!
          </p>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 py-6'>
        <ChatInterface />
      </main>
    </div>
  )
}

export default App
