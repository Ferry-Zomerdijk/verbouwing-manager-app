-- Add expected delivery date field for "Kopen" (shopping) tasks
ALTER TABLE public.tasks 
ADD COLUMN verwachte_leverdatum date NULL;