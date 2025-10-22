-- 001_core_foundation.sql - Core workspace-centric foundation
-- Profiles, workspaces, vehicles, basic posts, vehicle signature generation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For secure random generation

-- =========================================
-- CORE USER & WORKSPACE MANAGEMENT
-- =========================================

-- Enhanced profiles table for user data and preferences
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- User preferences for vehicle assistant
  preferred_units TEXT DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
  experience_level TEXT DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
  notification_preferences JSONB DEFAULT '{"email": true, "push": false}'::jsonb,
  
  -- Data company analytics preferences
  analytics_enabled BOOLEAN DEFAULT true,
  data_sharing_consent BOOLEAN DEFAULT false,
  
  -- User statistics
  total_workspaces INTEGER DEFAULT 0,
  total_expenses DECIMAL(12,2) DEFAULT 0.00,
  
  CONSTRAINT profiles_user_id_unique UNIQUE (user_id)
);

-- Workspaces table (Project = Vehicle = Workspace)
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User-facing project details
  name TEXT NOT NULL, -- User-defined project name
  description TEXT,
  
  -- Vehicle signature for Neo4j bridge (auto-generated, immutable)
  vehicle_signature TEXT NOT NULL UNIQUE,
  
  -- Workspace status and visibility
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'unlisted', 'public')),
  
  -- Financial tracking
  total_budget DECIMAL(12,2),
  total_expenses DECIMAL(12,2) DEFAULT 0.00,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detailed vehicle information linked to workspaces
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Basic vehicle info (required)
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  
  -- Optional detailed info (builds vehicle profile)
  vin TEXT,
  engine_type TEXT,
  transmission_type TEXT,
  fuel_type TEXT,
  trim_level TEXT,
  market_region TEXT,
  body_style TEXT,
  drivetrain TEXT,
  
  -- Electrical system info
  electrical_voltage INTEGER DEFAULT 12 CHECK (electrical_voltage IN (12, 24, 48)),
  
  -- Additional vehicle data
  color TEXT,
  mileage_km INTEGER,
  purchase_date DATE,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Freeform posts within workspaces for different aspects/work
CREATE TABLE public.workspace_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  content TEXT,
  
  -- Post organization
  post_type TEXT DEFAULT 'general' CHECK (post_type IN ('general', 'electrical', 'maintenance', 'upgrade', 'diagnosis', 'repair', 'testing')),
  tags TEXT[] DEFAULT '{}',
  
  -- Financial tracking per post
  budget_allocated DECIMAL(12,2),
  expenses_total DECIMAL(12,2) DEFAULT 0.00,
  
  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- CREATE INDEXES FOR PERFORMANCE
-- =========================================

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_workspaces_user_id ON public.workspaces(user_id);
CREATE INDEX idx_workspaces_vehicle_signature ON public.workspaces(vehicle_signature);
CREATE INDEX idx_workspaces_status ON public.workspaces(status);
CREATE INDEX idx_workspaces_visibility ON public.workspaces(visibility);
CREATE INDEX idx_vehicles_workspace_id ON public.vehicles(workspace_id);
CREATE INDEX idx_workspace_posts_workspace_id ON public.workspace_posts(workspace_id);
CREATE INDEX idx_workspace_posts_user_id ON public.workspace_posts(user_id);
CREATE INDEX idx_workspace_posts_status ON public.workspace_posts(status);

-- Text search indexes
CREATE INDEX idx_workspaces_name_search ON public.workspaces USING GIN(to_tsvector('english', name));

-- =========================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_posts ENABLE ROW LEVEL SECURITY;

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Workspaces policies (core access control)
CREATE POLICY "Users can manage own workspaces" ON public.workspaces
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view public workspaces" ON public.workspaces
  FOR SELECT USING (visibility = 'public' OR auth.uid() = user_id);

-- Vehicles policies
CREATE POLICY "Users can manage vehicles in own workspaces" ON public.vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE workspaces.id = vehicles.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

-- Workspace posts policies
CREATE POLICY "Users can manage posts in own workspaces" ON public.workspace_posts
  FOR ALL USING (auth.uid() = user_id);

-- =========================================
-- FUNCTIONS AND TRIGGERS
-- =========================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate vehicle signatures
CREATE OR REPLACE FUNCTION public.generate_vehicle_signature(
  p_make TEXT,
  p_model TEXT,
  p_year INTEGER,
  p_user_id UUID
)
RETURNS TEXT AS $$
DECLARE
  base_signature TEXT;
  final_signature TEXT;
  counter INTEGER := 1;
BEGIN
  -- Create base signature: make_model_year_randomstring
  base_signature := lower(
    regexp_replace(p_make, '[^a-zA-Z0-9]', '', 'g') || '_' ||
    regexp_replace(p_model, '[^a-zA-Z0-9]', '', 'g') || '_' ||
    p_year::TEXT || '_' ||
    substr(encode(gen_random_bytes(4), 'hex'), 1, 6)
  );
  
  final_signature := base_signature;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.workspaces WHERE vehicle_signature = final_signature) LOOP
    final_signature := base_signature || '_' || counter::TEXT;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_signature;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update workspace activity timestamp
CREATE OR REPLACE FUNCTION public.update_workspace_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.workspaces 
  SET last_activity_at = NOW() 
  WHERE id = NEW.workspace_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- CREATE TRIGGERS
-- =========================================

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update triggers for updated_at timestamps
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_posts_updated_at BEFORE UPDATE ON public.workspace_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Activity tracking triggers
CREATE TRIGGER update_workspace_activity_on_post AFTER INSERT ON public.workspace_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_workspace_activity();