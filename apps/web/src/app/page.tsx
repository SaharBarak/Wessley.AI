'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useUploadStore } from '@/stores/upload'
import { useAnalysisStore } from '@/stores/analysis'
import { UploadZone } from '@/components/upload-zone'
import { ImageGallery } from '@/components/image-gallery'
import { DiagramView } from '@/components/diagram-view'

export default function Home() {
  const { isAuthenticated, user, signIn, signOut } = useAuthStore()
  const { images } = useUploadStore()
  const { currentAnalysis } = useAnalysisStore()
  const [activeTab, setActiveTab] = useState<'upload' | 'gallery' | 'diagram'>('upload')

  const handleUpload = (file: File) => {
    console.log('File uploaded:', file.name)
    // Upload logic is handled by the UploadZone component and store
    if (images.length === 0) {
      setActiveTab('gallery')
    }
  }

  // Auto-navigate to diagram when analysis completes
  useEffect(() => {
    if (currentAnalysis && activeTab !== 'diagram') {
      setActiveTab('diagram')
    }
  }, [currentAnalysis])

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <header className="text-center mb-12">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Fusebox.ai
              </h1>
              <p className="text-xl text-muted-foreground">
                AI-powered vehicle electrical analysis and diagram generation
              </p>
            </header>

            <div className="bg-card border rounded-lg p-8 text-center">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Welcome</h2>
                <p className="text-muted-foreground mb-6">
                  Sign in with Google to start analyzing your vehicle's electrical system
                </p>
                <button
                  onClick={signIn}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Sign in with Google
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Fusebox.ai
              </h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.name}
              </p>
            </div>
            
            <button
              onClick={signOut}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:bg-secondary/90 transition-colors"
            >
              Sign Out
            </button>
          </header>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-8 bg-secondary/20 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Upload Photos
            </button>
            
            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 rounded-md font-medium transition-colors relative ${
                activeTab === 'gallery'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Images
              {images.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {images.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('diagram')}
              className={`px-4 py-2 rounded-md font-medium transition-colors relative ${
                activeTab === 'diagram'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              disabled={!currentAnalysis}
            >
              Diagram
              {currentAnalysis && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {currentAnalysis.components.length}
                </span>
              )}
            </button>
          </div>

          {/* Content */}
          <div className={activeTab === 'diagram' ? '' : 'bg-card border rounded-lg p-6'}>
            {activeTab === 'upload' ? (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-semibold mb-2">Upload Vehicle Photos</h2>
                  <p className="text-muted-foreground mb-8">
                    Upload photos of your vehicle's electrical components for AI-powered analysis
                  </p>
                </div>
                
                <UploadZone onUpload={handleUpload} className="max-w-2xl mx-auto" />
                
                {images.length > 0 && (
                  <div className="text-center">
                    <button
                      onClick={() => setActiveTab('gallery')}
                      className="text-primary hover:text-primary/80 font-medium"
                    >
                      View uploaded images ({images.length}) →
                    </button>
                  </div>
                )}
              </div>
            ) : activeTab === 'gallery' ? (
              <ImageGallery />
            ) : (
              <DiagramView />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}