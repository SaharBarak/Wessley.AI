import { Router, Request, Response } from 'express'
import multer from 'multer'
import { OpenAIService } from '../services/openai'
import type { ApiResponse, AnalysisResponse } from '@fusebox/types'

const router = Router()
const openaiService = OpenAIService.getInstance()

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

/**
 * POST /api/analyze-image
 * Analyze uploaded vehicle image for electrical components
 */
router.post('/analyze-image', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      } as ApiResponse)
    }

    // Generate unique image ID
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Convert buffer to base64 data URL for OpenAI
    const base64Image = req.file.buffer.toString('base64')
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`

    console.log(`🔍 Analyzing image: ${req.file.originalname} (${req.file.size} bytes)`)

    // Analyze with OpenAI GPT-4V
    const analysisResult = await openaiService.analyzeVehicleImage(imageUrl, imageId)

    console.log(`✅ Analysis complete: ${analysisResult.components.length} components found`)

    res.json({
      success: true,
      data: analysisResult,
      message: `Found ${analysisResult.components.length} electrical components`
    } as ApiResponse<AnalysisResponse>)

  } catch (error: any) {
    console.error('Image analysis failed:', error)

    res.status(500).json({
      success: false,
      error: 'Image analysis failed',
      message: error.message || 'Unknown error occurred'
    } as ApiResponse)
  }
})

/**
 * GET /api/analysis/status
 * Get analysis service status
 */
router.get('/status', (req: Request, res: Response) => {
  const hasApiKey = !!process.env.OPENAI_API_KEY
  
  res.json({
    success: true,
    data: {
      service: 'analysis',
      openai_configured: hasApiKey,
      status: hasApiKey ? 'ready' : 'mock_mode',
      message: hasApiKey 
        ? 'OpenAI GPT-4V analysis ready' 
        : 'Running in mock mode - configure OPENAI_API_KEY for real analysis'
    }
  } as ApiResponse)
})

export default router