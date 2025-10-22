-- 007_analytics_system.sql - Analytics and business intelligence
-- User interactions, performance metrics, business intelligence tracking

-- =========================================
-- ANALYTICS & BUSINESS INTELLIGENCE
-- =========================================

-- User interaction tracking for data company insights
CREATE TABLE public.user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  
  -- Interaction details
  action_type TEXT NOT NULL,
  feature_area TEXT NOT NULL,
  
  -- Context data
  page_url TEXT,
  element_id TEXT,
  element_type TEXT, -- 'button', 'link', 'form', 'dropdown', etc.
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Session tracking
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  
  -- Performance metrics
  response_time_ms INTEGER,
  
  -- User flow tracking
  previous_action_id UUID REFERENCES public.user_interactions(id) ON DELETE SET NULL,
  
  -- Geolocation (optional)
  country TEXT,
  region TEXT,
  city TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System performance metrics
CREATE TABLE public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metric identification
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  
  -- Metric values
  numeric_value DECIMAL(15,6),
  text_value TEXT,
  json_value JSONB,
  
  -- Context
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- System context
  service_name TEXT, -- '3d-model-service', 'graph-service', etc.
  environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  
  -- Metadata
  tags TEXT[],
  source TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business intelligence aggregated data
CREATE TABLE public.business_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Report details
  report_type TEXT NOT NULL,
  report_name TEXT NOT NULL,
  time_period TEXT, -- daily, weekly, monthly, quarterly
  
  -- Date range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Aggregated data
  data JSONB NOT NULL,
  
  -- Report metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generation_time_ms INTEGER,
  
  -- Report status
  status TEXT DEFAULT 'completed' CHECK (status IN ('generating', 'completed', 'failed')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User behavior analytics
CREATE TABLE public.user_behavior_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Behavior metrics
  total_sessions INTEGER DEFAULT 0,
  total_session_duration_seconds INTEGER DEFAULT 0,
  average_session_duration_seconds INTEGER DEFAULT 0,
  
  -- Feature usage
  features_used TEXT[],
  most_used_feature TEXT,
  feature_adoption_score DECIMAL(5,2) DEFAULT 0.00,
  
  -- Engagement metrics
  days_active_last_30 INTEGER DEFAULT 0,
  workspaces_created INTEGER DEFAULT 0,
  total_uploads INTEGER DEFAULT 0,
  total_analyses INTEGER DEFAULT 0,
  total_chat_messages INTEGER DEFAULT 0,
  total_expenses_tracked INTEGER DEFAULT 0,
  total_marketplace_purchases INTEGER DEFAULT 0,
  
  -- User journey
  signup_date DATE,
  first_workspace_date DATE,
  first_analysis_date DATE,
  first_purchase_date DATE,
  
  -- Calculated scores
  engagement_score DECIMAL(5,2) DEFAULT 0.00,
  retention_risk_score DECIMAL(5,2) DEFAULT 0.00,
  lifetime_value_score DECIMAL(5,2) DEFAULT 0.00,
  
  -- Last updated
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature usage tracking
CREATE TABLE public.feature_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Feature identification
  feature_name TEXT NOT NULL,
  feature_category TEXT NOT NULL,
  
  -- Usage metrics (for a specific time period)
  date DATE NOT NULL,
  
  -- Counts
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  total_usage_count INTEGER DEFAULT 0,
  
  -- Engagement
  average_usage_per_user DECIMAL(8,2) DEFAULT 0.00,
  median_usage_duration_seconds INTEGER DEFAULT 0,
  
  -- Success metrics
  success_rate DECIMAL(5,2) DEFAULT 0.00,
  error_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- User satisfaction
  satisfaction_score DECIMAL(3,2), -- 1-5 scale
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_feature_date UNIQUE (feature_name, date)
);

-- A/B testing framework
CREATE TABLE public.ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Test details
  test_name TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Test configuration
  variants JSONB NOT NULL, -- {"control": {...}, "variant_a": {...}}
  traffic_allocation JSONB NOT NULL, -- {"control": 50, "variant_a": 50}
  
  -- Test criteria
  target_metric TEXT NOT NULL,
  success_criteria TEXT,
  minimum_sample_size INTEGER DEFAULT 1000,
  
  -- Test status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  
  -- Timeline
  start_date DATE,
  end_date DATE,
  
  -- Results
  results JSONB,
  winning_variant TEXT,
  confidence_level DECIMAL(5,2),
  
  -- Metadata
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B test participant assignments
CREATE TABLE public.ab_test_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ab_test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Assignment
  variant_assigned TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Conversion tracking
  converted BOOLEAN DEFAULT false,
  conversion_date TIMESTAMPTZ,
  conversion_value DECIMAL(12,2),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT unique_test_user UNIQUE (ab_test_id, user_id)
);

