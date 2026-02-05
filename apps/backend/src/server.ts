import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { handleAGUIRequest } from './handlers/agui.js'
import { handleA2UIRequest } from './handlers/a2ui.js'

// Load .env from the correct location
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env') })

// Verify API key is loaded
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️  ANTHROPIC_API_KEY not found in environment')
} else {
  console.log('✅ ANTHROPIC_API_KEY loaded')
}

const app = express()
const port = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Disable all buffering for SSE to work properly
app.set('x-powered-by', false)
app.set('etag', false)

// Disable compression and buffering globally
app.use((req, res, next) => {
  res.setHeader('X-Accel-Buffering', 'no')
  // Disable socket timeout for SSE connections
  req.socket.setTimeout(0)
  res.socket?.setTimeout(0)
  next()
})

// AGUI Endpoint - Tool-Based UI with Pre-defined Components (using AG-UI Protocol SDK)
app.post('/api/agui', async (req: Request, res: Response) => {
  await handleAGUIRequest(req.body, res, req)
})

// A2UI Endpoint - Declarative UI Specification approach (now using Anthropic Haiku)
app.post('/api/a2ui', async (req: Request, res: Response) => {
  await handleA2UIRequest(req.body, res, req)
})

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => {
  console.log(`🚀 Backend server running on http://localhost:${port}`)
  console.log(
    `📊 AGUI endpoint (tool-based): http://localhost:${port}/api/agui`,
  )
  console.log(
    `🎨 A2UI endpoint (declarative): http://localhost:${port}/api/a2ui`,
  )
})
