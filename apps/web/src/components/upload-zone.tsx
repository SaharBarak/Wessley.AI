'use client'

import { useCallback, useState } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'
import { useUploadStore } from '@/stores/upload'

interface UploadZoneProps {
  onUpload?: (file: File) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
}

export function UploadZone({ 
  onUpload, 
  accept = "image/*", 
  maxSize = 10,
  className = ""
}: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addImage, updateImageStatus } = useUploadStore()

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return 'Please select an image file'
    }
    
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`
    }

    return null
  }

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    const imageId = addImage(file)
    
    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 20) {
      await new Promise(resolve => setTimeout(resolve, 200))
      updateImageStatus(imageId, 'uploading', progress)
    }
    
    updateImageStatus(imageId, 'uploaded', 100)
    onUpload?.(file)
  }, [addImage, updateImageStatus, onUpload, maxSize])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  return (
    <div className={`relative ${className}`}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
          }
          ${error ? 'border-destructive' : ''}
        `}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <Upload className={`w-12 h-12 ${error ? 'text-destructive' : 'text-muted-foreground'}`} />
          
          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragOver ? 'Drop your vehicle photo here' : 'Upload Vehicle Photo'}
            </p>
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to select • JPG, PNG up to {maxSize}MB
            </p>
            <p className="text-xs text-muted-foreground">
              Best results: Engine bay, fusebox, or dashboard photos
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center space-x-2 text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}