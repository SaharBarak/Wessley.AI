import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Fusebox.ai API is running' })
})

// Placeholder routes for future implementation
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'API ready for vehicle electrical analysis',
    version: '0.1.0'
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Fusebox.ai API server running on port ${PORT}`)
})