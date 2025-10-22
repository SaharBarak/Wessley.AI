-- 006_neo4j_bridge.sql - Neo4j integration and electrical data bridge
-- Electrical analyses, Neo4j sync status, technical data integration

-- =========================================
-- NEO4J BRIDGE & ELECTRICAL DATA
-- =========================================

-- Electrical analysis job tracking (no component storage - data in Neo4j)
CREATE TABLE public.electrical_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_file_id UUID REFERENCES public.media_files(id) ON DELETE SET NULL,
  
  -- Job tracking
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Neo4j integration
  vehicle_signature TEXT NOT NULL, -- Links to workspace.vehicle_signature
  neo4j_graph_id TEXT, -- Reference to Neo4j graph
  neo4j_session_id TEXT, -- Neo4j session identifier
  
  -- AI analysis metadata
  ai_model_version TEXT DEFAULT 'gpt-4-vision-preview',
  processing_time_ms INTEGER,
  confidence_score DECIMAL(3,2),
  
  -- Analysis results summary (detailed data in Neo4j)
  components_detected_count INTEGER DEFAULT 0,
  connections_detected_count INTEGER DEFAULT 0,
  faults_detected_count INTEGER DEFAULT 0,
  circuits_identified_count INTEGER DEFAULT 0,
  
  -- Analysis input details
  source_image_url TEXT,
  analysis_prompt_used TEXT,
  
  -- Error handling
  error_message TEXT,
  error_code TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Quality metrics
  image_quality_score DECIMAL(3,2),
  component_visibility_score DECIMAL(3,2),
  wire_clarity_score DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_retry_at TIMESTAMPTZ
);

-- Neo4j synchronization status tracking
CREATE TABLE public.neo4j_sync_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  vehicle_signature TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
  
  -- Sync metadata
  components_synced INTEGER DEFAULT 0,
  connections_synced INTEGER DEFAULT 0,
  circuits_synced INTEGER DEFAULT 0,
  sync_duration_ms INTEGER,
  
  -- Data integrity
  checksum TEXT, -- For data integrity verification
  neo4j_version TEXT,
  schema_version TEXT DEFAULT '1.0',
  
  -- Error tracking
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  
  -- Sync configuration
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_frequency_minutes INTEGER DEFAULT 30,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_workspace_sync UNIQUE (workspace_id)
);

-- Analysis job queue for processing electrical images
CREATE TABLE public.analysis_job_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  electrical_analysis_id UUID NOT NULL REFERENCES public.electrical_analyses(id) ON DELETE CASCADE,
  
  -- Job details
  job_type TEXT NOT NULL CHECK (job_type IN ('image_analysis', 'component_extraction', 'circuit_mapping', 'fault_detection')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest priority
  
  -- Processing status
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  
  -- Worker assignment
  worker_id TEXT,
  assigned_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Job configuration
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Results and errors
  result_data JSONB,
  error_details JSONB,
  
  -- Retry logic
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Component detection cache for faster repeated analysis
CREATE TABLE public.component_detection_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Image identification
  image_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of image content
  image_size_bytes INTEGER NOT NULL,
  image_dimensions TEXT, -- "1920x1080"
  
  -- Detection results
  components_detected JSONB NOT NULL,
  detection_confidence DECIMAL(3,2) NOT NULL,
  
  -- Analysis metadata
  ai_model_used TEXT NOT NULL,
  analysis_version TEXT DEFAULT '1.0',
  processing_time_ms INTEGER,
  
  -- Cache management
  hit_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Neo4j operation logs for debugging and monitoring
CREATE TABLE public.neo4j_operation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Operation details
  operation_type TEXT NOT NULL CHECK (operation_type IN ('create_graph', 'update_graph', 'delete_graph', 'query', 'sync')),
  vehicle_signature TEXT,
  
  -- Cypher query information
  cypher_query TEXT,
  query_parameters JSONB,
  
  -- Execution details
  execution_time_ms INTEGER,
  records_affected INTEGER,
  
  -- Status and results
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'timeout')),
  result_summary JSONB,
  error_message TEXT,
  
  -- Context
  initiated_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- CREATE INDEXES FOR PERFORMANCE
-- =========================================

-- Electrical analyses indexes
CREATE INDEX idx_electrical_analyses_workspace_id ON public.electrical_analyses(workspace_id);
CREATE INDEX idx_electrical_analyses_user_id ON public.electrical_analyses(user_id);
CREATE INDEX idx_electrical_analyses_media_file_id ON public.electrical_analyses(media_file_id);
CREATE INDEX idx_electrical_analyses_status ON public.electrical_analyses(analysis_status);
CREATE INDEX idx_electrical_analyses_vehicle_signature ON public.electrical_analyses(vehicle_signature);
CREATE INDEX idx_electrical_analyses_created_at ON public.electrical_analyses(created_at);
CREATE INDEX idx_electrical_analyses_completed_at ON public.electrical_analyses(completed_at);

