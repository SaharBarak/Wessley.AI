'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { useAuth } from '@/lib/hooks/use-auth'

export default function Home() {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false)
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      router.push('/chat')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to /chat
  }
  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center">
      <div className="relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 w-full">
        {/* Left Column: Hero Content */}
        <div className="flex flex-col justify-center space-y-8">
          <div className="space-y-6">
            <h1 className="keania-one-regular tracking-wide" style={{color: '#22E974', fontSize: '52px'}}>
              MEET WESSLEY.
            </h1>
            <p className="font-sans text-black dark:text-white max-w-lg font-semibold" style={{fontSize: '24px'}}>
              Your project car electrician, companion — and your new car project dashboard.
            </p>
          </div>
          <div>
            <Button 
              size="lg" 
              className="bg-primary text-white hover:bg-primary/90 px-8 py-3 rounded-lg font-inter font-black"
              style={{fontSize: '16px'}}
              onClick={signInWithGoogle}
            >
              Start Building →
            </Button>
          </div>
        </div>

        {/* Right Column: Illustrations */}
        <div className="flex items-center justify-center">
          {/* Light mode illustration */}
          <img 
            src="/illus-light.png" 
            alt="Wessley AI Illustration" 
            className="max-w-full h-auto dark:hidden"
          />
          {/* Dark mode illustration */}
          <img 
            src="/illus-dark.png" 
            alt="Wessley AI Illustration" 
            className="max-w-full h-auto hidden dark:block"
          />
        </div>
      </div>
      
      <Dashboard 
        isOpen={isDashboardOpen} 
        onClose={() => setIsDashboardOpen(false)} 
      />
    </div>
  )
}
