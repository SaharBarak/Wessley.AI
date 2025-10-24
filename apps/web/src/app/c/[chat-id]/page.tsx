'use client'

import { useParams } from 'next/navigation'
import { useContext, useEffect } from 'react'
import { Dashboard } from "@/components/ui/dashboard"
import { ChatUI } from "@/components/chat/chat-ui"
import { ChatbotUIContext } from "@/context/context"

export default function ChatPage() {
  const params = useParams()
  const chatId = params['chat-id'] as string
  const { chats, setSelectedChat } = useContext(ChatbotUIContext)
  
  // Find the chat by ID
  const chat = chats.find(c => c.id === chatId)
  
  // Set the selected chat when the page loads
  useEffect(() => {
    if (chat) {
      setSelectedChat(chat)
    }
  }, [chat, setSelectedChat])

  if (!chat) {
    return (
      <Dashboard>
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <h2 className="text-xl font-medium mb-2">Chat not found</h2>
            <p>The requested chat could not be found.</p>
          </div>
        </div>
      </Dashboard>
    )
  }

  return (
    <Dashboard>
      <ChatUI />
    </Dashboard>
  )
}