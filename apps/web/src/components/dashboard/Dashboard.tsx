'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { ChatUI } from '@/components/chat/ChatUI'

interface DashboardProps {
  isOpen: boolean
  onClose: () => void
}

export function Dashboard({ isOpen, onClose }: DashboardProps) {
  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 bg-background z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Dashboard Header */}
      <div className="h-16 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">W</span>
          </div>
          <h1 className="font-semibold text-foreground">Wessley AI Dashboard</h1>
        </div>
        <motion.button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </motion.button>
      </div>

      {/* Dashboard Content */}
      <div className="h-[calc(100vh-64px)] flex">
        {/* Left Sidebar - User Profile & Vehicle Selector */}
        <div className="w-80 border-r bg-background/50 p-6">
          <div className="space-y-6">
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground">User Profile</h3>
                <p className="text-sm text-muted-foreground">Automotive Enthusiast</p>
              </div>
            </div>

            {/* Vehicle Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Vehicle</label>
              <select className="w-full p-3 rounded-lg border bg-background text-foreground">
                <option>Hyundai Galloper 00&apos;</option>
                <option>Toyota Camry 05&apos;</option>
                <option>Honda Civic 12&apos;</option>
              </select>
            </div>

            {/* Config Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Select Config</label>
              <select className="w-full p-3 rounded-lg border bg-background text-foreground">
                <option>Standard Configuration</option>
                <option>Performance Setup</option>
                <option>Custom Wiring</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Center - 3D Scene Canvas */}
          <div className="flex-1 flex">
            <div className="flex-1 bg-muted/20 flex items-center justify-center">
              <div className="text-center">
                <div className="h-24 w-24 rounded-lg bg-primary/20 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-primary text-4xl">🚗</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">3D Scene Canvas</h3>
                <p className="text-sm text-muted-foreground">Wiring harness visualization will appear here</p>
              </div>
            </div>

            {/* Right Sidebar - Action Menu */}
            <div className="w-80 border-l bg-background/50 p-6">
              <h3 className="font-semibold text-foreground mb-6">Actions</h3>
              <div className="space-y-4">
                {/* Log a repair */}
                <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                  <h4 className="font-medium text-foreground mb-2">Log a repair</h4>
                  <p className="text-sm text-muted-foreground">Mark the starter relay as replaced and add receipt photo.</p>
                </div>

                {/* Predict weak spots */}
                <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                  <h4 className="font-medium text-foreground mb-2">Predict weak spots</h4>
                  <p className="text-sm text-muted-foreground">Analyze the harness and show which wires are at risk of overheating.</p>
                </div>

                {/* Explore */}
                <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                  <h4 className="font-medium text-foreground mb-2">Explore</h4>
                  <p className="text-sm text-muted-foreground">Highlight circuits connected to ignition</p>
                </div>

                {/* Source parts */}
                <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                  <h4 className="font-medium text-foreground mb-2">Source parts</h4>
                  <p className="text-sm text-muted-foreground">Find compatible alternator connector near me.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom - Chat Interface */}
          <div className="h-80 border-t bg-background">
            <ChatUI />
          </div>
        </div>
      </div>
    </motion.div>
  )
}