'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { TwitterIcon } from '@/components/ui/twitter-icon'

export default function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    
    try {
      // Submit to our API route which handles Beehiiv integration
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email
        })
      })

      const result = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        setEmail('')
        console.log('Successfully subscribed:', result)
      } else {
        console.error('Failed to subscribe:', result.error)
        // You might want to show an error message to the user here
      }
    } catch (error) {
      console.error('Error submitting to waitlist:', error)
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false)
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  }

  const floatAnimation = {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }

  if (isSubmitted) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center">
        <motion.div 
          className="text-center space-y-6 max-w-md"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            animate={pulseAnimation}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>
          <h2 className="keania-one-regular tracking-wide text-3xl" style={{color: '#22E974'}}>
            YOU'RE IN!
          </h2>
          <p className="font-sans text-black dark:text-white font-semibold text-lg">
            Thanks for joining the waitlist — we'll let you know the moment Wessley is ready to power up your project car journey.
          </p>
          <p className="font-sans text-black/70 dark:text-white/70 text-sm">
            Stay tuned for early access and exclusive behind-the-hood updates. ⚡🚗
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center">
      <motion.div 
        className="relative z-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Column: Hero Content */}
        <div className="flex flex-col justify-center space-y-8 pl-8 lg:pl-12">
          <motion.div className="space-y-6" variants={itemVariants}>
            <motion.h1 
              className="keania-one-regular tracking-wide" 
              style={{color: '#22E974', fontSize: '52px'}}
              animate={{
                textShadow: [
                  '0 0 20px rgba(34, 233, 116, 0.3)',
                  '0 0 30px rgba(34, 233, 116, 0.5)',
                  '0 0 20px rgba(34, 233, 116, 0.3)'
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              MEET WESSLEY.
            </motion.h1>
            <motion.p 
              className="font-sans text-black dark:text-white max-w-lg font-semibold" 
              style={{fontSize: '24px'}}
              variants={itemVariants}
            >
              A virtual garage where Wessley, your personal vehicle guru, guides you.
            </motion.p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                <motion.div 
                  className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 h-12"
                    disabled={isLoading}
                  />
                </motion.div>
                <motion.div
                  whileHover={{ 
                    scale: 1.05,
                    backgroundColor: '#2AF57C',
                    borderRadius: '8px',
                    color: '#000000'
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  style={{ borderRadius: '8px' }}
                >
                  <Button 
                    type="submit"
                    size="lg" 
                    className="bg-primary text-black hover:bg-transparent hover:text-black px-8 py-3 rounded-lg font-inter font-black w-full sm:w-auto h-12"
                    style={{fontSize: '16px'}}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Joining...' : 'Join Waitlist →'}
                  </Button>
                </motion.div>
              </div>
              <motion.p 
                className="text-xs text-black/60 dark:text-white/60"
                variants={itemVariants}
              >
                We respect your privacy. Unsubscribe at any time.
              </motion.p>
            </form>
          </motion.div>
        </div>

        {/* Right Column: Animated Illustrations */}
        <motion.div 
          className="flex items-center justify-center"
          variants={itemVariants}
        >
          {/* Light mode illustration */}
          <motion.img 
            src="/illus-light.png" 
            alt="Wessley AI Illustration" 
            className="max-w-full h-auto dark:hidden"
            animate={floatAnimation}
            whileHover={{ 
              scale: 1.05,
              rotateY: 5,
              transition: { duration: 0.3 }
            }}
          />
          {/* Dark mode illustration */}
          <motion.img 
            src="/illus-dark.png" 
            alt="Wessley AI Illustration" 
            className="max-w-full h-auto hidden dark:block"
            animate={floatAnimation}
            whileHover={{ 
              scale: 1.05,
              rotateY: 5,
              transition: { duration: 0.3 }
            }}
          />
        </motion.div>
      </motion.div>

      {/* Animated background elements */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay: 0
        }}
      />
      <motion.div
        className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary/40 rounded-full"
        animate={{
          scale: [1, 2, 1],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          delay: 1
        }}
      />
      <motion.div
        className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-primary/20 rounded-full"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          delay: 2
        }}
      />

      {/* Floating Buttons */}
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
    </div>
  )
}