import { supabase } from "@/lib/supabase/typed-client"
import { UserSocialLink, UserSocialLinkInsert, UserSocialLinkUpdate } from "@/types/database"

export const getUserSocialLinks = async (userId: string): Promise<UserSocialLink[]> => {
  const { data: socialLinks, error } = await supabase
    .from("user_social_links")
    .select("*")
    .eq("user_id", userId)

  if (error) {
    throw new Error(error.message)
  }

  return socialLinks || []
}

export const createUserSocialLink = async (socialLink: UserSocialLinkInsert): Promise<UserSocialLink> => {
  const { data: createdSocialLink, error } = await supabase
    .from("user_social_links")
    .insert([socialLink])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdSocialLink
}

export const updateUserSocialLink = async (
  id: string,
  socialLink: UserSocialLinkUpdate
): Promise<UserSocialLink> => {
  const { data: updatedSocialLink, error } = await supabase
    .from("user_social_links")
    .update(socialLink)
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedSocialLink
}

export const deleteUserSocialLink = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from("user_social_links")
    .delete()
    .eq("id", id)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const addUserSocialLink = async (userId: string, platform: string, url: string): Promise<string> => {
  const { data, error } = await supabase.rpc("add_user_social_link", {
    p_user_id: userId,
    p_platform: platform,
    p_url: url
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}