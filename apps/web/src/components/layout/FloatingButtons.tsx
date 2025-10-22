'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { TwitterIcon } from '@/components/ui/twitter-icon'
import { usePathname } from 'next/navigation'

export function FloatingButtons() {
  const pathname = usePathname()
  
  // Only show floating buttons on the home page
  if (pathname !== '/') {
    return null
  }

  return (
    <>
      {/* Theme toggle - bottom left */}
      <div className="fixed bottom-6 left-6 z-50">
        <ThemeToggle />
      </div>
      
      {/* Twitter/X button - bottom right */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          className="text-black dark:text-white bg-transparent border-none cursor-pointer"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <TwitterIcon className="h-8 w-8" />
        </motion.button>
      </div>
    </>
  )
}