import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import analysisRoutes from './routes/analysis'
import chatRoutes from './routes/chat'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fusebox.ai API is running' })
})

// API routes
app.use('/api/analysis', analysisRoutes)
app.use('/api/chat', chatRoutes)

// General API status
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'API ready for vehicle electrical analysis',
    version: '0.1.0',
    services: {
      analysis: '/api/analysis',
      chat: '/api/chat',
      health: '/health'
    }
  })
})

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', error)
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large',
      message: 'Image must be smaller than 10MB'
    })
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message || 'Unknown error occurred'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Fusebox.ai API server running on port ${PORT}`)
  console.log(`📊 Analysis API: http://localhost:${PORT}/api/analysis`)
  console.log(`🔧 OpenAI configured: ${!!process.env.OPENAI_API_KEY}`)
})