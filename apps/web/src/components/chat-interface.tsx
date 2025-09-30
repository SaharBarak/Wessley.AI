'use client'

import { useRef, useEffect, useState } from 'react'
import { Send, MessageCircle, X, Trash2, Bot, User } from 'lucide-react'
import { useChat } from 'ai/react'
import { useAnalysisStore } from '@/stores/analysis'
import type { Component } from '@fusebox/types'

interface ChatInterfaceProps {
  className?: string
}

export function ChatInterface({ className = "" }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { 
    currentAnalysis, 
    selectedComponentId 
  } = useAnalysisStore()

  // Use AI SDK's useChat hook
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading,
    setMessages 
  } = useChat({
    api: '/api/chat',
    body: {
      context: currentAnalysis ? {
        components: currentAnalysis.components,
        selectedComponentId: selectedComponentId || undefined,
        imageId: currentAnalysis.metadata?.imageId
      } : undefined
    }
  })

  // Chat UI state
  const [isOpen, setIsOpen] = useState(false)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Clear messages function
  const clearMessages = () => {
    setMessages([])
  }

  const getWelcomeMessage = () => {
    if (!currentAnalysis) {
      return "Hi! I'm your automotive electrical assistant. Upload and analyze a vehicle image first, then I can help you understand the electrical components and troubleshoot issues."
    }

    const componentCount = currentAnalysis.components.length
    const selectedComp = selectedComponentId 
      ? currentAnalysis.components.find(c => c.id === selectedComponentId)
      : null

    return `Hi! I can see you've analyzed ${componentCount} electrical components in your vehicle. ${
      selectedComp 
        ? `You're currently looking at the ${selectedComp.label}. ` 
        : ''
    }Ask me anything about these components, troubleshooting, or how they work together!`
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
        title="Open electrical assistant chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 w-96 h-[600px] bg-card border rounded-lg shadow-xl flex flex-col z-50 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Electrical Assistant</h3>
        </div>
        
        <div className="flex items-center space-x-1">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-start space-x-3">
            <Bot className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
            <div className="bg-secondary/30 rounded-lg p-3 max-w-[80%]">
              <p className="text-sm">{getWelcomeMessage()}</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-3 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div className="flex-shrink-0 mt-1">
              {message.role === 'user' ? (
                <User className="w-6 h-6 text-muted-foreground" />
              ) : (
                <Bot className="w-6 h-6 text-primary" />
              )}
            </div>
            
            <div
              className={`rounded-lg p-3 max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/30'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-75 mt-1">
                {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ''}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <Bot className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
            <div className="bg-secondary/30 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}


        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about electrical components..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            disabled={isLoading}
          />
          
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {currentAnalysis && (
          <p className="text-xs text-muted-foreground mt-2">
            Context: {currentAnalysis.components.length} components analyzed
            {selectedComponentId && (
              <span className="ml-1">
                • Selected: {currentAnalysis.components.find(c => c.id === selectedComponentId)?.label}
              </span>
            )}
          </p>
        )}
      </form>
    </div>
  )
}