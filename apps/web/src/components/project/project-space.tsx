"use client"

import * as React from "react"
import { useState, useContext } from "react"
import { motion } from "framer-motion"
import { ThreeScene } from "@/components/3d/ThreeScene"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  IconClipboard, 
  IconCalculator,
  IconPlus,
  IconMicrophone,
  IconPlayerRecord,
  IconFolder,
  IconSettings,
  IconUser
} from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChatbotUIContext } from "@/context/context"
import { useRouter } from "next/navigation"
import { Tables } from "@/supabase/types"

interface ProjectSpaceProps {
  projectName: string
  projectId: string
}

interface ChatItem {
  id: string
  title: string
  lastMessage: string
  timestamp: string
}

export function ProjectSpace({ projectName, projectId }: ProjectSpaceProps) {
  const router = useRouter()
  const { chats } = useContext(ChatbotUIContext)
  const [chatInput, setChatInput] = useState("")
  
  // Filter chats by workspace/project ID
  const projectChats = chats.filter(chat => chat.workspace_id === projectId)

  const handleStartChat = () => {
    if (!chatInput.trim()) return
    
    // TODO: Implement creating new chat with backend
    // For now, just clear the input and navigate to chat page
    setChatInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStartChat()
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#2a2a2a] text-white relative">
      {/* Top Bar with Model Selection - Floating above scene */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Select defaultValue="chatgpt5">
            <SelectTrigger className="w-[140px] bg-transparent border-none text-white text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chatgpt5">ChatGPT 5</SelectItem>
              <SelectItem value="gpt4">GPT-4</SelectItem>
              <SelectItem value="claude35">Claude 3.5</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg text-gray-300 hover:text-white transition-colors duration-200"
            title="Project Manager"
          >
            <IconUser className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg text-gray-300 hover:text-white transition-colors duration-200"
            title="Budget & Expenses"
          >
            <IconCalculator className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg text-gray-300 hover:text-white transition-colors duration-200"
            title="Todo List"
          >
            <IconClipboard className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-lg text-gray-300 hover:text-white transition-colors duration-200"
            title="Settings"
          >
            <IconSettings className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 rounded-lg text-gray-300 hover:text-white transition-colors duration-200 text-sm"
          >
            Share
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-2 rounded-lg text-gray-300 hover:text-white transition-colors duration-200"
          >
            •••
          </motion.button>
        </div>
      </div>

      {/* 3D Scene - Full height with floating toolbar above */}
      <div className="h-80 relative overflow-hidden">
        <ThreeScene />
      </div>

      {/* Main Content Container - Centered */}
      <div className="flex-1 flex flex-col items-center max-w-3xl mx-auto w-full px-6 py-6">
        
        {/* Project Header */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <IconFolder className="w-6 h-6 text-gray-400" />
            <h1 className="text-xl font-medium">{projectName}</h1>
            <span className="text-sm text-gray-500">Hyundai Galloper 00'</span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Add files
          </Button>
        </div>

        {/* Chat Input - More rounded */}
        <motion.div 
          className="w-full mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <motion.div 
              className="flex items-center gap-3 bg-[#3a3a3a] rounded-full p-4 border border-gray-600/20"
              whileHover={{ backgroundColor: "#404040" }}
              transition={{ duration: 0.2 }}
            >
              <IconPlus className="w-5 h-5 text-gray-400" />
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`New chat in ${projectName}`}
                className="flex-1 bg-transparent border-none text-white placeholder-gray-400 focus:ring-0 focus:border-none font-medium focus:outline-none"
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

        {/* Chat History with Separators */}
        <div className="w-full flex-1 overflow-auto">
          {projectChats.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p>No chats yet...</p>
                <p className="text-sm mt-2">Start a conversation above to begin</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-700/50">
              {projectChats.map((chat, index) => (
                <motion.div 
                  key={chat.id} 
                  className="flex items-start justify-between p-4 hover:bg-[#3a3a3a]/50 cursor-pointer transition-all duration-200 rounded-lg mx-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ 
                    backgroundColor: "rgba(58, 58, 58, 0.7)",
                    x: 4,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/c/${chat.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium mb-1 text-white truncate">{chat.name}</h3>
                    <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                      {/* Show latest message or placeholder */}
                      New conversation
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 ml-4 shrink-0">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}