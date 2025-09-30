import { create } from 'zustand'
import type { Component, AnalysisResponse } from '@fusebox/types'
import { apiService } from '@/lib/api'

interface AnalysisState {
  // Current analysis
  currentAnalysis: AnalysisResponse | null
  isAnalyzing: boolean
  analysisError: string | null
  
  // Analysis history
  analysisHistory: AnalysisResponse[]
  
  // Selected component for details
  selectedComponentId: string | null
  
  // Actions
  analyzeImage: (file: File, imageId: string) => Promise<void>
  setSelectedComponent: (componentId: string | null) => void
  clearCurrentAnalysis: () => void
  clearError: () => void
  getComponentById: (id: string) => Component | null
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  currentAnalysis: null,
  isAnalyzing: false,
  analysisError: null,
  analysisHistory: [],
  selectedComponentId: null,

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
  },

  clearCurrentAnalysis: () => {
    set({
      currentAnalysis: null,
      selectedComponentId: null,
      analysisError: null
    })
  },

  clearError: () => {
    set({ analysisError: null })
  },

  getComponentById: (id: string) => {
    const state = get()
    return state.currentAnalysis?.components.find(comp => comp.id === id) || null
  }
}))