'use client'

import { useState } from 'react'
import { useAnalysisStore } from '@/stores/analysis'
import { MermaidDiagramComponent } from './mermaid-diagram'
import { ComponentDetails } from './component-details'
import { Layers, Grid, AlertCircle } from 'lucide-react'

export function DiagramView() {
  const { 
    currentAnalysis, 
    currentDiagram, 
    selectedComponentId, 
    setSelectedComponent,
    getComponentById,
    generateDiagram 
  } = useAnalysisStore()
  
  const [showGrid, setShowGrid] = useState(false)
  const selectedComponent = selectedComponentId ? getComponentById(selectedComponentId) : null

  if (!currentAnalysis) {
    return (
      <div className="flex items-center justify-center p-12 bg-secondary/20 rounded-lg">
        <div className="text-center">
          <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
          <p className="text-muted-foreground">
            Upload and analyze a vehicle image to see the electrical diagram
          </p>
        </div>
      </div>
    )
  }

  if (!currentDiagram) {
    return (
      <div className="flex items-center justify-center p-12 bg-secondary/20 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Generating diagram...</p>
          <button
            onClick={generateDiagram}
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
          >
            Retry Generation
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Electrical Diagram</h2>
          <p className="text-muted-foreground">
            {currentAnalysis.components.length} components • {
              currentAnalysis.components.reduce((total, comp) => total + (comp.wires?.length || 0), 0)
            } connections
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg transition-colors ${
              showGrid ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
            title="Toggle grid"
          >
            <Grid className="w-4 h-4" />
          </button>
          
          <button
            onClick={generateDiagram}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 text-sm"
          >
            Regenerate
          </button>
        </div>
      </div>

      {/* Analysis Metadata */}
      {currentAnalysis.metadata && (
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Confidence:</span>
              <span className="font-medium">
                {Math.round((currentAnalysis.metadata.confidence || 0) * 100)}%
              </span>
            </div>
            
            <div className="w-px h-4 bg-border" />
            
            <div>
              <span className="text-muted-foreground">Analyzed:</span>
              <span className="ml-2">
                {new Date(currentAnalysis.metadata.analysisTimestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Diagram */}
        <div className={`${selectedComponent ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
          <div className="bg-card border rounded-lg overflow-hidden">
            <MermaidDiagramComponent
              diagram={currentDiagram}
              selectedComponentId={selectedComponentId}
              onComponentSelect={setSelectedComponent}
              className="min-h-[500px]"
            />
          </div>
        </div>

        {/* Component Details Sidebar */}
        {selectedComponent && (
          <div className="lg:col-span-1">
            <ComponentDetails
              component={selectedComponent}
              onClose={() => setSelectedComponent(null)}
            />
          </div>
        )}
      </div>

      {/* Component List */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Components Found</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentAnalysis.components.map(component => (
            <button
              key={component.id}
              onClick={() => setSelectedComponent(
                selectedComponentId === component.id ? null : component.id
              )}
              className={`p-3 text-left rounded-lg border transition-colors ${
                selectedComponentId === component.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary/30 hover:bg-secondary/50 border-transparent'
              }`}
            >
              <div className="font-medium text-sm">{component.label}</div>
              <div className="text-xs opacity-75 capitalize mt-1">
                {component.type || 'component'} • {component.wires?.length || 0} connections
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}