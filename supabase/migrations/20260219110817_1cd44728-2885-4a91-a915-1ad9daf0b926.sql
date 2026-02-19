
-- Add factuur_urls column as text array
ALTER TABLE public.costs ADD COLUMN factuur_urls text[] DEFAULT '{}';

-- Migrate existing factuur_url values to factuur_urls array
UPDATE public.costs 
SET factuur_urls = ARRAY[factuur_url] 
WHERE factuur_url IS NOT NULL AND factuur_url != '';
