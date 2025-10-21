'use client'

import { useState } from 'react'

export function VehicleWorkspace() {
  const [selectedConfig, setSelectedConfig] = useState('Select Config')

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header with vehicle selector */}
      <div className="border-b p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Hyundai Galloper 90'</span>
          <select 
            value={selectedConfig}
            onChange={(e) => setSelectedConfig(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          >
            <option>Select Config</option>
            <option>Engine Bay</option>
            <option>Dashboard</option>
            <option>Fuse Box</option>
          </select>
        </div>
      </div>

      {/* Main diagram area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center w-full max-w-2xl">
          {/* Placeholder for electrical diagram */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-4">
              <div className="h-8 w-8 rounded-full bg-red-500"></div>
              <div className="h-1 w-16 bg-white rounded"></div>
              <div className="h-8 w-8 rounded-full bg-blue-500"></div>
              <div className="h-1 w-16 bg-yellow-500 rounded"></div>
              <div className="h-8 w-8 rounded-full bg-white"></div>
              <div className="h-1 w-16 bg-red-500 rounded"></div>
              <div className="h-8 w-8 rounded-full bg-purple-500"></div>
            </div>
            <p className="text-gray-500">Electrical system diagram will appear here</p>
          </div>
        </div>
      </div>

      {/* Action buttons area */}
      <div className="border-t p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4 text-center hover:bg-accent cursor-pointer transition-colors">
            <div className="text-lg mb-2">🔧</div>
            <h3 className="font-medium text-white">Log a repair</h3>
            <p className="text-sm text-muted-foreground mt-1">Mark the starter relay as replaced and add receipt photo.</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center hover:bg-accent cursor-pointer transition-colors">
            <div className="text-lg mb-2">⚠️</div>
            <h3 className="font-medium text-yellow-500">Predict weak spots</h3>
            <p className="text-sm text-muted-foreground mt-1">Analyze the harness and show which wires are at risk of overheating.</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center hover:bg-accent cursor-pointer transition-colors">
            <div className="text-lg mb-2">🔍</div>
            <h3 className="font-medium text-blue-500">Explore</h3>
            <p className="text-sm text-muted-foreground mt-1">Highlight circuits connected to ignition</p>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center hover:bg-accent cursor-pointer transition-colors">
            <div className="text-lg mb-2">🔗</div>
            <h3 className="font-medium text-purple-500">Source parts</h3>
            <p className="text-sm text-muted-foreground mt-1">Find compatible alternator connector near me.</p>
          </div>
        </div>
      </div>
    </div>
  )
}