'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { ChatHeader } from './ChatHeader'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatUIProps {
  className?: string
}

export function ChatUI({ className = '' }: ChatUIProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'What kind of car are we working on? You can try commands like /focus BATTERY01 or /view left.',
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollButton, setShowScrollButton] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handleScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isNearBottom)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Simulate assistant response
    setTimeout(() => {
      let response = ''
      
      if (content.startsWith('/')) {
        response = `Command received: ${content}. This will be processed by the scene system.`
      } else {
        response = 'I understand. How can I help you with your car\'s electrical system?'
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className={`relative flex h-full flex-col items-center ${className}`}>
      <ChatHeader />
      
      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <div className="absolute right-4 top-14 z-10">
          <Button
            onClick={scrollToBottom}
            size="sm"
            variant="secondary"
            className="rounded-full h-10 w-10 p-0 shadow-lg"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Messages Area */}
      <div 
        className="flex size-full flex-col overflow-auto"
        onScroll={handleScroll}
        ref={scrollAreaRef}
      >
        <div className="flex-1 p-4">
          <ChatMessages 
            messages={messages} 
            isLoading={isLoading}
          />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="relative w-full min-w-[300px] items-end px-4 pb-4 pt-2">
        <ChatInput 
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}