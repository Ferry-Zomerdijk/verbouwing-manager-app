-- Voeg deel_van_huis kolom toe aan photos tabel
ALTER TABLE public.photos 
ADD COLUMN deel_van_huis TEXT DEFAULT 'Nog invullen';

-- Vul bestaande foto's in met de defaultwaarde
UPDATE public.photos 
SET deel_van_huis = 'Nog invullen' 
WHERE deel_van_huis IS NULL;

-- Maak de kolom NOT NULL na het vullen
ALTER TABLE public.photos 
ALTER COLUMN deel_van_huis SET NOT NULL;