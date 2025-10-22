-- 002_media_and_chat.sql - Media files and chat system
-- Gallery functionality, chat conversations with branching, AI integration

-- Enable additional extensions for text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =========================================
-- MEDIA & CONTENT MANAGEMENT
-- =========================================

-- All media files uploaded by users (gallery, chat uploads, receipts)
CREATE TABLE public.media_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.workspace_posts(id) ON DELETE SET NULL,
  
  -- File details
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Media categorization
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'document', 'receipt', 'other')),
  context TEXT CHECK (context IN ('chat_upload', 'gallery', 'receipt', 'manual_upload')),
  
  -- Vehicle zone tagging (optional)
  vehicle_zone TEXT CHECK (vehicle_zone IN ('engine_bay', 'interior', 'dashboard', 'exterior', 'trunk', 'undercarriage', 'electrical_panel')),
  
  -- AI analysis status
  analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  analysis_data JSONB,
  
  -- Metadata
  title TEXT,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- CHAT SYSTEM
-- =========================================

-- Chat conversations within workspaces (user-controlled branching)
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.workspace_posts(id) ON DELETE SET NULL,
  
  -- Conversation metadata
  title TEXT, -- Auto-generated or user-defined
  
  -- Branching system (like ChatGPT)
  parent_conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE SET NULL,
  branch_point_message_id UUID, -- Will reference messages table
  
  -- Context and settings
  context_data JSONB DEFAULT '{}'::jsonb,
  ai_model TEXT DEFAULT 'gpt-4',
  system_prompt TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages with full AI integration
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for system messages
  
  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Message metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- AI integration markers
  triggered_expense_creation BOOLEAN DEFAULT false,
  triggered_media_organization BOOLEAN DEFAULT false,
  triggered_marketplace_suggestion BOOLEAN DEFAULT false,
  triggered_neo4j_query BOOLEAN DEFAULT false,
  
  -- Media attachments
  attached_media_ids UUID[],
  
  -- AI response metadata
  ai_model TEXT,
  ai_tokens_used INTEGER,
  ai_processing_time_ms INTEGER,
  ai_confidence_score DECIMAL(3,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- CREATE INDEXES FOR PERFORMANCE
-- =========================================

-- Media indexes
CREATE INDEX idx_media_files_workspace_id ON public.media_files(workspace_id);
CREATE INDEX idx_media_files_user_id ON public.media_files(user_id);
CREATE INDEX idx_media_files_post_id ON public.media_files(post_id);
CREATE INDEX idx_media_files_media_type ON public.media_files(media_type);
CREATE INDEX idx_media_files_context ON public.media_files(context);
CREATE INDEX idx_media_files_created_at ON public.media_files(created_at);
CREATE INDEX idx_media_files_analysis_status ON public.media_files(analysis_status);

-- Chat indexes
CREATE INDEX idx_chat_conversations_workspace_id ON public.chat_conversations(workspace_id);
CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_post_id ON public.chat_conversations(post_id);
CREATE INDEX idx_chat_conversations_parent ON public.chat_conversations(parent_conversation_id);
CREATE INDEX idx_chat_conversations_is_active ON public.chat_conversations(is_active);
CREATE INDEX idx_chat_conversations_last_message_at ON public.chat_conversations(last_message_at);

CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_role ON public.chat_messages(role);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- AI integration indexes
CREATE INDEX idx_chat_messages_expense_trigger ON public.chat_messages(triggered_expense_creation) WHERE triggered_expense_creation = true;
CREATE INDEX idx_chat_messages_media_trigger ON public.chat_messages(triggered_media_organization) WHERE triggered_media_organization = true;
CREATE INDEX idx_chat_messages_marketplace_trigger ON public.chat_messages(triggered_marketplace_suggestion) WHERE triggered_marketplace_suggestion = true;
CREATE INDEX idx_chat_messages_neo4j_trigger ON public.chat_messages(triggered_neo4j_query) WHERE triggered_neo4j_query = true;

-- =========================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================

ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- =========================================
-- ROW LEVEL SECURITY POLICIES
-- =========================================

-- Media files policies
CREATE POLICY "Users can manage media in own workspaces" ON public.media_files
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view media in public workspaces" ON public.media_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE workspaces.id = media_files.workspace_id 
      AND (workspaces.visibility = 'public' OR workspaces.user_id = auth.uid())
    )
  );

-- Chat conversations policies
CREATE POLICY "Users can manage own conversations" ON public.chat_conversations
  FOR ALL USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can manage messages in own conversations" ON public.chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations 
      WHERE chat_conversations.id = chat_messages.conversation_id 
      AND chat_conversations.user_id = auth.uid()
    )
  );

-- =========================================
-- ADDITIONAL FUNCTIONS
-- =========================================

-- Function to update conversation last_message_at timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations 
  SET last_message_at = NOW(), updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate conversation titles
CREATE OR REPLACE FUNCTION public.generate_conversation_title()
RETURNS TRIGGER AS $$
DECLARE
  first_message TEXT;
  generated_title TEXT;
BEGIN
  -- Only generate title if not provided and this is a user message
  IF NEW.title IS NULL AND NEW.role = 'user' THEN
    -- Get the first few words of the content
    first_message := split_part(NEW.content, ' ', 1) || ' ' || 
                    split_part(NEW.content, ' ', 2) || ' ' || 
                    split_part(NEW.content, ' ', 3);
    
    -- Clean and truncate
    generated_title := substr(trim(first_message), 1, 50);
    if length(generated_title) < length(trim(first_message)) then
      generated_title := generated_title || '...';
    end if;
    
    -- Update the conversation title
    UPDATE public.chat_conversations 
    SET title = generated_title 
    WHERE id = NEW.conversation_id AND title IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- CREATE TRIGGERS
-- =========================================

-- Update workspace activity on media upload
CREATE TRIGGER update_workspace_activity_on_media AFTER INSERT ON public.media_files
  FOR EACH ROW EXECUTE FUNCTION public.update_workspace_activity();

-- Update conversation timestamps and generate titles
CREATE TRIGGER update_conversation_last_message_on_insert AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

CREATE TRIGGER generate_conversation_title_on_first_message AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.generate_conversation_title();

-- Update workspace activity on chat message
CREATE TRIGGER update_workspace_activity_on_message AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_workspace_activity();

-- Update conversation updated_at timestamp
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();