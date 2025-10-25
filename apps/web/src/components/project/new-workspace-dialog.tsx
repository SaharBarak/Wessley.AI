"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { IconPlus, IconCar, IconLoader2, IconSparkles, IconRocket } from "@tabler/icons-react"
import { createWorkspace } from "@/db/workspaces"
import { createVehicle } from "@/db/vehicles"
import { useContext } from "react"
import { ChatbotUIContext } from "@/context/context"
import { toast } from "sonner"

const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
})

type ProjectFormValues = z.infer<typeof projectFormSchema>

interface NewWorkspaceDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function NewWorkspaceDialog({ children, open: externalOpen, onOpenChange }: NewWorkspaceDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { profile, setWorkspaces, workspaces } = useContext(ChatbotUIContext)

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
    },
  })

  const onSubmit = async (values: ProjectFormValues) => {
    console.log('Form submitted with values:', values)
    console.log('Profile:', profile)
    
    if (!profile?.user_id) {
      toast.error("You must be logged in to create a project")
      return
    }

    setIsLoading(true)

    try {
      console.log('Creating workspace...')
      // Create workspace
      const newWorkspace = await createWorkspace({
        user_id: profile.user_id,
        name: values.name,
        vehicle_signature: `project-${Date.now()}`,
        status: "active",
        visibility: "private",
      })

      console.log('Workspace created:', newWorkspace)

      // Update workspaces list
      setWorkspaces([newWorkspace, ...workspaces])

      toast.success("Project created successfully!")
      setOpen(false)
      form.reset()

      // Navigate to the new project
      router.push(`/g/${newWorkspace.id}/project`)
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error("Failed to create project. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">New Project</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isLoading || !form.watch('name')?.trim()}>
                {isLoading ? (
                  <>
                    <IconLoader2 className="mr-2 h-3 w-3 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}