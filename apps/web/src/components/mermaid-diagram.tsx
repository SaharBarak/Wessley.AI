'use client'

import { useEffect, useRef, useState } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from 'lucide-react'
import type { MermaidDiagram, Component } from '@fusebox/types'

interface MermaidDiagramProps {
  diagram: MermaidDiagram
  selectedComponentId?: string | null
  onComponentSelect?: (componentId: string) => void
  className?: string
}

export function MermaidDiagramComponent({ 
  diagram, 
  selectedComponentId, 
  onComponentSelect,
  className = "" 
}: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mermaid, setMermaid] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Initialize Mermaid
  useEffect(() => {
    let mounted = true

    const initMermaid = async () => {
      try {
        const mermaidLib = await import('mermaid')
        
        if (!mounted) return

        mermaidLib.default.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#3b82f6',
            primaryTextColor: '#1f2937',
            primaryBorderColor: '#2563eb',
            lineColor: '#6b7280',
            backgroundColor: '#ffffff',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif'
          },
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            padding: 20,
            nodeSpacing: 50,
            rankSpacing: 50
          },
          securityLevel: 'loose' // Allow click events
        })

        setMermaid(mermaidLib.default)
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to initialize Mermaid:', err)
        if (mounted) {
          setError('Failed to load diagram renderer')
          setIsLoading(false)
        }
      }
    }

    initMermaid()

    return () => {
      mounted = false
    }
  }, [])

  // Render diagram when mermaid is ready or diagram changes
  useEffect(() => {
    if (!mermaid || !diagram.source || !containerRef.current) return

    const renderDiagram = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Clear previous diagram
        const container = containerRef.current!
        container.innerHTML = ''

        // Generate unique ID for this diagram
        const diagramId = `mermaid-${Date.now()}`

        // Create wrapper div
        const wrapper = document.createElement('div')
        wrapper.className = 'mermaid-wrapper'
        wrapper.style.transform = `scale(${zoom})`
        wrapper.style.transformOrigin = 'top left'
        wrapper.style.transition = 'transform 0.2s ease'

        // Render the diagram
        const { svg } = await mermaid.render(diagramId, diagram.source)
        wrapper.innerHTML = svg

        // Add click handlers for component selection
        if (onComponentSelect) {
          const nodes = wrapper.querySelectorAll('.node')
          nodes.forEach((node: any) => {
            const nodeId = node.id?.replace(diagramId + '-', '') || ''
            if (nodeId) {
              // Find the actual component ID (un-sanitize)
              const component = diagram.components.find(comp => 
                comp.id.replace(/[^a-zA-Z0-9_]/g, '_') === nodeId
              )
              
              if (component) {
                node.style.cursor = 'pointer'
                node.addEventListener('click', () => {
                  onComponentSelect(component.id)
                })

                // Add hover effects
                node.addEventListener('mouseenter', () => {
                  node.style.filter = 'brightness(1.1)'
                })
                node.addEventListener('mouseleave', () => {
                  node.style.filter = 'none'
                })
              }
            }
          })
        }

        container.appendChild(wrapper)
        setIsLoading(false)

      } catch (err: any) {
        console.error('Failed to render diagram:', err)
        setError(err.message || 'Failed to render diagram')
        setIsLoading(false)
      }
    }

    renderDiagram()
  }, [mermaid, diagram.source, zoom, onComponentSelect])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25))
  }

  const handleReset = () => {
    setZoom(1)
  }

  const handleDownload = async () => {
    if (!containerRef.current) return

    try {
      const svg = containerRef.current.querySelector('svg')
      if (!svg) return

      // Create canvas and draw SVG
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const svgData = new XMLSerializer().serializeToString(svg)
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        
        // Download
        const link = document.createElement('a')
        link.download = 'electrical-diagram.png'
        link.href = canvas.toDataURL()
        link.click()
      }
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 bg-secondary/20 rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating diagram...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 bg-destructive/10 rounded-lg ${className}`}>
        <div className="text-center text-destructive">
          <p className="font-medium mb-2">Failed to render diagram</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-2 flex space-x-1 shadow-lg">
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-secondary rounded-md"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        
        <span className="px-2 py-2 text-sm text-muted-foreground">
          {Math.round(zoom * 100)}%
        </span>
        
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-secondary rounded-md"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        
        <div className="w-px h-8 bg-border" />
        
        <button
          onClick={handleReset}
          className="p-2 hover:bg-secondary rounded-md"
          title="Reset zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleDownload}
          className="p-2 hover:bg-secondary rounded-md"
          title="Download PNG"
        >
          <Download className="w-4 h-4" />
        </button>
        
        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-secondary rounded-md"
          title="Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Diagram Container */}
      <div 
        ref={containerRef}
        className={`
          overflow-auto bg-white rounded-lg border
          ${isFullscreen ? 'fixed inset-4 z-50' : 'min-h-[400px]'}
        `}
        style={{ 
          maxHeight: isFullscreen ? 'none' : '600px',
          background: 'white'
        }}
      />

      {/* Component Info */}
      {selectedComponentId && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
          <div className="text-sm">
            <div className="font-medium mb-1">Selected Component</div>
            <div className="text-muted-foreground">
              {diagram.components.find(c => c.id === selectedComponentId)?.label || selectedComponentId}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleFullscreen}
        />
      )}
    </div>
  )
}