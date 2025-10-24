import { supabase } from "@/lib/supabase/typed-client"
import { Profile, ProfileInsert, ProfileUpdate } from "@/types/database"

export const getProfileByUserId = async (userId: string): Promise<Profile | null> => {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return profile
}

export const getProfilesByUserId = async (userId: string): Promise<Profile[]> => {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)

  if (error) {
    throw new Error(error.message)
  }

  return profiles || []
}

export const createProfile = async (profile: ProfileInsert): Promise<Profile> => {
  const { data: createdProfile, error } = await supabase
    .from("profiles")
    .insert([profile])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdProfile
}

export const updateProfile = async (
  userId: string,
  profile: ProfileUpdate
): Promise<Profile> => {
  // First, try to get the existing profile
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (existingProfile) {
    // Profile exists, update it
    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("user_id", userId)
      .select("*")
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return updatedProfile
  } else {
    // Profile doesn't exist, create it
    const { data: createdProfile, error } = await supabase
      .from("profiles")
      .insert([{ user_id: userId, ...profile }])
      .select("*")
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return createdProfile
  }
}

export const deleteProfile = async (profileId: string): Promise<boolean> => {
  const { error } = await supabase.from("profiles").delete().eq("id", profileId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}
