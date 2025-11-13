-- Add foreign key constraint linking clicks.company_id to country_store_links.id
ALTER TABLE clicks 
ADD CONSTRAINT fk_clicks_company_id 
FOREIGN KEY (company_id) 
REFERENCES country_store_links(id) 
ON DELETE SET NULL;