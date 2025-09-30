import { create } from 'zustand'

interface User {
  id: string
  name: string
  email: string
  picture?: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  signIn: () => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  signIn: () => {
    // TODO: Implement actual Google OAuth
    // For now, this is a stub that simulates authentication
    const mockUser: User = {
      id: '1',
      name: 'Demo User',
      email: 'demo@fusebox.ai',
      picture: undefined
    }
    
    set({
      isAuthenticated: true,
      user: mockUser
    })
  },
  signOut: () => {
    set({
      isAuthenticated: false,
      user: null
    })
  }
}))