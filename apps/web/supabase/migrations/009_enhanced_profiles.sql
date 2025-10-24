-- 009_enhanced_profiles.sql - Enhanced user profiles with proper separation of concerns
-- Creates separate tables for profiles, onboarding, and preferences

-- =========================================
-- ENHANCED PROFILES TABLE
-- =========================================

-- Core profile identity fields only
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_context TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS image_path TEXT;

-- =========================================
-- USER ONBOARDING TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Onboarding completion status
  has_completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Vehicle expertise and experience
  vehicle_expertise TEXT DEFAULT 'beginner' CHECK (vehicle_expertise IN ('beginner', 'intermediate', 'expert')),
  electrical_experience TEXT DEFAULT 'none' CHECK (electrical_experience IN ('none', 'basic', 'intermediate', 'advanced')),
  
  -- User goals and interests (stored as arrays)
  primary_goals TEXT[] DEFAULT '{}' CHECK (
    primary_goals <@ ARRAY['diagnosis', 'maintenance', 'upgrades', 'learning', 'troubleshooting', 'performance', 'restoration']
  ),
  vehicle_types TEXT[] DEFAULT '{}' CHECK (
    vehicle_types <@ ARRAY['car', 'motorcycle', 'truck', 'boat', 'rv', 'atv', 'heavy_equipment']
  ),
  
  -- Assistance preferences
  preferred_assistance_style TEXT DEFAULT 'step_by_step' CHECK (
    preferred_assistance_style IN ('step_by_step', 'overview', 'technical_details', 'visual_guide')
  ),
  
  -- Communication preferences
  notification_timing TEXT DEFAULT 'daily_digest' CHECK (
    notification_timing IN ('immediate', 'daily_digest', 'weekly_summary', 'never')
  ),
  
  -- Privacy and sharing preferences
  share_projects BOOLEAN DEFAULT false,
  share_progress BOOLEAN DEFAULT false,
  allow_community_help BOOLEAN DEFAULT true,
  
  -- Workspace defaults
  default_workspace_visibility TEXT DEFAULT 'private' CHECK (
    default_workspace_visibility IN ('private', 'unlisted', 'public')
  ),
  auto_backup_enabled BOOLEAN DEFAULT true,
  expense_tracking_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT user_onboarding_user_id_unique UNIQUE (user_id)
);

-- =========================================
-- USER SOCIAL LINKS TABLE
-- =========================================

CREATE TABLE IF NOT EXISTS public.user_social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'github', 'youtube', 'twitter', 'linkedin', 'website')),
  url TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT user_social_links_user_platform_unique UNIQUE (user_id, platform)
);

-- =========================================
-- USER PREFERENCES TABLE (App Settings)
-- =========================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Vehicle assistant preferences (moved from profiles)
  preferred_units TEXT DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
  
  -- Notification preferences (enhanced from profiles)
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT true,
  project_updates BOOLEAN DEFAULT true,
  community_mentions BOOLEAN DEFAULT true,
  
  -- Privacy settings
  analytics_enabled BOOLEAN DEFAULT true,
  data_sharing_consent BOOLEAN DEFAULT false,
  profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('private', 'public', 'community')),
  
  -- UI/UX preferences
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'en',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT user_preferences_user_id_unique UNIQUE (user_id)
);

-- =========================================
-- CONSTRAINTS AND INDEXES
-- =========================================

-- Profile constraints
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_length 
  CHECK (username IS NULL OR (char_length(username) >= 3 AND char_length(username) <= 30));

ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format 
  CHECK (username IS NULL OR username ~ '^[a-zA-Z0-9_-]+$');

-- Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique 
  ON public.profiles(username) WHERE username IS NOT NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON public.user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_has_completed ON public.user_onboarding(has_completed);
CREATE INDEX IF NOT EXISTS idx_user_social_links_user_id ON public.user_social_links(user_id);
CREATE INDEX IF NOT EXISTS idx_user_social_links_platform ON public.user_social_links(platform);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

-- Enable RLS on new tables
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Onboarding policies
CREATE POLICY "Users can manage own onboarding" ON public.user_onboarding
  FOR ALL USING (auth.uid() = user_id);

-- Social links policies
CREATE POLICY "Users can manage own social links" ON public.user_social_links
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public social links" ON public.user_social_links
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.user_preferences up 
      WHERE up.user_id = user_social_links.user_id 
      AND up.profile_visibility IN ('public', 'community')
    )
  );

-- Preferences policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- =========================================
-- FUNCTIONS AND TRIGGERS
-- =========================================

-- Update the handle_new_user function to create records in all tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  suggested_username TEXT;
  username_counter INTEGER := 1;
  final_username TEXT;
