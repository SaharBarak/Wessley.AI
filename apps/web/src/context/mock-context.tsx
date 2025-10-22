'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ChatUIContextType {
  // Basic chat state
  userInput: string
  setUserInput: (input: string) => void
  messages: Message[]
  setMessages: (messages: Message[]) => void
  isGenerating: boolean
  setIsGenerating: (generating: boolean) => void
  
  // Command state
  isPromptPickerOpen: boolean
  setIsPromptPickerOpen: (open: boolean) => void
  isFilePickerOpen: boolean
  setIsFilePickerOpen: (open: boolean) => void
  isToolPickerOpen: boolean
  setIsToolPickerOpen: (open: boolean) => void
  isAssistantPickerOpen: boolean
  setIsAssistantPickerOpen: (open: boolean) => void
  
  // Focus states
  focusPrompt: boolean
  setFocusPrompt: (focus: boolean) => void
  focusFile: boolean
  setFocusFile: (focus: boolean) => void
  focusTool: boolean
  setFocusTool: (focus: boolean) => void
  focusAssistant: boolean
  setFocusAssistant: (focus: boolean) => void
  
  // Chat settings
  selectedChat: any
  setSelectedChat: (chat: any) => void
  chatSettings: any
  setChatSettings: (settings: any) => void
  chatMessages: any[]
  setChatMessages: (messages: any[]) => void
  selectedAssistant: any
  setSelectedAssistant: (assistant: any) => void
  selectedTools: any[]
  setSelectedTools: (tools: any[]) => void
  assistantImages: any[]
  setAssistantImages: (images: any[]) => void
  chatImages: any[]
  setChatImages: (images: any[]) => void
  chatFileItems: any[]
  setChatFileItems: (items: any[]) => void
  chatFiles: any[]
  setChatFiles: (files: any[]) => void
  setShowFilesDisplay: (show: boolean) => void
  setUseRetrieval: (use: boolean) => void
  assistants: any[]
  setAssistants: (assistants: any[]) => void
}

const ChatUIContext = createContext<ChatUIContextType | null>(null)

export function ChatbotUIProvider({ children }: { children: ReactNode }) {
  const [userInput, setUserInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'What kind of car are we working on? You can try commands like /focus BATTERY01 or /view left.',
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Command states
  const [isPromptPickerOpen, setIsPromptPickerOpen] = useState(false)
  const [isFilePickerOpen, setIsFilePickerOpen] = useState(false)
  const [isToolPickerOpen, setIsToolPickerOpen] = useState(false)
  const [isAssistantPickerOpen, setIsAssistantPickerOpen] = useState(false)
  
  // Focus states
  const [focusPrompt, setFocusPrompt] = useState(false)
  const [focusFile, setFocusFile] = useState(false)
  const [focusTool, setFocusTool] = useState(false)
  const [focusAssistant, setFocusAssistant] = useState(false)
  
  // Chat settings (mocked)
  const [selectedChat, setSelectedChat] = useState(null)
  const [chatSettings, setChatSettings] = useState({})
  const [chatMessages, setChatMessages] = useState([])
  const [selectedAssistant, setSelectedAssistant] = useState(null)
  const [selectedTools, setSelectedTools] = useState([])
  const [assistantImages, setAssistantImages] = useState([])
  const [chatImages, setChatImages] = useState([])
  const [chatFileItems, setChatFileItems] = useState([])
  const [chatFiles, setChatFiles] = useState([])
  const [assistants, setAssistants] = useState([])

  const setShowFilesDisplay = () => {}
  const setUseRetrieval = () => {}

  const value: ChatUIContextType = {
    userInput,
    setUserInput,
    messages,
    setMessages,
    isGenerating,
    setIsGenerating,
    isPromptPickerOpen,
    setIsPromptPickerOpen,
    isFilePickerOpen,
    setIsFilePickerOpen,
    isToolPickerOpen,
    setIsToolPickerOpen,
    isAssistantPickerOpen,
    setIsAssistantPickerOpen,
    focusPrompt,
    setFocusPrompt,
    focusFile,
    setFocusFile,
    focusTool,
    setFocusTool,
    focusAssistant,
    setFocusAssistant,
    selectedChat,
    setSelectedChat,
    chatSettings,
    setChatSettings,
    chatMessages,
    setChatMessages,
    selectedAssistant,
    setSelectedAssistant,
    selectedTools,
    setSelectedTools,
    assistantImages,
    setAssistantImages,
    chatImages,
    setChatImages,
    chatFileItems,
    setChatFileItems,
    chatFiles,
    setChatFiles,
    setShowFilesDisplay,
    setUseRetrieval,
    assistants,
    setAssistants
  }

  return (
    <ChatUIContext.Provider value={value}>
      {children}
    </ChatUIContext.Provider>
  )
}

export function useChatbotUI() {
  const context = useContext(ChatUIContext)
  if (!context) {
    throw new Error('useChatbotUI must be used within a ChatbotUIProvider')
  }
  return context
}

// Export with the same name as the original for compatibility
export { ChatUIContext as ChatbotUIContext }