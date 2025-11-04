-- Create ai_recommendations table to store AI feedback
CREATE TABLE public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  recommendation_text TEXT NOT NULL,
  prompt_used TEXT NOT NULL,
  model_used TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_recommendations
CREATE POLICY "Anyone can read ai_recommendations" 
ON public.ai_recommendations 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert ai_recommendations" 
ON public.ai_recommendations 
FOR INSERT 
WITH CHECK (true);

-- Create index on session_id for faster lookups
CREATE INDEX idx_ai_recommendations_session_id ON public.ai_recommendations(session_id);