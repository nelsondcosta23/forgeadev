-- Create table for billing management
CREATE TABLE public.store_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_link_id uuid REFERENCES public.country_store_links(id) ON DELETE CASCADE NOT NULL,
  credits integer NOT NULL DEFAULT 0,
  credits_used integer NOT NULL DEFAULT 0,
  last_credit_update timestamp with time zone NOT NULL DEFAULT now(),
  billing_email text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_billing ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can read store billing"
  ON public.store_billing
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert store billing"
  ON public.store_billing
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update store billing"
  ON public.store_billing
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete store billing"
  ON public.store_billing
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_store_billing_updated_at
  BEFORE UPDATE ON public.store_billing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_store_billing_store_link_id ON public.store_billing(store_link_id);