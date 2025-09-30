import { Router, Request, Response } from 'express'
import { OpenAIService } from '../services/openai'
import type { ApiResponse, ChatMessage, Component } from '@fusebox/types'

const router = Router()
const openaiService = OpenAIService.getInstance()

interface ChatRequest {
  message: string
  context?: {
    components: Component[]
    selectedComponentId?: string
    imageId?: string
  }
  history?: ChatMessage[]
}

/**
 * POST /api/chat/ask
 * Ask questions about analyzed electrical components with context
 */
router.post('/ask', async (req: Request, res: Response) => {
  try {
    const { message, context, history }: ChatRequest = req.body

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      } as ApiResponse)
    }

    console.log(`💬 Chat question: "${message}"`)
    
    // Build context-enriched prompt
    const enrichedPrompt = buildContextualPrompt(message, context, history)
    
    // Get response from OpenAI (or mock)
    const response = await getChatResponse(enrichedPrompt)
    
    // Create response message
    const responseMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    }

    console.log(`✅ Chat response generated (${response.length} chars)`)

    res.json({
      success: true,
      data: responseMessage,
      message: 'Response generated successfully'
    } as ApiResponse<ChatMessage>)

  } catch (error: any) {
    console.error('Chat failed:', error)

    res.status(500).json({
      success: false,
      error: 'Chat processing failed',
      message: error.message || 'Unknown error occurred'
    } as ApiResponse)
  }
})

/**
 * Build context-enriched prompt for chat
 */
function buildContextualPrompt(
  userMessage: string, 
  context?: ChatRequest['context'],
  history?: ChatMessage[]
): string {
  const sections = []

  // System role
  sections.push(`You are an expert automotive electrician assistant helping users understand their vehicle's electrical system. You have analyzed their vehicle image and identified electrical components.

Key guidelines:
- Provide technical but accessible explanations
- Reference specific components when relevant
- Suggest troubleshooting steps when appropriate
- Ask clarifying questions if needed
- Keep responses concise but informative`)

  // Component context
  if (context?.components && context.components.length > 0) {
    sections.push(`\n## Analyzed Components:`)
    context.components.forEach(comp => {
      sections.push(`- ${comp.label} (${comp.type || 'component'})`)
      if (comp.wires && comp.wires.length > 0) {
        sections.push(`  • Connections: ${comp.wires.map(w => w.to).join(', ')}`)
      }
      if (comp.notes) {
        sections.push(`  • Notes: ${comp.notes}`)
      }
    })
  }

  // Selected component focus
  if (context?.selectedComponentId && context.components) {
    const selectedComp = context.components.find(c => c.id === context.selectedComponentId)
    if (selectedComp) {
      sections.push(`\n## Currently Selected Component:`)
      sections.push(`${selectedComp.label} - ${selectedComp.notes || 'No additional notes'}`)
      if (selectedComp.wires && selectedComp.wires.length > 0) {
        sections.push(`Wires: ${selectedComp.wires.map(w => `${w.gauge || ''} ${w.color || ''} to ${w.to}`).join(', ')}`)
      }
    }
  }

  // Recent conversation history
  if (history && history.length > 0) {
    sections.push(`\n## Recent Conversation:`)
    history.slice(-4).forEach(msg => {
      sections.push(`${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    })
  }

  // User question
  sections.push(`\n## User Question:`)
  sections.push(userMessage)

  sections.push(`\n## Response:`)

  return sections.join('\n')
}

/**
 * Get chat response from OpenAI or mock
 */
async function getChatResponse(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    // Mock responses for testing
    return getMockChatResponse(prompt)
  }

  try {
    const openai = (await import('openai')).default
    const client = new openai({
      apiKey: process.env.OPENAI_API_KEY
    })

    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    })

    return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

  } catch (error) {
    console.error('OpenAI chat failed:', error)
    return getMockChatResponse(prompt)
  }
}

/**
 * Mock chat responses for testing
 */
function getMockChatResponse(prompt: string): string {
  const message = prompt.toLowerCase()
  
  if (message.includes('fuse')) {
    return "Fuses protect electrical circuits from overcurrent. If a fuse blows, it indicates excessive current flow. Check the fuse rating and replace with the same amperage. Common causes include short circuits or overloaded circuits."
  }
  
  if (message.includes('relay')) {
    return "Relays are electromagnetic switches that control high-current circuits. They typically have 4-5 pins: coil inputs (85, 86) and switch contacts (30, 87, 87a). If a relay fails, you might hear clicking or experience intermittent operation."
  }
  
  if (message.includes('battery')) {
    return "The battery provides electrical power when the engine is off and supplements the alternator when running. Check voltage (should be ~12.6V at rest, ~14.4V when running) and ensure terminals are clean and tight."
  }
  
  if (message.includes('wire') || message.includes('connection')) {
    return "Wire connections should be clean, tight, and corrosion-free. Wire gauge determines current capacity - thicker wires (lower gauge numbers) carry more current. Color coding helps identify circuit functions."
  }
  
  if (message.includes('troubleshoot') || message.includes('problem')) {
    return "For electrical troubleshooting: 1) Check fuses first, 2) Verify battery voltage, 3) Test connections for continuity, 4) Look for signs of corrosion or damage, 5) Use a multimeter to trace circuits systematically."
  }
  
  return "I can help you understand your vehicle's electrical system. Ask me about specific components, troubleshooting steps, or how different parts work together. What would you like to know?"
}

export default router