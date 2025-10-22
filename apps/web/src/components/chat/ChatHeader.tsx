'use client'

import { Bot } from 'lucide-react'

export function ChatHeader() {
  return (
    <div className="flex items-center gap-3 p-4 border-b bg-muted/20">
      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
        <Bot className="h-4 w-4 text-primary-foreground" />
      </div>
      <div>
        <h3 className="font-semibold text-sm">Wessley AI Assistant</h3>
        <p className="text-xs text-muted-foreground">Your automotive electrical companion</p>
      </div>
    </div>
  )
}