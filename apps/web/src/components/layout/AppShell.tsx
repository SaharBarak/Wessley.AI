'use client'

import { usePathname } from 'next/navigation'
import { TopNav } from './TopNav'
import { FloatingButtons } from './FloatingButtons'

interface AppShellProps {
  children: React.ReactNode
  onDashboardOpen?: () => void
}

export function AppShell({ children, onDashboardOpen }: AppShellProps) {
  const pathname = usePathname()
  const hiddenNavRoutes = ['/chat', '/setup']
  const shouldHideNav = hiddenNavRoutes.includes(pathname) || 
                        pathname.startsWith('/g/') || 
                        pathname.startsWith('/c/')

  return (
    <div className="min-h-screen bg-transparent font-sans antialiased">
      {!shouldHideNav && <TopNav onDashboardOpen={onDashboardOpen} />}
      <main className={shouldHideNav ? "h-screen" : "container mx-auto px-6"}>
        {children}
      </main>
      {!shouldHideNav && <FloatingButtons />}
    </div>
  )
}