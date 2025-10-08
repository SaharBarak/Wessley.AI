'use client'

import { X, Zap, Cable, Info } from 'lucide-react'
import type { Component } from '@wessley/types'

interface ComponentDetailsProps {
  component: Component | null
  onClose: () => void
  className?: string
}

export function ComponentDetails({ component, onClose, className = "" }: ComponentDetailsProps) {
  if (!component) return null

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'fuse':
      case 'relay':
        return <Zap className="w-5 h-5" />
      case 'battery':
      case 'starter':
      case 'other':
        return <Zap className="w-5 h-5" />
      default:
        return <Cable className="w-5 h-5" />
    }
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'fuse':
        return 'text-red-600 bg-red-50'
      case 'relay':
        return 'text-teal-600 bg-teal-50'
      case 'battery':
        return 'text-blue-600 bg-blue-50'
      case 'sensor':
        return 'text-green-600 bg-green-50'
      case 'terminal':
      case 'connector':
        return 'text-yellow-600 bg-yellow-50'
      case 'starter':
        return 'text-purple-600 bg-purple-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const formatWireInfo = (wire: any) => {
    const parts = []
    if (wire.gauge) parts.push(wire.gauge)
    if (wire.color) parts.push(wire.color)
    return parts.join(' • ')
  }

  return (
    <div className={`bg-card border rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getTypeColor(component.type)}`}>
            {getTypeIcon(component.type)}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{component.label}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {component.type || 'component'}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Component Notes */}
        {component.notes && (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-medium">Description</h4>
            </div>
            <p className="text-sm text-muted-foreground pl-6">
              {component.notes}
            </p>
          </div>
        )}

        {/* Wire Connections */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Cable className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-medium">Wire Connections</h4>
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
              {component.wires?.length || 0}
            </span>
          </div>
          
          {component.wires && component.wires.length > 0 ? (
            <div className="space-y-3 pl-6">
              {component.wires.map((wire, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      → {wire.to || 'Unknown destination'}
                    </div>
                    {formatWireInfo(wire) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatWireInfo(wire)}
                      </div>
                    )}
                    {wire.notes && (
                      <div className="text-xs text-muted-foreground mt-1 italic">
                        {wire.notes}
                      </div>
                    )}
                  </div>
                  
                  {wire.color && (
                    <div className="ml-3">
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ 
                          backgroundColor: wire.color.toLowerCase(),
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                        }}
                        title={`${wire.color} wire`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pl-6">
              No wire connections detected
            </p>
          )}
        </div>

        {/* Position Info */}
        {component.position && (
          <div>
            <h4 className="font-medium mb-2">Position in Diagram</h4>
            <div className="text-sm text-muted-foreground pl-6">
              X: {component.position.x}, Y: {component.position.y}
            </div>
          </div>
        )}

        {/* Technical Specifications */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">Technical Specifications</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Component ID</span>
              <div className="font-mono text-xs bg-secondary/50 px-2 py-1 rounded mt-1">
                {component.id}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Type</span>
              <div className="capitalize mt-1">
                {component.type || 'Generic'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}