-- Neo4j sync indexes
CREATE INDEX idx_neo4j_sync_workspace_id ON public.neo4j_sync_status(workspace_id);
CREATE INDEX idx_neo4j_sync_vehicle_signature ON public.neo4j_sync_status(vehicle_signature);
CREATE INDEX idx_neo4j_sync_status ON public.neo4j_sync_status(sync_status);
CREATE INDEX idx_neo4j_sync_last_sync ON public.neo4j_sync_status(last_sync_at);
CREATE INDEX idx_neo4j_sync_auto_enabled ON public.neo4j_sync_status(auto_sync_enabled) WHERE auto_sync_enabled = true;

-- Analysis job queue indexes
CREATE INDEX idx_analysis_job_queue_analysis_id ON public.analysis_job_queue(electrical_analysis_id);
CREATE INDEX idx_analysis_job_queue_status ON public.analysis_job_queue(status);
CREATE INDEX idx_analysis_job_queue_priority ON public.analysis_job_queue(priority, created_at);
CREATE INDEX idx_analysis_job_queue_worker_id ON public.analysis_job_queue(worker_id);
CREATE INDEX idx_analysis_job_queue_retry ON public.analysis_job_queue(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- Component detection cache indexes
CREATE INDEX idx_component_cache_hash ON public.component_detection_cache(image_hash);
CREATE INDEX idx_component_cache_expires ON public.component_detection_cache(expires_at);
CREATE INDEX idx_component_cache_last_accessed ON public.component_detection_cache(last_accessed_at);
CREATE INDEX idx_component_cache_ai_model ON public.component_detection_cache(ai_model_used, analysis_version);

-- Neo4j operation logs indexes
CREATE INDEX idx_neo4j_logs_workspace_id ON public.neo4j_operation_logs(workspace_id);
CREATE INDEX idx_neo4j_logs_vehicle_signature ON public.neo4j_operation_logs(vehicle_signature);
CREATE INDEX idx_neo4j_logs_operation_type ON public.neo4j_operation_logs(operation_type);
CREATE INDEX idx_neo4j_logs_status ON public.neo4j_operation_logs(status);
CREATE INDEX idx_neo4j_logs_created_at ON public.neo4j_operation_logs(created_at);
CREATE INDEX idx_neo4j_logs_user_id ON public.neo4j_operation_logs(initiated_by_user_id);

-- =========================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================

ALTER TABLE public.electrical_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neo4j_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_job_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neo4j_operation_logs ENABLE ROW LEVEL SECURITY;

-- Public/system tables (no RLS)
-- component_detection_cache (system-wide cache)

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Electrical analyses policies
CREATE POLICY "Users can manage analyses in own workspaces" ON public.electrical_analyses
  FOR ALL USING (auth.uid() = user_id);

-- Neo4j sync status policies
CREATE POLICY "Users can manage sync status for own workspaces" ON public.neo4j_sync_status
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE workspaces.id = neo4j_sync_status.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

-- Analysis job queue policies
CREATE POLICY "Users can view jobs for own analyses" ON public.analysis_job_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.electrical_analyses 
      WHERE electrical_analyses.id = analysis_job_queue.electrical_analysis_id 
      AND electrical_analyses.user_id = auth.uid()
    )
  );

-- Neo4j operation logs policies
CREATE POLICY "Users can view logs for own operations" ON public.neo4j_operation_logs
  FOR SELECT USING (auth.uid() = initiated_by_user_id OR
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE workspaces.id = neo4j_operation_logs.workspace_id 
      AND workspaces.user_id = auth.uid()
    )
  );

-- =========================================
-- NEO4J INTEGRATION FUNCTIONS
-- =========================================

-- Function to trigger electrical analysis
CREATE OR REPLACE FUNCTION public.trigger_electrical_analysis(
  p_workspace_id UUID,
  p_user_id UUID,
  p_media_file_id UUID
)
RETURNS UUID AS $$
DECLARE
  analysis_id UUID;
  workspace_vehicle_signature TEXT;
BEGIN
  -- Get vehicle signature from workspace
  SELECT vehicle_signature INTO workspace_vehicle_signature
  FROM public.workspaces 
  WHERE id = p_workspace_id AND user_id = p_user_id;
  
  IF workspace_vehicle_signature IS NULL THEN
    RAISE EXCEPTION 'Workspace not found or access denied';
  END IF;
  
  -- Create analysis record
  INSERT INTO public.electrical_analyses (
    workspace_id,
    user_id,
    media_file_id,
    vehicle_signature,
    analysis_status
  ) VALUES (
    p_workspace_id,
    p_user_id,
    p_media_file_id,
    workspace_vehicle_signature,
    'pending'
  ) RETURNING id INTO analysis_id;
  
  -- Create job queue entries
  INSERT INTO public.analysis_job_queue (electrical_analysis_id, job_type, priority) VALUES
  (analysis_id, 'image_analysis', 1),
  (analysis_id, 'component_extraction', 2),
  (analysis_id, 'circuit_mapping', 3),
  (analysis_id, 'fault_detection', 4);
  
  RETURN analysis_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update analysis progress
