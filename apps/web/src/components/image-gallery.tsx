'use client'

import { useState } from 'react'
import { Eye, Trash2, MoreVertical, Calendar, FileImage, Zap } from 'lucide-react'
import { useUploadStore } from '@/stores/upload'
import { useAnalysisStore } from '@/stores/analysis'
import { ImagePreview } from './image-preview'

export function ImageGallery() {
  const { images, removeImage, setCurrentImage, currentImageId, updateImageStatus } = useUploadStore()
  const { analyzeImage, isAnalyzing } = useAnalysisStore()
  const [previewImageId, setPreviewImageId] = useState<string | null>(null)

  const handleAnalyze = async (image: any) => {
    try {
      updateImageStatus(image.id, 'analyzing')
      await analyzeImage(image.file, image.id)
      updateImageStatus(image.id, 'analyzed')
    } catch (error) {
      updateImageStatus(image.id, 'error')
      console.error('Analysis failed:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs rounded-full font-medium"
    
    switch (status) {
      case 'uploading':
        return `${baseClasses} bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300`
      case 'uploaded':
        return `${baseClasses} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`
      case 'analyzing':
        return `${baseClasses} bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300`
      case 'analyzed':
        return `${baseClasses} bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300`
      case 'error':
        return `${baseClasses} bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300`
      default:
        return `${baseClasses} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300`
    }
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <FileImage className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No images uploaded yet</h3>
        <p className="text-muted-foreground">
          Upload your first vehicle photo to get started with electrical analysis
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Uploaded Images</h2>
          <span className="text-sm text-muted-foreground">
            {images.length} image{images.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className={`
                bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow
                ${currentImageId === image.id ? 'ring-2 ring-primary' : ''}
              `}
            >
              {/* Image thumbnail */}
              <div className="relative aspect-video bg-secondary/20">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Status badge */}
                <div className="absolute top-3 left-3">
                  <span className={getStatusBadge(image.status)}>
                    {image.status}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex space-x-1">
                  <button
                    onClick={() => setPreviewImageId(image.id)}
                    className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => removeImage(image.id)}
                    className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Upload progress */}
                {image.status === 'uploading' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50">
                    <div className="h-1 bg-white/20">
                      <div 
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${image.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Card content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium truncate flex-1" title={image.name}>
                    {image.name}
                  </h3>
                  <button className="p-1 hover:bg-secondary rounded">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Size</span>
                    <span>{formatFileSize(image.size)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>
                      {new Date(image.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => setCurrentImage(image.id)}
                    className={`
                      flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-colors
                      ${currentImageId === image.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }
                    `}
                  >
                    {currentImageId === image.id ? 'Selected' : 'Select'}
                  </button>
                  
                  {(image.status === 'uploaded' || image.status === 'error') && (
                    <button 
                      onClick={() => handleAnalyze(image)}
                      disabled={isAnalyzing}
                      className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium disabled:opacity-50 flex items-center space-x-1"
                    >
                      <Zap className="w-3 h-3" />
                      <span>{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
                    </button>
                  )}

                  {image.status === 'analyzed' && (
                    <button className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium">
                      View Results
                    </button>
                  )}
                </div>

                {/* Error message */}
                {image.status === 'error' && image.error && (
                  <div className="mt-3 p-2 bg-destructive/10 text-destructive text-xs rounded border border-destructive/20">
                    {image.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImageId && (
        <ImagePreview
          imageId={previewImageId}
          onClose={() => setPreviewImageId(null)}
          onAnalyze={(id) => {
            // TODO: Implement analysis in PR3
            console.log('Analyze image:', id)
            setPreviewImageId(null)
          }}
        />
      )}
    </>
  )
}