BEGIN
  -- Generate a suggested username from email
  suggested_username := regexp_replace(
    lower(split_part(NEW.email, '@', 1)), 
    '[^a-zA-Z0-9_-]', 
    '', 
    'g'
  );
  
  -- Ensure username is at least 3 characters
  IF char_length(suggested_username) < 3 THEN
    suggested_username := 'user' || floor(random() * 10000)::TEXT;
  END IF;
  
  final_username := suggested_username;
  
  -- Ensure username uniqueness
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := suggested_username || username_counter::TEXT;
    username_counter := username_counter + 1;
  END LOOP;

  -- Create profile record
  INSERT INTO public.profiles (
    user_id, 
    email, 
    full_name, 
    avatar_url,
    username,
    display_name,
    image_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', final_username),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Create onboarding record
  INSERT INTO public.user_onboarding (user_id, has_completed)
  VALUES (NEW.id, false);

  -- Create preferences record
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- HELPER FUNCTIONS
-- =========================================

-- Function to complete onboarding
CREATE OR REPLACE FUNCTION public.complete_user_onboarding(
  p_user_id UUID,
  p_onboarding_updates JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_onboarding 
  SET 
    has_completed = true,
    completed_at = NOW(),
    updated_at = NOW(),
    vehicle_expertise = COALESCE((p_onboarding_updates->>'vehicle_expertise')::TEXT, vehicle_expertise),
    electrical_experience = COALESCE((p_onboarding_updates->>'electrical_experience')::TEXT, electrical_experience),
    primary_goals = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p_onboarding_updates->'primary_goals')),
      primary_goals
    ),
    vehicle_types = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p_onboarding_updates->'vehicle_types')),
      vehicle_types
    ),
    preferred_assistance_style = COALESCE((p_onboarding_updates->>'preferred_assistance_style')::TEXT, preferred_assistance_style),
    notification_timing = COALESCE((p_onboarding_updates->>'notification_timing')::TEXT, notification_timing),
    share_projects = COALESCE((p_onboarding_updates->>'share_projects')::BOOLEAN, share_projects),
    share_progress = COALESCE((p_onboarding_updates->>'share_progress')::BOOLEAN, share_progress),
    allow_community_help = COALESCE((p_onboarding_updates->>'allow_community_help')::BOOLEAN, allow_community_help),
    default_workspace_visibility = COALESCE((p_onboarding_updates->>'default_workspace_visibility')::TEXT, default_workspace_visibility),
    auto_backup_enabled = COALESCE((p_onboarding_updates->>'auto_backup_enabled')::BOOLEAN, auto_backup_enabled),
    expense_tracking_enabled = COALESCE((p_onboarding_updates->>'expense_tracking_enabled')::BOOLEAN, expense_tracking_enabled)
  WHERE user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add social link
CREATE OR REPLACE FUNCTION public.add_user_social_link(
  p_user_id UUID,
  p_platform TEXT,
  p_url TEXT
)
RETURNS UUID AS $$
DECLARE
  link_id UUID;
BEGIN
  INSERT INTO public.user_social_links (user_id, platform, url)
  VALUES (p_user_id, p_platform, p_url)
  ON CONFLICT (user_id, platform) 
  DO UPDATE SET url = EXCLUDED.url, updated_at = NOW()
  RETURNING id INTO link_id;
  
  RETURN link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- UPDATE TRIGGERS
-- =========================================

-- Update triggers for updated_at timestamps on new tables
CREATE TRIGGER update_user_onboarding_updated_at BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_social_links_updated_at BEFORE UPDATE ON public.user_social_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- DATA MIGRATION FOR EXISTING USERS
-- =========================================

-- Update existing profiles to have sensible defaults for new fields
UPDATE public.profiles 
SET 
  username = COALESCE(username, 'user' || floor(random() * 10000)::TEXT),
  display_name = COALESCE(display_name, full_name, email, 'User'),
  image_url = COALESCE(image_url, avatar_url)
WHERE username IS NULL OR display_name IS NULL OR image_url IS NULL;

-- Create onboarding records for existing users
INSERT INTO public.user_onboarding (user_id, has_completed)
SELECT user_id, false
FROM public.profiles 
WHERE user_id NOT IN (SELECT user_id FROM public.user_onboarding);

-- Create preference records for existing users  
INSERT INTO public.user_preferences (user_id)
SELECT user_id
FROM public.profiles 
WHERE user_id NOT IN (SELECT user_id FROM public.user_preferences);

-- Migrate existing preference data from profiles to user_preferences
UPDATE public.user_preferences up
SET 
  preferred_units = COALESCE(p.preferred_units, up.preferred_units),
  analytics_enabled = COALESCE(p.analytics_enabled, up.analytics_enabled),
  email_notifications = COALESCE((p.notification_preferences->>'email')::BOOLEAN, up.email_notifications),
  push_notifications = COALESCE((p.notification_preferences->>'push')::BOOLEAN, up.push_notifications)
FROM public.profiles p
WHERE up.user_id = p.user_id;