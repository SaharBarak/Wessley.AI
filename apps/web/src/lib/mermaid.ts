import type { Component, MermaidDiagram } from '@wessley/types'

export class MermaidService {
  private static instance: MermaidService

  public static getInstance(): MermaidService {
    if (!MermaidService.instance) {
      MermaidService.instance = new MermaidService()
    }
    return MermaidService.instance
  }

  /**
   * Generate Mermaid flowchart from electrical components
   */
  generateDiagram(components: Component[]): MermaidDiagram {
    if (!components || components.length === 0) {
      return {
        source: this.getEmptyDiagram(),
        components: []
      }
    }

    const mermaidSource = this.buildMermaidSource(components)
    
    return {
      source: mermaidSource,
      components
    }
  }

  /**
   * Build the complete Mermaid flowchart source
   */
  private buildMermaidSource(components: Component[]): string {
    const lines: string[] = []
    
    // Header
    lines.push('flowchart TD')
    lines.push('')
    
    // Component definitions with styling
    const componentDefs = this.generateComponentDefinitions(components)
    lines.push('  %% Component Definitions')
    lines.push(...componentDefs)
    lines.push('')
    
    // Wire connections
    const connections = this.generateConnections(components)
    if (connections.length > 0) {
      lines.push('  %% Wire Connections')
      lines.push(...connections)
      lines.push('')
    }
    
    // Styling
    const styles = this.generateStyles(components)
    lines.push('  %% Component Styling')
    lines.push(...styles)
    
    return lines.join('\n')
  }

  /**
   * Generate component node definitions
   */
  private generateComponentDefinitions(components: Component[]): string[] {
    return components.map(comp => {
      const nodeId = this.sanitizeId(comp.id)
      const label = this.escapeLabel(comp.label)
      const shape = this.getComponentShape(comp.type)
      
      return `  ${nodeId}${shape.start}"${label}"${shape.end}`
    })
  }

  /**
   * Generate wire connections between components
   */
  private generateConnections(components: Component[]): string[] {
    const connections: string[] = []
    
    components.forEach(comp => {
      if (!comp.wires || comp.wires.length === 0) return
      
      comp.wires.forEach(wire => {
        if (!wire.to) return
        
        const fromId = this.sanitizeId(comp.id)
        const toId = this.sanitizeId(wire.to)
        
        // Check if target component exists
        const targetExists = components.some(c => c.id === wire.to)
        if (!targetExists) return
        
        const wireLabel = this.buildWireLabel(wire)
        const connection = wireLabel 
          ? `  ${fromId} -->|"${wireLabel}"| ${toId}`
          : `  ${fromId} --> ${toId}`
        
        connections.push(connection)
      })
    })
    
    return connections
  }

  /**
   * Generate component styling based on type
   */
  private generateStyles(components: Component[]): string[] {
    const styles: string[] = []
    const typeColors = this.getTypeColorMap()
    
    // Group components by type for efficient styling
    const typeGroups: Record<string, string[]> = {}
    
    components.forEach(comp => {
      const type = comp.type || 'other'
      if (!typeGroups[type]) typeGroups[type] = []
      typeGroups[type].push(this.sanitizeId(comp.id))
    })
    
    // Generate class definitions for each type
    Object.entries(typeGroups).forEach(([type, nodeIds]) => {
      const color = typeColors[type] || typeColors.other
      const className = `${type}Style`
      
      styles.push(`  classDef ${className} ${color}`)
      styles.push(`  class ${nodeIds.join(',')} ${className}`)
    })
    
    return styles
  }

  /**
   * Get component shape based on type
   */
  private getComponentShape(type?: string): { start: string; end: string } {
    switch (type) {
      case 'fuse':
        return { start: '[', end: ']' } // Rectangle
      case 'relay':
        return { start: '(', end: ')' } // Circle
      case 'battery':
        return { start: '[[', end: ']]' } // Double rectangle
      case 'sensor':
        return { start: '{', end: '}' } // Diamond
      case 'terminal':
      case 'connector':
        return { start: '((', end: '))' } // Double circle
      default:
        return { start: '[', end: ']' } // Default rectangle
    }
  }

  /**
   * Get color mapping for component types
   */
  private getTypeColorMap(): Record<string, string> {
    return {
      fuse: 'fill:#ff6b6b,stroke:#e55555,stroke-width:2px,color:#fff',
      relay: 'fill:#4ecdc4,stroke:#3ba39c,stroke-width:2px,color:#fff',
      battery: 'fill:#45b7d1,stroke:#3498db,stroke-width:2px,color:#fff',
      sensor: 'fill:#96ceb4,stroke:#7fb68a,stroke-width:2px,color:#fff',
      terminal: 'fill:#feca57,stroke:#ff9ff3,stroke-width:2px,color:#333',
      connector: 'fill:#feca57,stroke:#ff9ff3,stroke-width:2px,color:#333',
      starter: 'fill:#ff9ff3,stroke:#e84393,stroke-width:2px,color:#fff',
      other: 'fill:#ddd,stroke:#aaa,stroke-width:2px,color:#333'
    }
  }

  /**
   * Build wire label with gauge and color info
   */
  private buildWireLabel(wire: any): string {
    const parts: string[] = []
    
    if (wire.gauge) parts.push(wire.gauge)
    if (wire.color) parts.push(wire.color)
    
    return parts.join(' ')
  }

  /**
   * Sanitize component ID for Mermaid
   */
  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_')
  }

  /**
   * Escape special characters in labels
   */
  private escapeLabel(label: string): string {
    return label
      .replace(/"/g, '\\"')
      .replace(/\n/g, ' ')
      .trim()
  }

  /**
   * Get empty diagram placeholder
   */
  private getEmptyDiagram(): string {
    return `flowchart TD
  A["No components found"]
  
  classDef defaultStyle fill:#f9f9f9,stroke:#ddd,stroke-width:1px,color:#666
  class A defaultStyle`
  }

  /**
   * Generate diagram with component highlighting
   */
  generateWithHighlight(components: Component[], selectedComponentId?: string): MermaidDiagram {
    const baseDiagram = this.generateDiagram(components)
    
    if (!selectedComponentId) return baseDiagram
    
    // Add highlighting for selected component
    const lines = baseDiagram.source.split('\n')
    const selectedId = this.sanitizeId(selectedComponentId)
    
    lines.push('')
    lines.push('  %% Highlighting')
    lines.push(`  classDef selectedStyle fill:#ff4757,stroke:#ff3742,stroke-width:3px,color:#fff`)
    lines.push(`  class ${selectedId} selectedStyle`)
    
    return {
      source: lines.join('\n'),
      components
    }
  }
}