"use client"

import { useState, useContext } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { IconPlus, IconMicrophone, IconPlayerRecord } from "@tabler/icons-react"
import { ChatbotUIContext } from "@/context/context"
import { createChat } from "@/db/chats"

export function NewChatInterface() {
  const router = useRouter()
  const { profile, setChats, selectedWorkspace } = useContext(ChatbotUIContext)
  const [userInput, setUserInput] = useState("")

  const handleStartChat = async () => {
    if (!userInput.trim() || !profile) return
    
    try {
      // Create new chat (will be auto-named after first message)
      const newChat = await createChat({
        title: "New Chat", // Temporary title, will be updated after first message
        user_id: profile.user_id,
        workspace_id: selectedWorkspace?.id || null, // null for general chats
        ai_model: "gpt-4"
      })
      
      // Add to chats list
      setChats(prevChats => [...prevChats, newChat])
      
      // Navigate to the new chat with the user's input as initial message
      router.push(`/c/${newChat.id}?initialMessage=${encodeURIComponent(userInput)}`)
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStartChat()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#2a2a2a] text-white px-6">
      {/* Title */}
      <motion.h1 
        className="text-4xl font-normal mb-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Where should we begin?
      </motion.h1>

      {/* Chat Input */}
      <motion.div 
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="relative">
          <motion.div 
            className="flex items-center gap-3 bg-[#3a3a3a] rounded-full p-4 border border-gray-600/20"
            whileHover={{ backgroundColor: "#404040" }}
            transition={{ duration: 0.2 }}
          >
            <motion.button 
              onClick={handleStartChat}
              whileHover={{ scale: 1.1 }} 
              whileTap={{ scale: 0.9 }}
              className="p-1 rounded-md hover:bg-gray-600/50 transition-colors"
            >
              <IconPlus className="w-5 h-5 text-gray-400 hover:text-gray-300" />
            </motion.button>
            
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything"
              className="flex-1 bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 focus:border-none font-medium focus:outline-none text-lg"
              autoFocus
            />
            
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <IconMicrophone className="w-5 h-5 text-gray-400 hover:text-gray-300 transition-colors" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <IconPlayerRecord className="w-5 h-5 text-gray-400 hover:text-gray-300 transition-colors" />
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Optional: Example prompts or suggestions */}
      <motion.div 
        className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {[
          "Help me plan a project",
          "Explain a concept",
          "Write some code", 
          "Analyze data"
        ].map((suggestion, index) => (
          <motion.button
            key={index}
            onClick={() => setUserInput(suggestion)}
            className="p-4 text-left bg-[#3a3a3a] hover:bg-[#404040] rounded-lg border border-gray-600/20 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-gray-300">{suggestion}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}