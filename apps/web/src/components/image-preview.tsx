'use client'

import { useState } from 'react'
import { X, RotateCcw, ZoomIn, ZoomOut, Download, Trash2, AlertCircle, Zap } from 'lucide-react'
import { useUploadStore } from '@/stores/upload'
import { useAnalysisStore } from '@/stores/analysis'

interface ImagePreviewProps {
  imageId: string
  onClose?: () => void
  onAnalyze?: (imageId: string) => void
}

export function ImagePreview({ imageId, onClose, onAnalyze }: ImagePreviewProps) {
  const { images, removeImage, setCurrentImage, updateImageStatus } = useUploadStore()
  const { analyzeImage, isAnalyzing, analysisError } = useAnalysisStore()
  const image = images.find(img => img.id === imageId)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  if (!image) return null

  const handleAnalyze = async () => {
    try {
      updateImageStatus(imageId, 'analyzing')
      await analyzeImage(image.file, imageId)
      updateImageStatus(imageId, 'analyzed')
      onAnalyze?.(imageId)
    } catch (error) {
      updateImageStatus(imageId, 'error')
      console.error('Analysis failed:', error)
    }
  }

  const handleRemove = () => {
    removeImage(imageId)
    setCurrentImage(null)
    onClose?.()
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = image.url
    link.download = image.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = () => {
    switch (image.status) {
      case 'uploading': return 'text-blue-600'
      case 'uploaded': return 'text-green-600'
      case 'analyzing': return 'text-yellow-600'
      case 'analyzed': return 'text-green-600'
      case 'error': return 'text-destructive'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusText = () => {
    switch (image.status) {
      case 'uploading': return `Uploading... ${image.progress || 0}%`
      case 'uploaded': return 'Ready for analysis'
      case 'analyzing': return 'Analyzing electrical components...'
      case 'analyzed': return 'Analysis complete'
      case 'error': return `Error: ${image.error}`
      default: return 'Unknown status'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-6xl max-h-[90vh] w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{image.name}</h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>{formatFileSize(image.size)}</span>
              <span className={getStatusColor()}>{getStatusText()}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setRotation(r => r + 90)}
              className="p-2 hover:bg-secondary rounded-lg"
              title="Rotate"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="p-2 hover:bg-secondary rounded-lg"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              className="p-2 hover:bg-secondary rounded-lg"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            
            <div className="w-px h-6 bg-border" />
            
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-secondary rounded-lg"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleRemove}
              className="p-2 hover:bg-destructive/10 text-destructive rounded-lg"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="relative flex-1 overflow-hidden bg-secondary/20" style={{ height: 'calc(90vh - 140px)' }}>
          <div className="flex items-center justify-center h-full">
            <img
              src={image.url}
              alt={image.name}
              className="max-w-full max-h-full object-contain"
              style={{ 
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transition: 'transform 0.2s ease'
              }}
            />
          </div>
          
          {image.status === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="bg-background p-6 rounded-lg flex items-center space-x-3 text-destructive">
                <AlertCircle className="w-6 h-6" />
                <div>
                  <p className="font-medium">Upload failed</p>
                  <p className="text-sm">{image.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Uploaded {new Date(image.uploadedAt).toLocaleString()}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
            >
              Close
            </button>
            
            {(image.status === 'uploaded' || image.status === 'error') && (
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>{isAnalyzing ? 'Analyzing...' : 'Analyze Components'}</span>
              </button>
            )}
            
            {analysisError && (
              <div className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                {analysisError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}