
-- Remover a FK constraint errada que liga clicks.company_id a country_store_links
ALTER TABLE clicks 
DROP CONSTRAINT IF EXISTS fk_clicks_company_id;

-- Adicionar a FK constraint correta que liga clicks.company_id a companies
ALTER TABLE clicks 
ADD CONSTRAINT fk_clicks_company_id 
FOREIGN KEY (company_id) 
REFERENCES companies(id) 
ON DELETE SET NULL;
