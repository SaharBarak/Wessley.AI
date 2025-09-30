import { create } from 'zustand'
import type { Component, AnalysisResponse, MermaidDiagram } from '@fusebox/types'
import { apiService } from '@/lib/api'
import { MermaidService } from '@/lib/mermaid'

interface AnalysisState {
  // Current analysis
  currentAnalysis: AnalysisResponse | null
  isAnalyzing: boolean
  analysisError: string | null
  
  // Analysis history
  analysisHistory: AnalysisResponse[]
  
  // Selected component for details
  selectedComponentId: string | null
  
  // Mermaid diagram
  currentDiagram: MermaidDiagram | null
  
  // Actions
  analyzeImage: (file: File, imageId: string) => Promise<void>
  setSelectedComponent: (componentId: string | null) => void
  clearCurrentAnalysis: () => void
  clearError: () => void
  getComponentById: (id: string) => Component | null
  generateDiagram: () => void
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentAnalysis: null,
  isAnalyzing: false,
  analysisError: null,
  analysisHistory: [],
  selectedComponentId: null,
  currentDiagram: null,

  analyzeImage: async (file: File, imageId: string) => {
    set({ 
      isAnalyzing: true, 
      analysisError: null,
      currentAnalysis: null 
    })

    try {
      console.log(`🔍 Starting analysis for: ${file.name}`)
      
      const result = await apiService.analyzeImage(file)
      
      console.log(`✅ Analysis complete: ${result.components.length} components found`)
      
      set(state => ({
        currentAnalysis: result,
        isAnalyzing: false,
        analysisHistory: [result, ...state.analysisHistory.slice(0, 9)] // Keep last 10
      }))
      
      // Auto-generate diagram after successful analysis
      get().generateDiagram()
      
    } catch (error: any) {
      console.error('Analysis failed:', error)
      
      set({
        isAnalyzing: false,
        analysisError: error.message || 'Analysis failed',
        currentAnalysis: null
      })
    }
  },

  setSelectedComponent: (componentId: string | null) => {
    set({ selectedComponentId: componentId })
    
    // Regenerate diagram with highlighting if we have an analysis
    const state = get()
    if (state.currentAnalysis) {
      const mermaidService = MermaidService.getInstance()
      const diagram = mermaidService.generateWithHighlight(
        state.currentAnalysis.components,
        componentId || undefined
      )
      set({ currentDiagram: diagram })
    }
  },

  clearCurrentAnalysis: () => {
    set({
      currentAnalysis: null,
      selectedComponentId: null,
      analysisError: null,
      currentDiagram: null
    })
  },

  clearError: () => {
    set({ analysisError: null })
  },

  getComponentById: (id: string) => {
    const state = get()
    return state.currentAnalysis?.components.find(comp => comp.id === id) || null
  },

  generateDiagram: () => {
    const state = get()
    if (!state.currentAnalysis?.components) return
    
    const mermaidService = MermaidService.getInstance()
    const diagram = mermaidService.generateDiagram(state.currentAnalysis.components)
    
    set({ currentDiagram: diagram })
  }
}))