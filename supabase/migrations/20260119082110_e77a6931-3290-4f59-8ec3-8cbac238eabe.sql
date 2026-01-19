-- Create task_types table (global, not per project)
CREATE TABLE public.task_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naam TEXT NOT NULL,
  kleur TEXT DEFAULT 'gray',
  icoon TEXT DEFAULT 'tag',
  volgorde INTEGER DEFAULT 0,
  is_systeem BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_types ENABLE ROW LEVEL SECURITY;

-- Everyone can read task types
CREATE POLICY "Anyone can view task types"
ON public.task_types
FOR SELECT
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert task types"
ON public.task_types
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update
CREATE POLICY "Admins can update task types"
ON public.task_types
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete non-system types
CREATE POLICY "Admins can delete non-system task types"
ON public.task_types
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) AND is_systeem = false);

-- Insert default task types
INSERT INTO public.task_types (naam, kleur, icoon, is_systeem, volgorde) VALUES
  ('Kopen', 'blue', 'shopping-cart', true, 1),
  ('Te doen', 'orange', 'check-square', true, 2),
  ('Overleg', 'purple', 'users', true, 3),
  ('Regelen', 'green', 'settings', true, 4),
  ('Opvragen', 'yellow', 'help-circle', true, 5),
  ('Anders', 'gray', 'tag', true, 6);

-- Add type_id column to tasks table
ALTER TABLE public.tasks ADD COLUMN type_id UUID REFERENCES public.task_types(id);