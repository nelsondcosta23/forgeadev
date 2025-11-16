-- Create analytics_events table to track page views and user interactions
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  user_agent TEXT,
  country_code TEXT,
  country_name TEXT,
  language TEXT,
  session_id TEXT,
  user_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_path ON public.analytics_events(page_path);
CREATE INDEX IF NOT EXISTS idx_analytics_events_country_code ON public.analytics_events(country_code);
CREATE INDEX IF NOT EXISTS idx_analytics_events_language ON public.analytics_events(language);

-- Create analytics_sessions table to track sessions and calculate bounce rate
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  first_page TEXT NOT NULL,
  last_page TEXT,
  pages_viewed INTEGER DEFAULT 1,
  country_code TEXT,
  country_name TEXT,
  language TEXT,
  is_bounce BOOLEAN DEFAULT true,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON public.analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_created_at ON public.analytics_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_country_code ON public.analytics_sessions(country_code);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_language ON public.analytics_sessions(language);

-- Enable RLS (these tables are public for tracking but read-protected)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert from anyone (for tracking)
CREATE POLICY "Allow anonymous insert on analytics_events"
ON public.analytics_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anonymous insert on analytics_sessions"
ON public.analytics_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy: Allow select only for admins
CREATE POLICY "Allow admin select on analytics_events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Allow admin select on analytics_sessions"
ON public.analytics_sessions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Policy: Allow update only for service role (for edge functions)
CREATE POLICY "Allow service role update on analytics_sessions"
ON public.analytics_sessions
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);