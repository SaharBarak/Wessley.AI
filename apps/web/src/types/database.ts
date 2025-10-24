// Manual type definitions based on the database migration
// This provides type safety while the Supabase types are not properly generated

export interface Profile {
  id: string
  user_id: string
  email?: string | null
  full_name?: string | null
  avatar_url?: string | null
  username?: string | null
  display_name?: string | null
  bio?: string | null
  profile_context?: string | null
  image_url?: string | null
  image_path?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface UserOnboarding {
  id: string
  user_id: string
  has_completed?: boolean | null
  started_at?: string | null
  completed_at?: string | null
  vehicle_expertise?: string | null
  electrical_experience?: string | null
  primary_goals?: string[] | null
  vehicle_types?: string[] | null
  preferred_assistance_style?: string | null
  notification_timing?: string | null
  share_projects?: boolean | null
  share_progress?: boolean | null
  allow_community_help?: boolean | null
  default_workspace_visibility?: string | null
  auto_backup_enabled?: boolean | null
  expense_tracking_enabled?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export interface UserPreferences {
  id: string
  user_id: string
  preferred_units?: string | null
  email_notifications?: boolean | null
  push_notifications?: boolean | null
  weekly_digest?: boolean | null
  project_updates?: boolean | null
  community_mentions?: boolean | null
  analytics_enabled?: boolean | null
  data_sharing_consent?: boolean | null
  profile_visibility?: string | null
  theme?: string | null
  language?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface UserSocialLink {
  id: string
  user_id: string
  platform: string
  url: string
  verified?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

// Insert types (for creating new records)
export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type UserOnboardingInsert = Omit<UserOnboarding, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type UserPreferencesInsert = Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type UserSocialLinkInsert = Omit<UserSocialLink, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

// Update types (partial records for updates)
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'user_id' | 'created_at'>> & {
  updated_at?: string
}

export type UserOnboardingUpdate = Partial<Omit<UserOnboarding, 'id' | 'user_id' | 'created_at'>> & {
  updated_at?: string
}

export type UserPreferencesUpdate = Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at'>> & {
  updated_at?: string
}

export type UserSocialLinkUpdate = Partial<Omit<UserSocialLink, 'id' | 'user_id' | 'created_at'>> & {
  updated_at?: string
}