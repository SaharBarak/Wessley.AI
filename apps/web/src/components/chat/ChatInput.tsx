'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { TextareaAutosize } from '@/components/ui/textarea-autosize'
import { Send, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return
    
    onSendMessage(inputValue)
    setInputValue('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isTyping && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const handleStop = () => {
    // In a real implementation, this would stop the API call
    console.log('Stop generation requested')
  }

  return (
    <div className="relative flex w-full items-end space-x-2">
      <div className="relative flex-1">
        <TextareaAutosize
          textareaRef={inputRef}
          className={cn(
            "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex max-h-[300px] min-h-[44px] w-full resize-none rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          )}
          placeholder="Ask about your car's electrical system or try /focus BATTERY01..."
          value={inputValue}
          onValueChange={setInputValue}
          minRows={1}
          maxRows={18}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsTyping(true)}
          onCompositionEnd={() => setIsTyping(false)}
        />
      </div>
      
      <div className="flex">
        {isLoading ? (
          <Button
            onClick={handleStop}
            size="sm"
            variant="outline"
            className="flex h-[44px] w-[44px] items-center justify-center p-0"
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            size="sm"
            className="flex h-[44px] w-[44px] items-center justify-center p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}