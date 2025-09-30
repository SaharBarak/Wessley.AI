'use client'

import { useAuthStore } from '@/stores/auth'

export default function Home() {
  const { isAuthenticated, user, signIn, signOut } = useAuthStore()

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
            {!isAuthenticated ? (
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
            ) : (
              <div>
                <h2 className="text-2xl font-semibold mb-4">
                  Welcome back, {user?.name}!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Ready to analyze your vehicle's electrical system?
                </p>
                <div className="space-x-4">
                  <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                    Upload Vehicle Photo
                  </button>
                  <button
                    onClick={signOut}
                    className="bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}