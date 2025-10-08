import type { Component, AnalysisResponse } from '@wessley/types'

export const mockComponents: Component[] = [
  {
    id: 'main_fuse',
    label: 'Main 60A Fuse',
    type: 'fuse',
    wires: [
      { to: 'starter', gauge: '6mm²', color: 'red', notes: 'Main power feed' },
      { to: 'alternator', gauge: '4mm²', color: 'red' }
    ],
    notes: 'Located near battery positive terminal',
    position: { x: 100, y: 50 }
  },
  {
    id: 'starter_relay',
    label: 'Starter Relay',
    type: 'relay',
    wires: [
      { to: 'ignition_switch', gauge: '2mm²', color: 'yellow' },
      { to: 'starter_solenoid', gauge: '6mm²', color: 'purple' },
      { to: 'ground', gauge: '2mm²', color: 'black' }
    ],
    notes: 'Controls starter motor engagement',
    position: { x: 200, y: 100 }
  },
  {
    id: 'battery',
    label: '12V Battery',
    type: 'battery',
    wires: [
      { to: 'main_fuse', gauge: '6mm²', color: 'red' },
      { to: 'ground', gauge: '6mm²', color: 'black' }
    ],
    notes: 'Primary power source',
    position: { x: 50, y: 150 }
  },
  {
    id: 'alternator',
    label: 'Alternator',
    type: 'other',
    wires: [
      { to: 'battery', gauge: '4mm²', color: 'red' },
      { to: 'voltage_regulator', gauge: '2mm²', color: 'blue' }
    ],
    notes: 'Charges battery and powers electrical system',
    position: { x: 300, y: 120 }
  }
]

export const mockAnalysisResponse: AnalysisResponse = {
  components: mockComponents,
  metadata: {
    imageId: 'mock_image_123',
    analysisTimestamp: new Date().toISOString(),
    confidence: 0.87
  }
}

// Mock file for testing upload
export const createMockImageFile = (name: string = 'engine-bay.jpg'): File => {
  // Create a simple 1x1 pixel image data
  const canvas = document.createElement('canvas')
  canvas.width = 800
  canvas.height = 600
  const ctx = canvas.getContext('2d')!
  
  // Draw a simple mock electrical diagram
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, 800, 600)
  
  // Draw some mock components
  ctx.fillStyle = '#333'
  ctx.fillRect(100, 100, 80, 40) // Battery
  ctx.fillRect(300, 150, 60, 30) // Fuse
  ctx.fillRect(500, 120, 70, 50) // Relay
  
  // Draw some wires
  ctx.strokeStyle = 'red'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(180, 120)
  ctx.lineTo(300, 165)
  ctx.stroke()
  
  ctx.strokeStyle = 'black'
  ctx.beginPath()
  ctx.moveTo(360, 165)
  ctx.lineTo(500, 145)
  ctx.stroke()
  
  // Convert to blob
  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], name, { type: 'image/jpeg' })
        resolve(file)
      }
    }, 'image/jpeg', 0.8)
  }) as any // Type assertion for mock purposes
}