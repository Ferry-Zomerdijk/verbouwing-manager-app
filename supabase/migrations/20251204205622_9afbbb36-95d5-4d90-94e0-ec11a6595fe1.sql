-- Add deel_van_huis column to costs table
ALTER TABLE public.costs 
ADD COLUMN deel_van_huis TEXT;

-- Add new category values to cost_category enum
ALTER TYPE public.cost_category ADD VALUE IF NOT EXISTS 'Kluswerkzaamheden';
ALTER TYPE public.cost_category ADD VALUE IF NOT EXISTS 'Decoratie';
ALTER TYPE public.cost_category ADD VALUE IF NOT EXISTS 'Meubels';