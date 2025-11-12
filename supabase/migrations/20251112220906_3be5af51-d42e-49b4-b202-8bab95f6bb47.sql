-- Make company_id nullable in clicks table to support AI-generated recommendations
ALTER TABLE public.clicks ALTER COLUMN company_id DROP NOT NULL;