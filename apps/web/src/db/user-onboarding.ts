import { supabase } from "@/lib/supabase/typed-client"
import { UserOnboarding, UserOnboardingInsert, UserOnboardingUpdate } from "@/types/database"

export const getUserOnboarding = async (userId: string): Promise<UserOnboarding | null> => {
  const { data: onboarding, error } = await supabase
    .from("user_onboarding")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return onboarding
}

export const createUserOnboarding = async (onboarding: UserOnboardingInsert): Promise<UserOnboarding> => {
  const { data: createdOnboarding, error } = await supabase
    .from("user_onboarding")
    .insert([onboarding])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdOnboarding
}

export const updateUserOnboarding = async (
  userId: string,
  onboarding: UserOnboardingUpdate
): Promise<UserOnboarding> => {
  const { data: updatedOnboarding, error } = await supabase
    .from("user_onboarding")
    .update(onboarding)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedOnboarding
}

export const completeOnboarding = async (userId: string, onboardingData?: any): Promise<boolean> => {
  // First try the RPC function
  const { data: rpcData, error: rpcError } = await supabase.rpc("complete_user_onboarding", {
    p_user_id: userId,
    p_onboarding_updates: onboardingData || null
  })

  // If RPC succeeded and returned true, we're done
  if (!rpcError && rpcData === true) {
    return true
  }

  // If RPC failed or returned false, try manual approach
  try {
    // Check if onboarding record exists
    const existingOnboarding = await getUserOnboarding(userId)
    
    if (existingOnboarding) {
      // Update existing record
      await updateUserOnboarding(userId, {
        has_completed: true,
        completed_at: new Date().toISOString(),
        ...onboardingData
      })
      return true
    } else {
      // Create new record
      await createUserOnboarding({
        user_id: userId,
        has_completed: true,
        completed_at: new Date().toISOString(),
        ...onboardingData
      })
      return true
    }
  } catch (manualError) {
    throw new Error(`Both RPC and manual approach failed. RPC error: ${rpcError?.message || 'RPC returned false'}. Manual error: ${manualError.message}`)
  }
}