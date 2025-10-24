-- 010_add_subscription_field.sql - Add subscription/plan tracking to profiles

-- Add subscription field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'insiders' CHECK (subscription_tier IN ('free', 'insiders', 'pro', 'enterprise'));

-- Add subscription status and dates
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'expired', 'trial'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Update existing users to have 'insiders' tier by default
UPDATE public.profiles 
SET 
  subscription_tier = 'insiders',
  subscription_status = 'active',
  subscription_started_at = NOW()
WHERE subscription_tier IS NULL;

-- Add index for subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);