-- Error and issue tracking
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Error identification
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_code TEXT,
  
  -- Context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  
  -- System context
  service_name TEXT,
  endpoint TEXT,
  method TEXT,
  
  -- Error details
  stack_trace TEXT,
  request_data JSONB,
  response_data JSONB,
  
  -- Browser/client info
  user_agent TEXT,
  ip_address INET,
  
  -- Severity
  severity TEXT DEFAULT 'error' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  
  -- Resolution tracking
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- CREATE INDEXES FOR PERFORMANCE
-- =========================================

-- User interactions indexes
CREATE INDEX idx_user_interactions_user_id ON public.user_interactions(user_id);
CREATE INDEX idx_user_interactions_workspace_id ON public.user_interactions(workspace_id);
CREATE INDEX idx_user_interactions_created_at ON public.user_interactions(created_at);
CREATE INDEX idx_user_interactions_action_type ON public.user_interactions(action_type);
CREATE INDEX idx_user_interactions_feature_area ON public.user_interactions(feature_area);
CREATE INDEX idx_user_interactions_session_id ON public.user_interactions(session_id);
CREATE INDEX idx_user_interactions_previous_action ON public.user_interactions(previous_action_id);

-- Performance metrics indexes
CREATE INDEX idx_performance_metrics_metric_type ON public.performance_metrics(metric_type);
CREATE INDEX idx_performance_metrics_metric_name ON public.performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_created_at ON public.performance_metrics(created_at);
CREATE INDEX idx_performance_metrics_workspace_id ON public.performance_metrics(workspace_id);
CREATE INDEX idx_performance_metrics_user_id ON public.performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_service ON public.performance_metrics(service_name);
CREATE INDEX idx_performance_metrics_tags ON public.performance_metrics USING GIN(tags);

-- Business intelligence indexes
CREATE INDEX idx_business_intelligence_report_type ON public.business_intelligence(report_type);
CREATE INDEX idx_business_intelligence_time_period ON public.business_intelligence(time_period);
CREATE INDEX idx_business_intelligence_date_range ON public.business_intelligence(start_date, end_date);
CREATE INDEX idx_business_intelligence_generated_at ON public.business_intelligence(generated_at);

-- User behavior analytics indexes
CREATE INDEX idx_user_behavior_user_id ON public.user_behavior_analytics(user_id);
CREATE INDEX idx_user_behavior_engagement_score ON public.user_behavior_analytics(engagement_score);
CREATE INDEX idx_user_behavior_retention_risk ON public.user_behavior_analytics(retention_risk_score);
CREATE INDEX idx_user_behavior_last_calculated ON public.user_behavior_analytics(last_calculated_at);

-- Feature usage indexes
CREATE INDEX idx_feature_usage_feature_name ON public.feature_usage_stats(feature_name);
CREATE INDEX idx_feature_usage_date ON public.feature_usage_stats(date);
CREATE INDEX idx_feature_usage_category ON public.feature_usage_stats(feature_category);

-- A/B testing indexes
CREATE INDEX idx_ab_tests_status ON public.ab_tests(status);
CREATE INDEX idx_ab_tests_dates ON public.ab_tests(start_date, end_date);
CREATE INDEX idx_ab_test_participants_test_id ON public.ab_test_participants(ab_test_id);
CREATE INDEX idx_ab_test_participants_user_id ON public.ab_test_participants(user_id);
CREATE INDEX idx_ab_test_participants_converted ON public.ab_test_participants(converted);

-- Error logs indexes
CREATE INDEX idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX idx_error_logs_workspace_id ON public.error_logs(workspace_id);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
CREATE INDEX idx_error_logs_resolved ON public.error_logs(resolved);
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at);

-- =========================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================

ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Admin/system tables (no user RLS)
-- performance_metrics, business_intelligence, feature_usage_stats, ab_tests

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- User interactions policies (users can only see their own interactions)
CREATE POLICY "Users can view own interactions" ON public.user_interactions
  FOR SELECT USING (auth.uid() = user_id);

-- User behavior analytics policies
CREATE POLICY "Users can view own behavior analytics" ON public.user_behavior_analytics
  FOR SELECT USING (auth.uid() = user_id);

