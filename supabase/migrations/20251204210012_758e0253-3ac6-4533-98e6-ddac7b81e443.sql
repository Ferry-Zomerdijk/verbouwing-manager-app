-- Create cost_status enum type
CREATE TYPE public.cost_status AS ENUM ('Schatting', 'Offerte', 'Factuur');

-- Add status column to costs table with default value
ALTER TABLE public.costs 
ADD COLUMN status public.cost_status NOT NULL DEFAULT 'Schatting';