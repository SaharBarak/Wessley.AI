'use client'

import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { useAuth } from '@/lib/hooks/use-auth'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface TopNavProps {
  onDashboardOpen?: () => void
}

export function TopNav({ onDashboardOpen }: TopNavProps = {}) {
  const { signInWithGoogle } = useAuth()

  return (
    <nav className="flex items-center justify-between px-6 py-4">
      {/* Left: Logo only */}
      <div className="flex items-center">
        <Logo />
      </div>
      
      {/* Right: All navigation items */}
      <div className="flex items-center space-x-6">
        {/* About and Contact buttons */}
        <div className="hidden space-x-6 md:flex">
          <Link 
            href="https://github.com/SaharBarak/wessley.ai" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-primary transition-colors font-inter font-bold"
          >
            About
          </Link>
          <Link 
            href="https://www.linkedin.com/in/saharbarak/" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-primary transition-colors font-inter font-bold"
          >
            Contact
          </Link>
        </div>
        
        {/* Login and Sign up buttons */}
        <div className="flex items-center space-x-2">
          <motion.div
            whileHover={{ 
              scale: 1.05,
              backgroundColor: '#2AF57C',
              borderColor: '#2AF57C',
              borderRadius: '12px',
              color: '#000000'
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ borderRadius: '12px' }}
          >
            <Button 
              variant="outline" 
              className="text-primary hover:bg-transparent hover:text-black px-6 py-2.5 rounded-xl bg-transparent font-inter font-black"
              style={{fontSize: '16px', borderColor: '#22E974'}}
              onClick={signInWithGoogle}
            >
              Login
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ 
              scale: 1.05,
              backgroundColor: '#2AF57C',
              borderRadius: '12px',
              color: '#000000'
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ borderRadius: '12px' }}
          >
            <Button 
              className="bg-primary text-black hover:bg-transparent hover:text-black px-6 py-2.5 rounded-xl font-inter font-black"
              style={{fontSize: '16px'}}
              onClick={signInWithGoogle}
            >
              Sign up
            </Button>
          </motion.div>
        </div>
      </div>
    </nav>
  )
}