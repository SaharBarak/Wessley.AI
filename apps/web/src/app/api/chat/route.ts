import { openai } from '@ai-sdk/openai'
import { streamText, convertToCoreMessages } from 'ai'
import type { Component } from '@fusebox/types'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()

    // Build system prompt with electrical context
    const systemPrompt = buildElectricalSystemPrompt(context)

    const result = await streamText({
      model: openai('gpt-4-turbo'),
      system: systemPrompt,
      messages: convertToCoreMessages(messages),
      maxTokens: 500,
      temperature: 0.1,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    
    // Return mock response if OpenAI fails
    return new Response(
      JSON.stringify({ 
        error: 'Chat temporarily unavailable. Using mock response.',
        response: getMockResponse(req)
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

function buildElectricalSystemPrompt(context?: any): string {
  let prompt = `You are an expert automotive electrician assistant helping users understand their vehicle's electrical system. 

Key guidelines:
- Provide technical but accessible explanations
- Reference specific components when relevant  
- Suggest troubleshooting steps when appropriate
- Ask clarifying questions if needed
- Keep responses concise but informative
- Focus on electrical safety and proper procedures`

  // Add component context if available
  if (context?.components && context.components.length > 0) {
    prompt += `\n\n## Analyzed Components in Vehicle:`
    context.components.forEach((comp: Component) => {
      prompt += `\n- ${comp.label} (${comp.type || 'component'})`
      if (comp.wires && comp.wires.length > 0) {
        prompt += `\n  • Connections: ${comp.wires.map((w: any) => w.to).join(', ')}`
      }
      if (comp.notes) {
        prompt += `\n  • Notes: ${comp.notes}`
      }
    })
  }

  // Add selected component context
  if (context?.selectedComponentId && context?.components) {
    const selectedComp = context.components.find((c: Component) => c.id === context.selectedComponentId)
    if (selectedComp) {
      prompt += `\n\n## Currently Selected Component:`
      prompt += `\n${selectedComp.label} - ${selectedComp.notes || 'No additional notes'}`
      if (selectedComp.wires && selectedComp.wires.length > 0) {
        prompt += `\nWires: ${selectedComp.wires.map((w: any) => `${w.gauge || ''} ${w.color || ''} to ${w.to}`).join(', ')}`
      }
    }
  }

  return prompt
}

function getMockResponse(req: Request): string {
  // Simple mock responses for when OpenAI is unavailable
  const mockResponses = [
    "I can help you understand your vehicle's electrical system. What specific component or issue would you like to know about?",
    "For electrical troubleshooting, start by checking fuses, then verify battery voltage, and test connections for continuity.",
    "That component is part of your vehicle's electrical system. Could you tell me more about what specific issue you're experiencing?",
    "Safety first when working with vehicle electrical systems. Always disconnect the battery before making any modifications."
  ]
  
  return mockResponses[Math.floor(Math.random() * mockResponses.length)]
}