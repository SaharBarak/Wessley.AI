import { create } from 'zustand'

interface UploadedImage {
  id: string
  file: File
  url: string
  name: string
  size: number
  uploadedAt: string
  status: 'uploading' | 'uploaded' | 'analyzing' | 'analyzed' | 'error'
  progress?: number
  error?: string
}

interface UploadState {
  images: UploadedImage[]
  currentImageId: string | null
  isUploading: boolean
  
  // Actions
  addImage: (file: File) => string
  updateImageStatus: (id: string, status: UploadedImage['status'], progress?: number) => void
  setCurrentImage: (id: string | null) => void
  removeImage: (id: string) => void
  clearImages: () => void
  setError: (id: string, error: string) => void
}

export const useUploadStore = create<UploadState>((set, get) => ({
  images: [],
  currentImageId: null,
  isUploading: false,

  addImage: (file: File) => {
    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const url = URL.createObjectURL(file)
    
    const newImage: UploadedImage = {
      id,
      file,
      url,
      name: file.name,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      status: 'uploading',
      progress: 0
    }

    set(state => ({
      images: [...state.images, newImage],
      currentImageId: id,
      isUploading: true
    }))

    return id
  },

  updateImageStatus: (id: string, status: UploadedImage['status'], progress?: number) => {
    set(state => ({
      images: state.images.map(img => 
        img.id === id 
          ? { ...img, status, progress }
          : img
      ),
      isUploading: status === 'uploading' ? true : state.images.some(img => img.status === 'uploading')
    }))
  },

  setCurrentImage: (id: string | null) => {
    set({ currentImageId: id })
  },

  removeImage: (id: string) => {
    const state = get()
    const imageToRemove = state.images.find(img => img.id === id)
    
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.url)
    }

    set(state => ({
      images: state.images.filter(img => img.id !== id),
      currentImageId: state.currentImageId === id ? null : state.currentImageId
    }))
  },

  clearImages: () => {
    const state = get()
    state.images.forEach(img => URL.revokeObjectURL(img.url))
    
    set({
      images: [],
      currentImageId: null,
      isUploading: false
    })
  },

  setError: (id: string, error: string) => {
    set(state => ({
      images: state.images.map(img => 
        img.id === id 
          ? { ...img, status: 'error', error }
          : img
      ),
      isUploading: false
    }))
  }
}))