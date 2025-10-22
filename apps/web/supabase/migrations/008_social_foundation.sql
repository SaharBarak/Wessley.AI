-- 008_social_foundation.sql - Social foundation tables (inactive for now)
-- Basic social tables ready for future activation when workspaces become public

-- =========================================
-- SOCIAL FOUNDATION (INACTIVE FOR NOW)
-- =========================================

-- User follows for when workspaces become public
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Follow metadata
  notification_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT no_self_follow CHECK (follower_user_id != followed_user_id),
  CONSTRAINT unique_user_follow UNIQUE (follower_user_id, followed_user_id)
);

-- Workspace follows (following specific vehicle projects)
CREATE TABLE public.workspace_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  -- Follow metadata
  notification_enabled BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_workspace_follow UNIQUE (follower_user_id, followed_workspace_id)
);

-- Workspace likes (liking vehicle projects)
CREATE TABLE public.workspace_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_workspace_like UNIQUE (user_id, workspace_id)
);

-- Post likes (liking specific posts within workspaces)
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.workspace_posts(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_post_like UNIQUE (user_id, post_id)
);

-- Post comments (commenting on posts)
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.workspace_posts(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE, -- For nested replies
  
  content TEXT NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social notifications for when users interact with content
CREATE TABLE public.social_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system notifications
  
  -- Notification details
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'new_follower', 'workspace_liked', 'post_liked', 'post_commented', 
    'workspace_followed', 'mention', 'system_announcement'
  )),
  title TEXT NOT NULL,
  message TEXT,
  
  -- Related content
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.workspace_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  
  -- Notification status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Delivery
  delivered BOOLEAN DEFAULT false,
  delivery_method TEXT[] DEFAULT '{"in_app"}', -- in_app, email, push
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User social stats (cached for performance)
CREATE TABLE public.user_social_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Follower stats
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  
  -- Content stats
  public_workspaces_count INTEGER DEFAULT 0,
  total_likes_received INTEGER DEFAULT 0,
  total_comments_received INTEGER DEFAULT 0,
  
  -- Engagement stats
  total_posts_count INTEGER DEFAULT 0,
  total_comments_given INTEGER DEFAULT 0,
  total_likes_given INTEGER DEFAULT 0,
  
  -- Calculated scores
  influence_score DECIMAL(8,2) DEFAULT 0.00,
  engagement_score DECIMAL(8,2) DEFAULT 0.00,
  
  -- Cache timestamp
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_social_stats UNIQUE (user_id)
);

-- Content moderation for when social features are active
CREATE TABLE public.content_moderation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content identification
  content_type TEXT NOT NULL CHECK (content_type IN ('workspace', 'post', 'comment', 'profile')),
  content_id UUID NOT NULL,
  reported_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Report details
  reason TEXT NOT NULL CHECK (reason IN (
    'spam', 'harassment', 'inappropriate_content', 'copyright', 'misinformation', 'other'
  )),
  description TEXT,
  
  -- Moderation status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  
  -- Moderation action
  action_taken TEXT CHECK (action_taken IN ('none', 'warning', 'content_removed', 'user_suspended', 'user_banned')),
  moderator_notes TEXT,
  moderated_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================
-- CREATE INDEXES FOR PERFORMANCE
-- =========================================

-- User follows indexes
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_user_id);
CREATE INDEX idx_user_follows_followed ON public.user_follows(followed_user_id);

-- Workspace follows indexes
CREATE INDEX idx_workspace_follows_follower ON public.workspace_follows(follower_user_id);
CREATE INDEX idx_workspace_follows_workspace ON public.workspace_follows(followed_workspace_id);

-- Likes indexes
CREATE INDEX idx_workspace_likes_user ON public.workspace_likes(user_id);
CREATE INDEX idx_workspace_likes_workspace ON public.workspace_likes(workspace_id);
CREATE INDEX idx_post_likes_user ON public.post_likes(user_id);
CREATE INDEX idx_post_likes_post ON public.post_likes(post_id);

-- Comments indexes
CREATE INDEX idx_post_comments_post ON public.post_comments(post_id);
CREATE INDEX idx_post_comments_user ON public.post_comments(user_id);
CREATE INDEX idx_post_comments_parent ON public.post_comments(parent_comment_id);
CREATE INDEX idx_post_comments_created_at ON public.post_comments(created_at);

-- Notifications indexes
CREATE INDEX idx_social_notifications_recipient ON public.social_notifications(recipient_user_id);
CREATE INDEX idx_social_notifications_sender ON public.social_notifications(sender_user_id);
CREATE INDEX idx_social_notifications_type ON public.social_notifications(notification_type);
CREATE INDEX idx_social_notifications_read ON public.social_notifications(read) WHERE read = false;
CREATE INDEX idx_social_notifications_created_at ON public.social_notifications(created_at);