-- A/B test participants policies
CREATE POLICY "Users can view own test participation" ON public.ab_test_participants
  FOR SELECT USING (auth.uid() = user_id);

-- Error logs policies (users can view errors they caused)
CREATE POLICY "Users can view own error logs" ON public.error_logs
  FOR SELECT USING (auth.uid() = user_id);

-- =========================================
-- ANALYTICS FUNCTIONS
-- =========================================

-- Function to track user interaction
CREATE OR REPLACE FUNCTION public.track_user_interaction(
  p_user_id UUID,
  p_workspace_id UUID,
  p_action_type TEXT,
  p_feature_area TEXT,
  p_page_url TEXT DEFAULT NULL,
  p_element_id TEXT DEFAULT NULL,
  p_element_type TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_response_time INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  interaction_id UUID;
  previous_action UUID;
BEGIN
  -- Get the most recent action for this session to create flow tracking
  SELECT id INTO previous_action
  FROM public.user_interactions 
  WHERE user_id = p_user_id 
  AND session_id = p_session_id 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  INSERT INTO public.user_interactions (
    user_id,
    workspace_id,
    action_type,
    feature_area,
    page_url,
    element_id,
    element_type,
    metadata,
    session_id,
    response_time_ms,
    previous_action_id
  ) VALUES (
    p_user_id,
    p_workspace_id,
    p_action_type,
    p_feature_area,
    p_page_url,
    p_element_id,
    p_element_type,
    COALESCE(p_metadata, '{}'::jsonb),
    p_session_id,
    p_response_time,
    previous_action
  ) RETURNING id INTO interaction_id;
  
  RETURN interaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user engagement score
CREATE OR REPLACE FUNCTION public.calculate_user_engagement_score(p_user_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  engagement_score DECIMAL(5,2) := 0.00;
  days_active INTEGER;
  feature_count INTEGER;
  total_actions INTEGER;
BEGIN
  -- Calculate various engagement factors
  
  -- Days active in last 30 days (weight: 30%)
  SELECT COUNT(DISTINCT DATE(created_at))
  INTO days_active
  FROM public.user_interactions 
  WHERE user_id = p_user_id 
  AND created_at >= NOW() - INTERVAL '30 days';
  
  engagement_score := engagement_score + (LEAST(days_active / 30.0, 1.0) * 30);
  
  -- Feature diversity (weight: 25%)
  SELECT COUNT(DISTINCT feature_area)
  INTO feature_count
  FROM public.user_interactions 
  WHERE user_id = p_user_id 
  AND created_at >= NOW() - INTERVAL '30 days';
  
  engagement_score := engagement_score + (LEAST(feature_count / 10.0, 1.0) * 25);
  
  -- Total actions (weight: 20%)
  SELECT COUNT(*)
  INTO total_actions
  FROM public.user_interactions 
  WHERE user_id = p_user_id 
  AND created_at >= NOW() - INTERVAL '30 days';
  
  engagement_score := engagement_score + (LEAST(total_actions / 500.0, 1.0) * 20);
  
  -- Additional factors (weight: 25%)
  -- Workspace creation, analyses, purchases, etc.
  SELECT engagement_score + (
    CASE WHEN EXISTS(SELECT 1 FROM public.workspaces WHERE user_id = p_user_id) THEN 5 ELSE 0 END +
    CASE WHEN EXISTS(SELECT 1 FROM public.electrical_analyses WHERE user_id = p_user_id) THEN 10 ELSE 0 END +
    CASE WHEN EXISTS(SELECT 1 FROM public.marketplace_transactions WHERE user_id = p_user_id) THEN 10 ELSE 0 END
  ) INTO engagement_score;
  
  RETURN LEAST(engagement_score, 100.00);
END;
$$ LANGUAGE plpgsql;

-- Function to update user behavior analytics
CREATE OR REPLACE FUNCTION public.update_user_behavior_analytics(p_user_id UUID)
RETURNS void AS $$
DECLARE
  behavior_record RECORD;
  engagement_score DECIMAL(5,2);
BEGIN
  -- Calculate engagement score
  engagement_score := public.calculate_user_engagement_score(p_user_id);
  
  -- Gather behavior metrics
  SELECT 
    COUNT(DISTINCT session_id) as total_sessions,
    COALESCE(SUM(response_time_ms), 0) as total_duration_ms,
    COUNT(DISTINCT feature_area) as unique_features,
    COUNT(*) as total_interactions,
    ARRAY_AGG(DISTINCT feature_area) as features_used,
    MODE() WITHIN GROUP (ORDER BY feature_area) as most_used_feature
  INTO behavior_record
  FROM public.user_interactions 
  WHERE user_id = p_user_id 
  AND created_at >= NOW() - INTERVAL '30 days';
  
  -- Insert or update behavior analytics
  INSERT INTO public.user_behavior_analytics (
    user_id,
    total_sessions,
    total_session_duration_seconds,
    average_session_duration_seconds,
    features_used,
    most_used_feature,
    engagement_score,
    days_active_last_30,
    last_calculated_at
  ) VALUES (
    p_user_id,
    behavior_record.total_sessions,
    behavior_record.total_duration_ms / 1000,
    CASE WHEN behavior_record.total_sessions > 0 
         THEN (behavior_record.total_duration_ms / 1000) / behavior_record.total_sessions 
         ELSE 0 END,
    behavior_record.features_used,
    behavior_record.most_used_feature,
    engagement_score,
    (SELECT COUNT(DISTINCT DATE(created_at)) 
     FROM public.user_interactions 
     WHERE user_id = p_user_id 
     AND created_at >= NOW() - INTERVAL '30 days'),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_sessions = EXCLUDED.total_sessions,
    total_session_duration_seconds = EXCLUDED.total_session_duration_seconds,
    average_session_duration_seconds = EXCLUDED.average_session_duration_seconds,
    features_used = EXCLUDED.features_used,
    most_used_feature = EXCLUDED.most_used_feature,
    engagement_score = EXCLUDED.engagement_score,
    days_active_last_30 = EXCLUDED.days_active_last_30,
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to generate business intelligence report
CREATE OR REPLACE FUNCTION public.generate_bi_report(
  p_report_type TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS UUID AS $$
DECLARE
  report_id UUID;
  report_data JSONB;
  start_time TIMESTAMPTZ;
BEGIN
  start_time := NOW();
  
  -- Generate different types of reports
  CASE p_report_type
    WHEN 'daily_active_users' THEN
      SELECT jsonb_build_object(
        'total_users', COUNT(DISTINCT user_id),
        'daily_breakdown', jsonb_agg(
          jsonb_build_object(
            'date', date,
            'active_users', daily_users
          )
        )
      ) INTO report_data
      FROM (
        SELECT 
          DATE(created_at) as date,
          COUNT(DISTINCT user_id) as daily_users
        FROM public.user_interactions 
        WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(created_at)
        ORDER BY date
      ) daily_stats;
      
    WHEN 'feature_usage' THEN
      SELECT jsonb_build_object(
        'features', jsonb_agg(
          jsonb_build_object(
            'feature_area', feature_area,
            'total_usage', usage_count,
            'unique_users', unique_users
          )
        )
      ) INTO report_data
      FROM (
        SELECT 
          feature_area,
          COUNT(*) as usage_count,
          COUNT(DISTINCT user_id) as unique_users
        FROM public.user_interactions 
        WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY feature_area
        ORDER BY usage_count DESC
      ) feature_stats;
      
    ELSE
      report_data := jsonb_build_object('error', 'Unknown report type');
  END CASE;
  
  -- Insert the report
  INSERT INTO public.business_intelligence (
    report_type,
    report_name,
    start_date,
    end_date,
    data,
    generation_time_ms,
    status
  ) VALUES (
    p_report_type,
    p_report_type || '_' || p_start_date || '_to_' || p_end_date,
    p_start_date,
    p_end_date,
    report_data,
    EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
    'completed'
  ) RETURNING id INTO report_id;
  
  RETURN report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- CREATE TRIGGERS
-- =========================================

-- Update behavior analytics when interactions change
CREATE OR REPLACE FUNCTION public.trigger_behavior_analytics_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user behavior analytics asynchronously (in a real system, this would be a background job)
  -- For now, we'll just mark it for update
  -- PERFORM public.update_user_behavior_analytics(NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- We'll create a lightweight trigger that doesn't slow down interactions
-- CREATE TRIGGER update_behavior_analytics AFTER INSERT ON public.user_interactions
--   FOR EACH ROW EXECUTE FUNCTION public.trigger_behavior_analytics_update();

-- Update timestamps
CREATE TRIGGER update_user_behavior_analytics_updated_at BEFORE UPDATE ON public.user_behavior_analytics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at BEFORE UPDATE ON public.ab_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();