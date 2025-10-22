'use client'

import { ChatUI } from "@/components/chat/chat-ui"
import { Dashboard } from "@/components/ui/dashboard"

export default function ChatPage() {
  return (
    <Dashboard>
      <ChatUI />
    </Dashboard>
  )
}