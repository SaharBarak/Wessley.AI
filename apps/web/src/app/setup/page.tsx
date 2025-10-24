"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  IconCar, 
  IconUser, 
  IconSettings, 
  IconCheck,
  IconChevronRight,
  IconChevronLeft,
  IconBrandGithub,
  IconBrandInstagram
} from "@tabler/icons-react"
import { getUserOnboarding, updateUserOnboarding, completeOnboarding } from "@/db/user-onboarding"
import { getUserPreferences, updateUserPreferences } from "@/db/user-preferences"
import { getProfileByUserId, updateProfile } from "@/db/profile"
import { addUserSocialLink } from "@/db/user-social-links"

const STEPS = [
  { id: 1, title: "Profile", icon: IconUser, description: "Tell us about yourself" },
  { id: 2, title: "Vehicle Expertise", icon: IconCar, description: "Your automotive background" },
  { id: 3, title: "Preferences", icon: IconSettings, description: "Customize your experience" },
  { id: 4, title: "Complete", icon: IconCheck, description: "You're all set!" }
]

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string>("")

  // Step 2: Profile data
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [instagramUrl, setInstagramUrl] = useState("")

  // Step 3: Vehicle expertise data
  const [vehicleExpertise, setVehicleExpertise] = useState<string>("beginner")
  const [electricalExperience, setElectricalExperience] = useState<string>("basic")
  const [primaryGoals, setPrimaryGoals] = useState<string[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([])

  // Step 4: Preferences data
  const [assistanceStyle, setAssistanceStyle] = useState<string>("overview")
  const [notificationTiming, setNotificationTiming] = useState<string>("daily_digest")
  const [shareProjects, setShareProjects] = useState(false)
  const [allowCommunityHelp, setAllowCommunityHelp] = useState(true)
  const [preferredUnits, setPreferredUnits] = useState<string>("metric")

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push("/")
        return
      }

      setUserId(session.user.id)
      
      // Load existing data if available
      try {
        const [profile, onboarding, preferences] = await Promise.all([
          getProfileByUserId(session.user.id).catch(() => null),
          getUserOnboarding(session.user.id).catch(() => null),
          getUserPreferences(session.user.id).catch(() => null)
        ])

        if (profile) {
          setDisplayName(profile.display_name || "")
          setBio(profile.bio || "")
        }

        if (onboarding && !onboarding.has_completed) {
          setVehicleExpertise(onboarding.vehicle_expertise || "beginner")
          setElectricalExperience(onboarding.electrical_experience || "basic")
          setPrimaryGoals(onboarding.primary_goals || [])
          setVehicleTypes(onboarding.vehicle_types || [])
          setAssistanceStyle(onboarding.preferred_assistance_style || "overview")
          setNotificationTiming(onboarding.notification_timing || "daily_digest")
          setShareProjects(onboarding.share_projects || false)
          setAllowCommunityHelp(onboarding.allow_community_help || true)
        }

        if (preferences) {
          setPreferredUnits(preferences.preferred_units || "metric")
        }
      } catch (error) {
        console.error("Error loading user data:", error)
      }
    }

    getUser()
  }, [router])

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleArrayValue = (array: string[], value: string, setter: (arr: string[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value))
    } else {
      setter([...array, value])
    }
  }

  const handleComplete = async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      // Update profile
      await updateProfile(userId, {
        display_name: displayName,
        bio: bio
      })

      // Add social links if provided
      if (githubUrl) {
        await addUserSocialLink(userId, "github", githubUrl)
      }
      if (instagramUrl) {
        await addUserSocialLink(userId, "instagram", instagramUrl)
      }

      // Update preferences
      await updateUserPreferences(userId, {
        preferred_units: preferredUnits as "metric" | "imperial"
      })

      // Complete onboarding
      console.log("🚀 Completing onboarding for user:", userId)
      const onboardingResult = await completeOnboarding(userId, {
        vehicle_expertise: vehicleExpertise,
        electrical_experience: electricalExperience,
        primary_goals: primaryGoals,
        vehicle_types: vehicleTypes,
        preferred_assistance_style: assistanceStyle,
        notification_timing: notificationTiming,
        share_projects: shareProjects,
        allow_community_help: allowCommunityHelp
      })

      console.log("✅ Onboarding completion result:", onboardingResult)
      console.log("🔄 Redirecting to chat page")
      router.push("/chat")
    } catch (error) {
      console.error("Error completing setup:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-6">
      {/* Logo */}
      <div className="absolute top-6 left-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src="/logo-light.svg"
            alt="Wessley"
            width={60}
            height={20}
            className="dark:hidden"
          />
          <Image
            src="/logo-dark.svg"
            alt="Wessley"
            width={60}
            height={20}
            className="hidden dark:block"
          />
        </motion.div>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        {/* Steps Indicator */}
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex items-center gap-8 px-8 py-4 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg">
            {STEPS.map((step, index) => {
              const IconComponent = step.icon
              const isCompleted = currentStep > step.id
              const isActive = currentStep === step.id
              const isFuture = currentStep < step.id
              
              return (
                <motion.div 
                  key={step.id} 
                  className="flex flex-col items-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: isActive ? 1.1 : isCompleted ? 0.9 : 0.8,
                    opacity: 1
                  }}
                  transition={{ 
                    duration: 0.3, 
                    ease: "easeInOut",
                    delay: index * 0.1 
                  }}
                >
                  <motion.div 
                    className={`
                      flex items-center justify-center rounded-full border-2 transition-all duration-300 relative
                      ${isCompleted 
                        ? "w-10 h-10 bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/25" 
                        : isActive
                        ? "w-12 h-12 bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/30 ring-4 ring-primary/20"
                        : "w-10 h-10 border-muted-foreground/30 text-muted-foreground/60 hover:border-muted-foreground/50"
                      }
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent size={isActive ? 24 : 20} />
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-primary/20"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <Card className="min-h-[400px] shadow-xl shadow-black/5 border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {(() => {
                const IconComponent = STEPS[currentStep - 1].icon
                return (
                  <motion.div
                    className="flex-shrink-0 p-2 rounded-xl bg-primary/10 border border-primary/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    <IconComponent className="w-6 h-6 text-primary" />
                  </motion.div>
                )
              })()}
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold tracking-tight">{STEPS[currentStep - 1].title}</CardTitle>
                <CardDescription className="text-base text-muted-foreground/80">{STEPS[currentStep - 1].description}</CardDescription>
              </div>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Profile */}
            {currentStep === 1 && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">What should we call you?</h3>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">Tell us about yourself</h3>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="I'm passionate about..."
                      className="min-h-20 text-base"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Social Links (Optional)</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="github" className="flex items-center gap-2">
                        <IconBrandGithub size={16} />
                        GitHub
                      </Label>
                      <Input
                        id="github"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="flex items-center gap-2">
                        <IconBrandInstagram size={16} />
                        Instagram
                      </Label>
                      <Input
                        id="instagram"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="https://instagram.com/username"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Vehicle Expertise */}
            {currentStep === 2 && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div className="space-y-4 text-center">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">Primary Goals</h3>
                  <p className="text-sm text-muted-foreground/70 -mt-1">Select all that apply</p>
                  <div className="grid grid-cols-4 gap-2 max-w-xl mx-auto">
                    {["diagnosis", "maintenance", "upgrades", "learning", "troubleshooting", "performance", "restoration", "repairs"].map((goal, index) => {
                      const colors = [
                        "bg-blue-500 text-white hover:bg-blue-600 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700",
                        "bg-green-500 text-white hover:bg-green-600 data-[selected=true]:bg-green-50 data-[selected=true]:text-green-700",
                        "bg-purple-500 text-white hover:bg-purple-600 data-[selected=true]:bg-purple-50 data-[selected=true]:text-purple-700",
                        "bg-orange-500 text-white hover:bg-orange-600 data-[selected=true]:bg-orange-50 data-[selected=true]:text-orange-700",
                        "bg-rose-500 text-white hover:bg-rose-600 data-[selected=true]:bg-rose-50 data-[selected=true]:text-rose-700",
                        "bg-cyan-500 text-white hover:bg-cyan-600 data-[selected=true]:bg-cyan-50 data-[selected=true]:text-cyan-700",
                        "bg-amber-500 text-white hover:bg-amber-600 data-[selected=true]:bg-amber-50 data-[selected=true]:text-amber-700",
                        "bg-indigo-500 text-white hover:bg-indigo-600 data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700"
                      ]
                      return (
                        <motion.div
                          key={goal}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          animate={{ 
                            scale: primaryGoals.includes(goal) ? 1.08 : 1,
                            y: primaryGoals.includes(goal) ? -2 : 0
                          }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className={`cursor-pointer capitalize text-xs py-2 px-3 rounded-lg text-center transition-all duration-200 ${primaryGoals.includes(goal) ? 'font-semibold shadow-lg' : 'font-medium'} ${colors[index % colors.length]}`}
                          data-selected={primaryGoals.includes(goal)}
                          onClick={() => toggleArrayValue(primaryGoals, goal, setPrimaryGoals)}
                        >
                          {goal}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-4 text-center">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">Vehicle Types</h3>
                  <p className="text-sm text-muted-foreground/70 -mt-1">What do you work with?</p>
                  <div className="grid grid-cols-4 gap-2 max-w-xl mx-auto">
                    {["car", "motorcycle", "truck", "boat", "rv", "atv", "equipment", "other"].map((type, index) => {
                      const colors = [
                        "bg-emerald-500 text-white hover:bg-emerald-600 data-[selected=true]:bg-emerald-50 data-[selected=true]:text-emerald-700",
                        "bg-violet-500 text-white hover:bg-violet-600 data-[selected=true]:bg-violet-50 data-[selected=true]:text-violet-700",
                        "bg-red-500 text-white hover:bg-red-600 data-[selected=true]:bg-red-50 data-[selected=true]:text-red-700",
                        "bg-teal-500 text-white hover:bg-teal-600 data-[selected=true]:bg-teal-50 data-[selected=true]:text-teal-700",
                        "bg-pink-500 text-white hover:bg-pink-600 data-[selected=true]:bg-pink-50 data-[selected=true]:text-pink-700",
                        "bg-yellow-500 text-white hover:bg-yellow-600 data-[selected=true]:bg-yellow-50 data-[selected=true]:text-yellow-700",
                        "bg-slate-500 text-white hover:bg-slate-600 data-[selected=true]:bg-slate-50 data-[selected=true]:text-slate-700",
                        "bg-lime-500 text-white hover:bg-lime-600 data-[selected=true]:bg-lime-50 data-[selected=true]:text-lime-700"
                      ]
                      return (
                        <motion.div
                          key={type}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          animate={{ 
                            scale: vehicleTypes.includes(type) ? 1.08 : 1,
                            y: vehicleTypes.includes(type) ? -2 : 0
                          }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className={`cursor-pointer capitalize text-xs py-2 px-3 rounded-lg text-center transition-all duration-200 ${vehicleTypes.includes(type) ? 'font-semibold shadow-lg' : 'font-medium'} ${colors[index % colors.length]}`}
                          data-selected={vehicleTypes.includes(type)}
                          onClick={() => toggleArrayValue(vehicleTypes, type, setVehicleTypes)}
                        >
                          {type === "equipment" ? "heavy" : type}
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Preferences */}
            {currentStep === 3 && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >

                <div className="space-y-6 text-center">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">Measurement Units</h3>
                  <div className="flex justify-center">
                    <Tabs 
                      value={preferredUnits} 
                      onValueChange={setPreferredUnits}
                      className="w-auto"
                    >
                      <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                        <TabsTrigger value="metric" className="text-sm font-medium">
                          Metric
                        </TabsTrigger>
                        <TabsTrigger value="imperial" className="text-sm font-medium">
                          Imperial
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    {preferredUnits === 'metric' ? "km, kg, °C" : "miles, lbs, °F"}
                  </p>
                </div>

                <Separator />

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground text-center">Community Preferences</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/30">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Share My Projects</Label>
                        <p className="text-sm text-muted-foreground/70">
                          Allow others to see your vehicle projects
                        </p>
                      </div>
                      <Switch checked={shareProjects} onCheckedChange={setShareProjects} />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/30">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Allow Community Help</Label>
                        <p className="text-sm text-muted-foreground/70">
                          Let community members offer assistance
                        </p>
                      </div>
                      <Switch checked={allowCommunityHelp} onCheckedChange={setAllowCommunityHelp} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Complete */}
            {currentStep === 4 && (
              <motion.div 
                className="text-center space-y-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <motion.div 
                  className="space-y-6"
                  initial={{ y: 20 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 200 }}
                  >
                    <IconCheck size={72} className="mx-auto text-green-500" />
                  </motion.div>
                  <div className="space-y-3">
                    <motion.h2 
                      className="text-3xl font-bold tracking-tight"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                    >
                      Welcome to Wessley
                    </motion.h2>
                    <motion.p 
                      className="text-lg text-muted-foreground/80 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6, duration: 0.4 }}
                    >
                      Welcome to the world's first AI-driven automotive space, have fun! 🚗✨
                    </motion.p>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={handleComplete}
                      disabled={loading}
                      className="px-8 py-3 text-lg font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                      size="lg"
                    >
                      {loading ? "Setting up..." : "Continue to Chat"}
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </CardContent>
          </Card>
        </motion.div>

        {/* Navigation */}
        {currentStep < 4 && (
          <motion.div 
            className="flex justify-between mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <IconChevronLeft size={16} />
              Previous
            </Button>
          </motion.div>

          {currentStep < STEPS.length ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !displayName)
                }
                className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow bg-primary hover:bg-primary/90"
              >
                Next
                <IconChevronRight size={16} />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={handleComplete}
                disabled={loading}
                className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? "Completing..." : "Complete Setup"}
                <IconCheck size={16} />
              </Button>
            </motion.div>
          )}
          </motion.div>
        )}
      </div>
    </div>
  )
}