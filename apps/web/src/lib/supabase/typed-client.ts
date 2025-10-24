import { createBrowserClient } from "@supabase/ssr"
import { Profile, UserOnboarding, UserPreferences, UserSocialLink } from "@/types/database"

// Define the database schema interface for type safety
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at'>> & {
          updated_at?: string
        }
      }
      user_onboarding: {
        Row: UserOnboarding
        Insert: Omit<UserOnboarding, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<UserOnboarding, 'id' | 'user_id' | 'created_at'>> & {
          updated_at?: string
        }
      }
      user_preferences: {
        Row: UserPreferences
        Insert: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at'>> & {
          updated_at?: string
        }
      }
      user_social_links: {
        Row: UserSocialLink
        Insert: Omit<UserSocialLink, 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<UserSocialLink, 'id' | 'user_id' | 'created_at'>> & {
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_user_onboarding: {
        Args: { 
          p_user_id: string
          p_onboarding_updates?: any 
        }
        Returns: boolean
      }
      add_user_social_link: {
        Args: {
          p_user_id: string
          p_platform: string
          p_url: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Create the typed client
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type { Database }