-- Create table for country-store links
CREATE TABLE public.country_store_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  country_name text NOT NULL,
  store_name text NOT NULL,
  store_url text NOT NULL,
  status boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.country_store_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read store links"
  ON public.country_store_links
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert store links"
  ON public.country_store_links
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update store links"
  ON public.country_store_links
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete store links"
  ON public.country_store_links
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_country_store_links_updated_at
  BEFORE UPDATE ON public.country_store_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert popular computer stores for European countries and USA
INSERT INTO public.country_store_links (country_code, country_name, store_name, store_url, status) VALUES
  -- Portugal
  ('PT', 'Portugal', 'Worten', 'https://www.worten.pt', true),
  ('PT', 'Portugal', 'PCDiga', 'https://www.pcdiga.com', true),
  
  -- Spain
  ('ES', 'Spain', 'PcComponentes', 'https://www.pccomponentes.com', true),
  ('ES', 'Spain', 'Media Markt España', 'https://www.mediamarkt.es', true),
  
  -- United Kingdom
  ('GB', 'United Kingdom', 'Amazon UK', 'https://www.amazon.co.uk', true),
  ('GB', 'United Kingdom', 'Scan Computers', 'https://www.scan.co.uk', true),
  
  -- Germany
  ('DE', 'Germany', 'Alternate', 'https://www.alternate.de', true),
  ('DE', 'Germany', 'Mindfactory', 'https://www.mindfactory.de', true),
  
  -- France
  ('FR', 'France', 'LDLC', 'https://www.ldlc.com', true),
  ('FR', 'France', 'Materiel.net', 'https://www.materiel.net', true),
  
  -- Italy
  ('IT', 'Italy', 'Amazon IT', 'https://www.amazon.it', true),
  ('IT', 'Italy', 'ePrice', 'https://www.eprice.it', true),
  
  -- Netherlands
  ('NL', 'Netherlands', 'Alternate NL', 'https://www.alternate.nl', true),
  ('NL', 'Netherlands', 'Azerty', 'https://www.azerty.nl', true),
  
  -- Belgium
  ('BE', 'Belgium', 'Alternate BE', 'https://www.alternate.be', true),
  ('BE', 'Belgium', 'Coolblue', 'https://www.coolblue.be', true),
  
  -- Austria
  ('AT', 'Austria', 'Geizhals', 'https://geizhals.at', true),
  ('AT', 'Austria', 'Cyberport', 'https://www.cyberport.at', true),
  
  -- Poland
  ('PL', 'Poland', 'Morele', 'https://www.morele.net', true),
  ('PL', 'Poland', 'X-Kom', 'https://www.x-kom.pl', true),
  
  -- Sweden
  ('SE', 'Sweden', 'Inet', 'https://www.inet.se', true),
  ('SE', 'Sweden', 'Webhallen', 'https://www.webhallen.com', true),
  
  -- Denmark
  ('DK', 'Denmark', 'Proshop', 'https://www.proshop.dk', true),
  ('DK', 'Denmark', 'Komplett', 'https://www.komplett.dk', true),
  
  -- Norway
  ('NO', 'Norway', 'Komplett NO', 'https://www.komplett.no', true),
  ('NO', 'Norway', 'Proshop NO', 'https://www.proshop.no', true),
  
  -- Finland
  ('FI', 'Finland', 'Jimms', 'https://www.jimms.fi', true),
  ('FI', 'Finland', 'Verkkokauppa', 'https://www.verkkokauppa.com', true),
  
  -- Switzerland
  ('CH', 'Switzerland', 'Digitec', 'https://www.digitec.ch', true),
  ('CH', 'Switzerland', 'Galaxus', 'https://www.galaxus.ch', true),
  
  -- Czech Republic
  ('CZ', 'Czech Republic', 'Alza', 'https://www.alza.cz', true),
  ('CZ', 'Czech Republic', 'CZC', 'https://www.czc.cz', true),
  
  -- Ireland
  ('IE', 'Ireland', 'Komplett Ireland', 'https://www.komplett.ie', true),
  ('IE', 'Ireland', 'Amazon IE', 'https://www.amazon.ie', true),
  
  -- United States
  ('US', 'United States', 'Newegg', 'https://www.newegg.com', true),
  ('US', 'United States', 'Best Buy', 'https://www.bestbuy.com', true),
  ('US', 'United States', 'Amazon US', 'https://www.amazon.com', true),
  ('US', 'United States', 'Micro Center', 'https://www.microcenter.com', true);