-- Social stats indexes
CREATE INDEX idx_user_social_stats_user_id ON public.user_social_stats(user_id);
CREATE INDEX idx_user_social_stats_influence ON public.user_social_stats(influence_score);
CREATE INDEX idx_user_social_stats_engagement ON public.user_social_stats(engagement_score);

-- Content moderation indexes
CREATE INDEX idx_content_moderation_type_id ON public.content_moderation(content_type, content_id);
CREATE INDEX idx_content_moderation_reported_by ON public.content_moderation(reported_by_user_id);
CREATE INDEX idx_content_moderation_owner ON public.content_moderation(content_owner_user_id);
CREATE INDEX idx_content_moderation_status ON public.content_moderation(status);
CREATE INDEX idx_content_moderation_created_at ON public.content_moderation(created_at);

-- =========================================
-- ENABLE ROW LEVEL SECURITY
-- =========================================

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_social_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;

-- =========================================
-- ROW LEVEL SECURITY POLICIES (INACTIVE)
-- =========================================

-- User follows policies
CREATE POLICY "Users can manage own follows" ON public.user_follows
  FOR ALL USING (auth.uid() = follower_user_id);

CREATE POLICY "Users can see who follows them" ON public.user_follows
  FOR SELECT USING (auth.uid() = followed_user_id OR auth.uid() = follower_user_id);

-- Workspace follows policies
CREATE POLICY "Users can manage own workspace follows" ON public.workspace_follows
  FOR ALL USING (auth.uid() = follower_user_id);

CREATE POLICY "Workspace owners can see followers" ON public.workspace_follows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspaces 
      WHERE workspaces.id = workspace_follows.followed_workspace_id 
      AND workspaces.user_id = auth.uid()
    ) OR auth.uid() = follower_user_id
  );

-- Likes policies
CREATE POLICY "Users can manage own workspace likes" ON public.workspace_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own post likes" ON public.post_likes
  FOR ALL USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Users can manage own comments" ON public.post_comments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view comments on accessible posts" ON public.post_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_posts 
      JOIN public.workspaces ON workspaces.id = workspace_posts.workspace_id
      WHERE workspace_posts.id = post_comments.post_id 
      AND (workspaces.visibility = 'public' OR workspaces.user_id = auth.uid())
    )
  );

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON public.social_notifications
  FOR ALL USING (auth.uid() = recipient_user_id);

-- Social stats policies
CREATE POLICY "Users can view all social stats" ON public.user_social_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can update own social stats" ON public.user_social_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Content moderation policies
CREATE POLICY "Users can create reports" ON public.content_moderation
  FOR INSERT WITH CHECK (auth.uid() = reported_by_user_id);

CREATE POLICY "Users can view own reports and reports about their content" ON public.content_moderation
  FOR SELECT USING (auth.uid() = reported_by_user_id OR auth.uid() = content_owner_user_id);

-- =========================================
-- SOCIAL FUNCTIONS (READY FOR ACTIVATION)
-- =========================================

-- Function to update social stats
CREATE OR REPLACE FUNCTION public.update_user_social_stats(p_user_id UUID)
RETURNS void AS $$
DECLARE
  followers_count INTEGER;
  following_count INTEGER;
  public_workspaces_count INTEGER;
  total_likes_received INTEGER;
  total_comments_received INTEGER;
  total_posts_count INTEGER;
  total_comments_given INTEGER;
  total_likes_given INTEGER;
  influence_score DECIMAL(8,2);
  engagement_score DECIMAL(8,2);
