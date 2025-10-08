import OpenAI from 'openai'
import type { Component, AnalysisResponse } from '@wessley/types'

export class OpenAIService {
  private static instance: OpenAIService
  private openai: OpenAI | null = null
  
  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService()
    }
    return OpenAIService.instance
  }

  private constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️  OPENAI_API_KEY not found. Analysis will use mock data.')
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
    }
  }

  /**
   * Analyze vehicle image for electrical components using GPT-4V
   */
  async analyzeVehicleImage(imageUrl: string, imageId: string): Promise<AnalysisResponse> {
    try {
      if (!this.openai) {
        // Return mock data when API key is not configured
        return this.getMockAnalysis(imageId)
      }

      const prompt = this.buildAnalysisPrompt()
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1, // Low temperature for consistent technical analysis
      })

      const analysisText = response.choices[0]?.message?.content || ''
      
      // Parse the JSON response
      const components = this.parseAnalysisResponse(analysisText)
      
      return {
        components,
        metadata: {
          imageId,
          analysisTimestamp: new Date().toISOString(),
          confidence: this.calculateConfidence(analysisText)
        }
      }
      
    } catch (error) {
      console.error('OpenAI analysis failed:', error)
      
      // Fallback to mock data on error
      return this.getMockAnalysis(imageId)
    }
  }

  /**
   * Build the GPT-4V prompt for electrical component analysis
   */
  private buildAnalysisPrompt(): string {
    return `You are an expert automotive electrician analyzing a vehicle image. 

Please identify all visible electrical components and their connections. Focus on:
1. Fuses, relays, sensors, terminals, connectors, battery, starter, alternator
2. Wire connections between components (estimate gauge in mm² and color if visible)
3. Component labels, ratings, and positions

Return your analysis as a JSON object with this exact structure:
{
  "components": [
    {
      "id": "unique_component_id",
      "label": "Component Name (e.g., 'Main 60A Fuse')",
      "type": "fuse|relay|sensor|terminal|connector|battery|starter|other",
      "wires": [
        {
          "to": "destination_component_id",
          "gauge": "wire_gauge_in_mm²",
          "color": "wire_color",
          "notes": "optional_notes"
        }
      ],
      "notes": "component_description_and_location",
      "position": {
        "x": 100,
        "y": 150
      }
    }
  ]
}

Guidelines:
- Use descriptive but concise component IDs (snake_case)
- Include wire gauge estimates (common: 0.5mm², 1mm², 1.5mm², 2.5mm², 4mm², 6mm²)
- Note component locations relative to visible landmarks
- Only include connections you can clearly see
- Provide realistic position coordinates for diagram layout

Return ONLY the JSON object, no additional text.`
  }

  /**
   * Parse GPT-4V response and extract components
   */
  private parseAnalysisResponse(responseText: string): Component[] {
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      if (!parsed.components || !Array.isArray(parsed.components)) {
        throw new Error('Invalid components structure')
      }

      // Validate and sanitize components
      return parsed.components.map((comp: any, index: number) => ({
        id: comp.id || `component_${index}`,
        label: comp.label || `Component ${index + 1}`,
        type: comp.type || 'other',
        wires: Array.isArray(comp.wires) ? comp.wires.map((wire: any) => ({
          to: wire.to || '',
          gauge: wire.gauge || '',
          color: wire.color || '',
          notes: wire.notes || ''
        })) : [],
        notes: comp.notes || '',
        position: comp.position || { x: 100 + (index * 50), y: 100 + (index * 30) }
      })) as Component[]
      
    } catch (error) {
      console.error('Failed to parse analysis response:', error)
      return this.getMockComponents()
    }
  }

  /**
   * Calculate confidence score based on analysis response
   */
  private calculateConfidence(responseText: string): number {
    // Simple heuristic based on response characteristics
    let confidence = 0.5
    
    if (responseText.includes('fuse')) confidence += 0.1
    if (responseText.includes('relay')) confidence += 0.1
    if (responseText.includes('wire')) confidence += 0.1
    if (responseText.includes('gauge')) confidence += 0.1
    if (responseText.includes('mm²')) confidence += 0.1
    if (responseText.length > 500) confidence += 0.1
    
    return Math.min(confidence, 1.0)
  }

  /**
   * Get mock analysis for testing/fallback
   */
  private getMockAnalysis(imageId: string): AnalysisResponse {
    return {
      components: this.getMockComponents(),
      metadata: {
        imageId,
        analysisTimestamp: new Date().toISOString(),
        confidence: 0.85
      }
    }
  }

  /**
   * Mock components for testing
   */
  private getMockComponents(): Component[] {
    return [
      {
        id: 'main_fuse_60a',
        label: 'Main 60A Fuse',
        type: 'fuse',
        wires: [
          { to: 'starter_relay', gauge: '6mm²', color: 'red', notes: 'Main power feed' },
          { to: 'alternator', gauge: '4mm²', color: 'red' }
        ],
        notes: 'Located in main fuse box, near battery positive terminal',
        position: { x: 120, y: 80 }
      },
      {
        id: 'starter_relay',
        label: 'Starter Relay',
        type: 'relay',
        wires: [
          { to: 'ignition_switch', gauge: '1.5mm²', color: 'yellow' },
          { to: 'starter_motor', gauge: '6mm²', color: 'purple' },
          { to: 'ground_point', gauge: '1.5mm²', color: 'black' }
        ],
        notes: 'Controls starter motor engagement, 12V relay',
        position: { x: 220, y: 120 }
      },
      {
        id: 'battery_12v',
        label: '12V Lead Acid Battery',
        type: 'battery',
        wires: [
          { to: 'main_fuse_60a', gauge: '6mm²', color: 'red', notes: 'Positive terminal' },
          { to: 'ground_point', gauge: '6mm²', color: 'black', notes: 'Negative terminal' }
        ],
        notes: 'Primary power source, 12V 70Ah capacity',
        position: { x: 50, y: 150 }
      },
      {
        id: 'alternator',
        label: 'Alternator 14V',
        type: 'other',
        wires: [
          { to: 'battery_12v', gauge: '4mm²', color: 'red' },
          { to: 'voltage_regulator', gauge: '1mm²', color: 'blue' },
          { to: 'ground_point', gauge: '2.5mm²', color: 'black' }
        ],
        notes: 'Charges battery and powers electrical system when running',
        position: { x: 320, y: 100 }
      },
      {
        id: 'ignition_switch',
        label: 'Ignition Switch',
        type: 'other',
        wires: [
          { to: 'starter_relay', gauge: '1.5mm²', color: 'yellow' },
          { to: 'ignition_coil', gauge: '1.5mm²', color: 'green' }
        ],
        notes: 'Key-operated switch, multiple positions',
        position: { x: 180, y: 200 }
      }
    ]
  }
}