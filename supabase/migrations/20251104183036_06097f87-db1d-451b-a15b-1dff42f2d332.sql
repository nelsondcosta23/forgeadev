-- Create table for admin prompts
CREATE TABLE public.admin_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now)
CREATE POLICY "Anyone can read admin prompts"
ON public.admin_prompts
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert admin prompts"
ON public.admin_prompts
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update admin prompts"
ON public.admin_prompts
FOR UPDATE
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_prompts_updated_at
BEFORE UPDATE ON public.admin_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();