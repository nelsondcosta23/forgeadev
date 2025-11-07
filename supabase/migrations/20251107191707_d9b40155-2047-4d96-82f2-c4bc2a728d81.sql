-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  billing_email TEXT NOT NULL,
  billing_address TEXT,
  tax_id TEXT,
  credits INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  cpc_default DECIMAL(10,4) NOT NULL DEFAULT 0.05, -- CPC padrão em euros
  daily_limit DECIMAL(10,2), -- limite diário opcional
  low_balance_threshold INTEGER DEFAULT 100, -- alerta quando créditos < 100
  status BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tracked_links table
CREATE TABLE public.tracked_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  short_code TEXT NOT NULL UNIQUE, -- código curto do link
  destination_url TEXT NOT NULL, -- URL de destino
  label TEXT, -- label para identificar o link
  cpc_override DECIMAL(10,4), -- CPC específico deste link (null = usa default da company)
  daily_limit DECIMAL(10,2), -- limite diário específico deste link
  total_clicks INTEGER NOT NULL DEFAULT 0,
  valid_clicks INTEGER NOT NULL DEFAULT 0,
  invalid_clicks INTEGER NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  status BOOLEAN NOT NULL DEFAULT true, -- ativo/pausado
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on short_code for fast lookup
CREATE INDEX idx_tracked_links_short_code ON public.tracked_links(short_code);
CREATE INDEX idx_tracked_links_company ON public.tracked_links(company_id);

-- Create clicks table
CREATE TABLE public.clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.tracked_links(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT, -- de onde veio o clique
  country_code TEXT,
  country_name TEXT,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  invalid_reason TEXT, -- motivo se inválido (bot, duplicado, prefetch, etc)
  cost DECIMAL(10,4), -- custo deste clique
  fingerprint TEXT, -- hash do IP+user_agent para detectar duplicados
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for analytics queries
CREATE INDEX idx_clicks_link_id ON public.clicks(link_id);
CREATE INDEX idx_clicks_company_id ON public.clicks(company_id);
CREATE INDEX idx_clicks_clicked_at ON public.clicks(clicked_at);
CREATE INDEX idx_clicks_valid ON public.clicks(is_valid);
CREATE INDEX idx_clicks_fingerprint ON public.clicks(fingerprint);

-- Create credit_transactions table
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'credit' (carregamento) ou 'debit' (débito por clique)
  amount INTEGER NOT NULL, -- quantidade de créditos
  balance_after INTEGER NOT NULL, -- saldo após transação
  reference_id UUID, -- ID do clique se for débito
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_transactions_company ON public.credit_transactions(company_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Admins can manage companies"
ON public.companies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for tracked_links
CREATE POLICY "Admins can manage tracked links"
ON public.tracked_links
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for clicks (anyone can insert via edge function, admins can read)
CREATE POLICY "Anyone can insert clicks"
ON public.clicks
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can read clicks"
ON public.clicks
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for credit_transactions
CREATE POLICY "Admins can manage credit transactions"
ON public.credit_transactions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tracked_links_updated_at
BEFORE UPDATE ON public.tracked_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();