-- Drop columns from country_store_links table
ALTER TABLE public.country_store_links 
DROP COLUMN IF EXISTS contact_person,
DROP COLUMN IF EXISTS contact_email,
DROP COLUMN IF EXISTS contact_phone,
DROP COLUMN IF EXISTS vat_number,
DROP COLUMN IF EXISTS notes;

-- Drop the companies table
DROP TABLE IF EXISTS public.companies CASCADE;