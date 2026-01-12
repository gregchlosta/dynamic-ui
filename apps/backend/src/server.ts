import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import { AgentRequest } from './types.js'
import { handleAGUIRequest } from './handlers/agui.js'
import { handleA2UIRequest } from './handlers/a2ui.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// AGUI Endpoint - Tool-Based UI with Pre-defined Components
app.post(
  '/api/agui',
  async (req: Request<{}, {}, AgentRequest>, res: Response) => {
    await handleAGUIRequest(openai, req.body, res)
  }
)

// A2UI Endpoint - Declarative UI Specification approach
app.post(
  '/api/a2ui',
  async (req: Request<{}, {}, AgentRequest>, res: Response) => {
    await handleA2UIRequest(openai, req.body, res)
  }
)

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => {
  console.log(`🚀 Backend server running on http://localhost:${port}`)
  console.log(
    `📊 AGUI endpoint (tool-based): http://localhost:${port}/api/agui`
  )
  console.log(
    `🎨 A2UI endpoint (declarative): http://localhost:${port}/api/a2ui`
  )
})
