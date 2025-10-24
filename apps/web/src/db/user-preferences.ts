import { supabase } from "@/lib/supabase/typed-client"
import { UserPreferences, UserPreferencesInsert, UserPreferencesUpdate } from "@/types/database"

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  const { data: preferences, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return preferences
}

export const createUserPreferences = async (preferences: UserPreferencesInsert): Promise<UserPreferences> => {
  const { data: createdPreferences, error } = await supabase
    .from("user_preferences")
    .insert([preferences])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdPreferences
}

export const updateUserPreferences = async (
  userId: string,
  preferences: UserPreferencesUpdate
): Promise<UserPreferences> => {
  // First, try to get the existing preferences
  const { data: existingPreferences } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (existingPreferences) {
    // Preferences exist, update them
    const { data: updatedPreferences, error } = await supabase
      .from("user_preferences")
      .update(preferences)
      .eq("user_id", userId)
      .select("*")
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return updatedPreferences
  } else {
    // Preferences don't exist, create them
    const { data: createdPreferences, error } = await supabase
      .from("user_preferences")
      .insert([{ user_id: userId, ...preferences }])
      .select("*")
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return createdPreferences
  }
}