BEGIN
  -- Count followers
  SELECT COUNT(*) INTO followers_count
  FROM public.user_follows 
  WHERE followed_user_id = p_user_id;
  
  -- Count following
  SELECT COUNT(*) INTO following_count
  FROM public.user_follows 
  WHERE follower_user_id = p_user_id;
  
  -- Count public workspaces
  SELECT COUNT(*) INTO public_workspaces_count
  FROM public.workspaces 
  WHERE user_id = p_user_id AND visibility = 'public';
  
  -- Count likes received (on workspaces)
  SELECT COUNT(*) INTO total_likes_received
  FROM public.workspace_likes wl
  JOIN public.workspaces w ON w.id = wl.workspace_id
  WHERE w.user_id = p_user_id;
  
  -- Count comments received (on posts)
  SELECT COUNT(*) INTO total_comments_received
  FROM public.post_comments pc
  JOIN public.workspace_posts wp ON wp.id = pc.post_id
  WHERE wp.user_id = p_user_id AND pc.user_id != p_user_id;
  
  -- Count posts created
  SELECT COUNT(*) INTO total_posts_count
  FROM public.workspace_posts 
  WHERE user_id = p_user_id;
  
  -- Count comments given
  SELECT COUNT(*) INTO total_comments_given
  FROM public.post_comments 
  WHERE user_id = p_user_id;
  
  -- Count likes given
  SELECT COUNT(*) INTO total_likes_given
  FROM public.workspace_likes 
  WHERE user_id = p_user_id;
  
  -- Calculate influence score (followers + likes received + comments received)
  influence_score := (followers_count * 2) + total_likes_received + total_comments_received;
  
  -- Calculate engagement score (comments given + likes given + posts created)
  engagement_score := total_comments_given + total_likes_given + (total_posts_count * 2);
  
  -- Insert or update social stats
  INSERT INTO public.user_social_stats (
    user_id,
    followers_count,
    following_count,
    public_workspaces_count,
    total_likes_received,
    total_comments_received,
    total_posts_count,
    total_comments_given,
    total_likes_given,
    influence_score,
    engagement_score,
    last_calculated_at
  ) VALUES (
    p_user_id,
    followers_count,
    following_count,
    public_workspaces_count,
    total_likes_received,
    total_comments_received,
    total_posts_count,
    total_comments_given,
    total_likes_given,
    influence_score,
    engagement_score,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    followers_count = EXCLUDED.followers_count,
    following_count = EXCLUDED.following_count,
    public_workspaces_count = EXCLUDED.public_workspaces_count,
    total_likes_received = EXCLUDED.total_likes_received,
    total_comments_received = EXCLUDED.total_comments_received,
    total_posts_count = EXCLUDED.total_posts_count,
    total_comments_given = EXCLUDED.total_comments_given,
    total_likes_given = EXCLUDED.total_likes_given,
    influence_score = EXCLUDED.influence_score,
    engagement_score = EXCLUDED.engagement_score,
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to create social notification
CREATE OR REPLACE FUNCTION public.create_social_notification(
  p_recipient_user_id UUID,
  p_sender_user_id UUID,
  p_notification_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_workspace_id UUID DEFAULT NULL,
  p_post_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.social_notifications (
    recipient_user_id,
    sender_user_id,
    notification_type,
    title,
    message,
    workspace_id,
    post_id,
    comment_id
  ) VALUES (
    p_recipient_user_id,
    p_sender_user_id,
    p_notification_type,
    p_title,
    p_message,
    p_workspace_id,
    p_post_id,
    p_comment_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================
-- CREATE TRIGGERS (READY FOR ACTIVATION)
-- =========================================

-- Function to create notification on new follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Get follower name
  SELECT full_name INTO follower_name
  FROM public.profiles 
  WHERE user_id = NEW.follower_user_id;
  
  -- Create notification
  PERFORM public.create_social_notification(
    NEW.followed_user_id,
    NEW.follower_user_id,
    'new_follower',
    COALESCE(follower_name, 'Someone') || ' started following you'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification on workspace like
CREATE OR REPLACE FUNCTION public.notify_on_workspace_like()
RETURNS TRIGGER AS $$
DECLARE
  workspace_owner UUID;
  workspace_name TEXT;
  liker_name TEXT;
BEGIN
  -- Get workspace owner and name
  SELECT user_id, name INTO workspace_owner, workspace_name
  FROM public.workspaces 
  WHERE id = NEW.workspace_id;
  
  -- Don't notify if user likes their own workspace
  IF workspace_owner = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get liker name
  SELECT full_name INTO liker_name
  FROM public.profiles 
  WHERE user_id = NEW.user_id;
  
  -- Create notification
  PERFORM public.create_social_notification(
    workspace_owner,
    NEW.user_id,
    'workspace_liked',
    COALESCE(liker_name, 'Someone') || ' liked your project: ' || workspace_name,
    NULL,
    NEW.workspace_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers (commented out - will be activated when social features go live)
-- CREATE TRIGGER notify_on_follow_trigger AFTER INSERT ON public.user_follows
--   FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- CREATE TRIGGER notify_on_workspace_like_trigger AFTER INSERT ON public.workspace_likes
--   FOR EACH ROW EXECUTE FUNCTION public.notify_on_workspace_like();

-- Update timestamps
CREATE TRIGGER update_post_comments_updated_at BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_social_stats_updated_at BEFORE UPDATE ON public.user_social_stats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();