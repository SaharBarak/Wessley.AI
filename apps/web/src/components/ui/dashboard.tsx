"use client"

import { Sidebar } from "@/components/sidebar/sidebar"
import { Button } from "@/components/ui/button"
import { Tabs } from "@/components/ui/tabs"
import useHotkey from "@/lib/hooks/use-hotkey"
import { cn } from "@/lib/utils"
import { ContentType } from "@/types"
import { IconChevronCompactRight, IconLayoutSidebar, IconLayoutSidebarLeftExpand, IconLayoutSidebarLeftCollapse } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import React, { FC, useState, useEffect, useContext } from "react"
import { ChatbotUIContext } from "@/context/context"
import { motion, AnimatePresence } from "framer-motion"
import { useSelectFileHandler } from "../chat/chat-hooks/use-select-file-handler"
import { ThreeScene } from "../3d/ThreeScene"
import { SceneExplorer } from "../scene-explorer/scene-explorer"
import { Explore } from "../vehicle/explore"
import { Gallery } from "../vehicle/gallery"
import { ProjectSpace } from "../project/project-space"
import { Marketplace } from "../vehicle/marketplace"
import { AutoTuning } from "../vehicle/auto-tuning"

export const SIDEBAR_WIDTH = 238

interface DashboardProps {
  children: React.ReactNode
}

export const Dashboard: FC<DashboardProps> = ({ children }) => {
  useHotkey("s", () => setShowSidebar(prevState => !prevState))

  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mainTabValue = searchParams.get("view") || "chat"

  const { handleSelectDeviceFile } = useSelectFileHandler()
  const { workspaces, selectedWorkspace, setSelectedWorkspace } = useContext(ChatbotUIContext)

  const [mainView, setMainView] = useState<ContentType>(mainTabValue as ContentType)

  // Get current workspace - for now use the first one or selected one
  const currentWorkspace = selectedWorkspace || workspaces[0]

  const handleMainViewChange = (view: ContentType) => {
    setMainView(view)
    router.replace(`${pathname}?view=${view}`)
  }
  const [showSidebar, setShowSidebar] = useState(true) // Default to open
  
  // Safely access localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem("showSidebar")
    if (saved !== null) {
      setShowSidebar(saved === "true")
    } else {
      // If no saved preference, default to open
      setShowSidebar(true)
    }
  }, [])
  
  // Save sidebar state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("showSidebar", showSidebar.toString())
  }, [showSidebar])
  const [isDragging, setIsDragging] = useState(false)
  const [sceneHeight, setSceneHeight] = useState(300)
  const [isResizing, setIsResizing] = useState(false)

  const onFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()

    const files = event.dataTransfer.files
    const file = files[0]

    handleSelectDeviceFile(file)

    setIsDragging(false)
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleToggleSidebar = () => {
    setShowSidebar(prevState => !prevState)
    localStorage.setItem("showSidebar", String(!showSidebar))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    const newHeight = Math.max(200, Math.min(600, e.clientY - 100))
    setSceneHeight(newHeight)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing])

  return (
    <div className="flex h-full w-full overflow-hidden">

      {/* Unified Sidebar */}
      <motion.div
        className="shrink-0"
        animate={{
          width: showSidebar ? `${SIDEBAR_WIDTH}px` : "0px"
        }}
        transition={{
          duration: 0.4,
          ease: [0.25, 0.1, 0.25, 1]
        }}
      >
        <Sidebar 
          showSidebar={showSidebar} 
          onMainViewChange={handleMainViewChange}
          currentView={mainView}
          onToggleSidebar={handleToggleSidebar}
        />
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
        {mainView === "chat" && (
          <>
            {/* Resizable 3D Scene Area */}
            <div 
              className="bg-background flex relative w-full overflow-hidden"
              style={{ height: `${sceneHeight}px` }}
              onDrop={onFileDrop}
              onDragOver={onDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              {/* Center 3D Scene */}
              <div className="flex-1 bg-muted/10 relative overflow-hidden">
                {isDragging ? (
                  <div className="flex h-full items-center justify-center bg-black/50 text-2xl text-white">
                    drop file here
                  </div>
                ) : (
                  <ThreeScene />
                )}
                
                {/* Scene Explorer Overlay */}
                <SceneExplorer />
              </div>

              {/* Resize Handle */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-border hover:bg-accent cursor-ns-resize"
                onMouseDown={handleMouseDown}
              />
            </div>

            {/* Bottom Chat Interface */}
            <div className="flex-1 border-t bg-background w-full overflow-hidden">
              {children}
            </div>
          </>
        )}

        {mainView === "explore" && (
          <div className="flex-1 overflow-hidden">
            <Explore />
          </div>
        )}

        {mainView === "gallery" && (
          <div className="flex-1 overflow-hidden">
            <Gallery />
          </div>
        )}

        {mainView === "project" && (
          <div className="flex-1 overflow-hidden">
            {currentWorkspace ? (
              <ProjectSpace 
                projectName={currentWorkspace.name} 
                projectId={currentWorkspace.id} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No project selected
              </div>
            )}
          </div>
        )}

        {mainView === "marketplace" && (
          <div className="flex-1 overflow-hidden">
            <Marketplace />
          </div>
        )}

        {mainView === "auto-tuning" && (
          <div className="flex-1 overflow-hidden">
            <AutoTuning />
          </div>
        )}
      </div>

      {/* Sidebar Toggle Button - Only show when sidebar is hidden */}
      {!showSidebar && (
        <button
          className="absolute top-4 left-4 z-10 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded cursor-pointer transition-colors duration-200 group border border-gray-200"
          onClick={handleToggleSidebar}
        >
          <IconLayoutSidebar 
            size={16} 
            className="text-gray-600"
          />
        </button>
      )}
    </div>
  )
}
