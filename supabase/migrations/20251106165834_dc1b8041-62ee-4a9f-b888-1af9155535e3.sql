-- Create admin_roadmap table
CREATE TABLE public.admin_roadmap (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  title TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_roadmap ENABLE ROW LEVEL SECURITY;

-- Create policies for admins
CREATE POLICY "Admins can read roadmap"
  ON public.admin_roadmap
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert roadmap"
  ON public.admin_roadmap
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update roadmap"
  ON public.admin_roadmap
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete roadmap"
  ON public.admin_roadmap
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_admin_roadmap_updated_at
  BEFORE UPDATE ON public.admin_roadmap
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();