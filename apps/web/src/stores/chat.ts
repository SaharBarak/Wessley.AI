import { create } from 'zustand'
import type { ChatMessage, Component } from '@wessley/types'
import { apiService } from '@/lib/api'

interface ChatState {
  // Messages
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  
  // Chat context
  isOpen: boolean
  
  // Actions
  sendMessage: (content: string, context?: ChatContext) => Promise<void>
  clearMessages: () => void
  setIsOpen: (open: boolean) => void
  clearError: () => void
}

interface ChatContext {
  components: Component[]
  selectedComponentId?: string
  imageId?: string
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  isOpen: false,

  sendMessage: async (content: string, context?: ChatContext) => {
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }

    // Add user message and set loading
    set(state => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null
    }))

    try {
      const response = await fetch('/api/chat/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          context,
          history: get().messages.slice(-10) // Send last 10 messages for context
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Chat request failed')
      }

      // Add assistant response
      set(state => ({
        messages: [...state.messages, result.data],
        isLoading: false
      }))

    } catch (error: any) {
      console.error('Chat failed:', error)
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        timestamp: new Date().toISOString()
      }

      set(state => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
        error: error.message || 'Chat failed'
      }))
    }
  },

  clearMessages: () => {
    set({
      messages: [],
      error: null
    })
  },

  setIsOpen: (open: boolean) => {
    set({ isOpen: open })
  },

  clearError: () => {
    set({ error: null })
  }
}))