CREATE OR REPLACE FUNCTION public.update_analysis_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_jobs INTEGER;
  completed_jobs INTEGER;
  failed_jobs INTEGER;
  analysis_status TEXT;
BEGIN
  -- Count job statuses for this analysis
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'failed')
  INTO total_jobs, completed_jobs, failed_jobs
  FROM public.analysis_job_queue 
  WHERE electrical_analysis_id = NEW.electrical_analysis_id;
  
  -- Determine overall analysis status
  IF failed_jobs > 0 THEN
    analysis_status := 'failed';
  ELSIF completed_jobs = total_jobs THEN
    analysis_status := 'completed';
  ELSIF completed_jobs > 0 THEN
    analysis_status := 'processing';
  ELSE
    analysis_status := 'pending';
  END IF;
  
  -- Update the electrical analysis
  UPDATE public.electrical_analyses 
  SET 
    analysis_status = analysis_status,
    completed_at = CASE WHEN analysis_status IN ('completed', 'failed') THEN NOW() ELSE NULL END
  WHERE id = NEW.electrical_analysis_id;
  
  -- Trigger Neo4j sync if analysis completed successfully
  IF analysis_status = 'completed' THEN
    UPDATE public.neo4j_sync_status 
    SET sync_status = 'pending' 
    WHERE workspace_id = (
      SELECT workspace_id FROM public.electrical_analyses 
      WHERE id = NEW.electrical_analysis_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to cache component detection results
CREATE OR REPLACE FUNCTION public.cache_component_detection(
  p_image_hash TEXT,
  p_image_size INTEGER,
  p_image_dimensions TEXT,
  p_components JSONB,
  p_confidence DECIMAL(3,2),
  p_ai_model TEXT,
  p_processing_time INTEGER
)
RETURNS UUID AS $$
DECLARE
  cache_id UUID;
BEGIN
  INSERT INTO public.component_detection_cache (
    image_hash,
    image_size_bytes,
    image_dimensions,
    components_detected,
    detection_confidence,
    ai_model_used,
    processing_time_ms
  ) VALUES (
    p_image_hash,
    p_image_size,
    p_image_dimensions,
    p_components,
    p_confidence,
    p_ai_model,
    p_processing_time
  ) 
  ON CONFLICT (image_hash) DO UPDATE SET
    hit_count = component_detection_cache.hit_count + 1,
    last_accessed_at = NOW()
  RETURNING id INTO cache_id;
  
  RETURN cache_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cached component detection
CREATE OR REPLACE FUNCTION public.get_cached_component_detection(p_image_hash TEXT)
RETURNS TABLE (
  components JSONB,
  confidence DECIMAL(3,2),
  ai_model TEXT,
  cache_age INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cdc.components_detected,
    cdc.detection_confidence,
    cdc.ai_model_used,
    NOW() - cdc.created_at as cache_age
  FROM public.component_detection_cache cdc
  WHERE cdc.image_hash = p_image_hash 
  AND cdc.expires_at > NOW();
  
  -- Update hit count and last accessed
  UPDATE public.component_detection_cache 
  SET 
    hit_count = hit_count + 1,
    last_accessed_at = NOW()
  WHERE image_hash = p_image_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log Neo4j operations
CREATE OR REPLACE FUNCTION public.log_neo4j_operation(
  p_workspace_id UUID,
  p_operation_type TEXT,
  p_vehicle_signature TEXT,
  p_cypher_query TEXT,
  p_execution_time INTEGER,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.neo4j_operation_logs (
    workspace_id,
    operation_type,
    vehicle_signature,
    cypher_query,
    execution_time_ms,
    status,
    error_message,
    initiated_by_user_id
  ) VALUES (
    p_workspace_id,
    p_operation_type,
    p_vehicle_signature,
    p_cypher_query,
    p_execution_time,
    p_status,
    p_error_message,
    p_user_id
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.component_detection_cache 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- CREATE TRIGGERS
-- =========================================

-- Update analysis progress when job status changes
CREATE TRIGGER update_analysis_progress_trigger AFTER UPDATE OF status ON public.analysis_job_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_analysis_progress();

-- Auto-create Neo4j sync status for new workspaces
CREATE OR REPLACE FUNCTION public.create_neo4j_sync_status()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.neo4j_sync_status (workspace_id, vehicle_signature)
  VALUES (NEW.id, NEW.vehicle_signature)
  ON CONFLICT (workspace_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_neo4j_sync_status_trigger AFTER INSERT ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.create_neo4j_sync_status();

-- Update timestamps
CREATE TRIGGER update_neo4j_sync_updated_at BEFORE UPDATE ON public.neo4j_sync_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_analysis_job_queue_updated_at BEFORE UPDATE ON public.analysis_job_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();