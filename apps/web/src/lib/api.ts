import type { ApiResponse, AnalysisResponse, ChatMessage } from '@fusebox/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

class ApiService {
  private static instance: ApiService

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService()
    }
    return ApiService.instance
  }

  /**
   * Analyze uploaded image for electrical components
   */
  async analyzeImage(file: File): Promise<AnalysisResponse> {
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis/analyze-image`, {
        method: 'POST',
        body: formData,
      })

      const result: ApiResponse<AnalysisResponse> = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }

      if (!result.data) {
        throw new Error('No analysis data received')
      }

      return result.data
    } catch (error: any) {
      console.error('Image analysis failed:', error)
      throw new Error(error.message || 'Failed to analyze image')
    }
  }

  /**
   * Get analysis service status
   */
  async getAnalysisStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis/status`)
      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to get status')
      }

      return result.data
    } catch (error: any) {
      console.error('Failed to get analysis status:', error)
      throw new Error(error.message || 'Failed to get analysis status')
    }
  }

  /**
   * Send chat message with context
   */
  async sendChatMessage(
    message: string, 
    context?: any, 
    history?: ChatMessage[]
  ): Promise<ChatMessage> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          history
        }),
      })

      const result: ApiResponse<ChatMessage> = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Chat request failed')
      }

      if (!result.data) {
        throw new Error('No chat response received')
      }

      return result.data
    } catch (error: any) {
      console.error('Chat message failed:', error)
      throw new Error(error.message || 'Failed to send chat message')
    }
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const result = await response.json()
      return result.status === 'ok'
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }
}

export const apiService = ApiService.getInstance()