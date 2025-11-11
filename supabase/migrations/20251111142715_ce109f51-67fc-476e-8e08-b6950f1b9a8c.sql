-- Step 1: Allow NULL in company_id for AI-generated links
ALTER TABLE public.tracked_links 
ALTER COLUMN company_id DROP NOT NULL;

-- Add documentation comment
COMMENT ON COLUMN public.tracked_links.company_id IS 
'Company ID - NULL for AI links, UUID for company links';

-- Step 2: Drop and recreate ai_link_analytics view
DROP VIEW IF EXISTS public.ai_link_analytics;

CREATE VIEW public.ai_link_analytics AS
SELECT 
  tl.short_code,
  tl.destination_url,
  tl.label as product,
  COUNT(c.id) as total_clicks,
  COUNT(DISTINCT c.session_id) as unique_sessions,
  COUNT(CASE WHEN c.is_valid THEN 1 END) as valid_clicks,
  ROUND(AVG(CASE WHEN c.is_valid THEN 1.0 ELSE 0.0 END) * 100, 2) as valid_rate,
  c.country_name,
  c.source
FROM public.tracked_links tl
LEFT JOIN public.clicks c ON c.link_id = tl.id
WHERE tl.company_id IS NULL  -- Only AI-generated links
  AND (c.source = 'ai_recommendation' OR c.source IS NULL)
GROUP BY tl.id, tl.short_code, tl.destination_url, tl.label, c.country_name, c.source;

-- Step 3: Add performance indexes
-- Index for quick queries of AI links
CREATE INDEX IF NOT EXISTS idx_tracked_links_ai 
ON public.tracked_links(company_id) 
WHERE company_id IS NULL;

-- Index for AI recommendation clicks
CREATE INDEX IF NOT EXISTS idx_clicks_ai_source 
ON public.clicks(source, session_id) 
WHERE source = 'ai_recommendation';