'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function AuthCodeError() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sorry, we couldn't sign you in. Please try again.
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            If you continue to experience issues, please check:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Your internet connection</li>
            <li>Pop-up blockers are disabled</li>
            <li>Third-party cookies are enabled</li>
          </ul>
        </div>

        <div className="flex flex-col space-y-3">
          <Button 
            onClick={() => router.push('/')}
            className="w-full"
          >
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  )
}