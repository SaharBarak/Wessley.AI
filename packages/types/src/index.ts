// Vehicle Component Types
export interface Wire {
  to: string
  gauge?: string
  color?: string
  notes?: string
}

export interface Component {
  id: string
  label: string
  type?: 'fuse' | 'relay' | 'sensor' | 'terminal' | 'connector' | 'battery' | 'starter' | 'other'
  wires: Wire[]
  notes?: string
  position?: {
    x: number
    y: number
  }
}

// Analysis Response Types
export interface AnalysisResponse {
  components: Component[]
  metadata?: {
    imageId: string
    analysisTimestamp: string
    confidence?: number
  }
}

// Chat Types
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatContext {
  components: Component[]
  selectedComponentId?: string
}

// Auth Types
export interface User {
  id: string
  name: string
  email: string
  picture?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Upload Types
export interface UploadResponse extends ApiResponse {
  data?: {
    imageId: string
    imageUrl: string
  }
}

// Mermaid Diagram Types
export interface MermaidDiagram {
  source: string
  components: Component[]
}