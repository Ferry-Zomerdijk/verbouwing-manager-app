
-- Create house_parts table
CREATE TABLE public.house_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  naam text NOT NULL,
  volgorde integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.house_parts ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as cost_categories)
CREATE POLICY "Users can view house parts of accessible projects"
ON public.house_parts FOR SELECT
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can create house parts for accessible projects"
ON public.house_parts FOR INSERT
WITH CHECK (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update house parts of accessible projects"
ON public.house_parts FOR UPDATE
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Only admins and owners can delete house parts"
ON public.house_parts FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = house_parts.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX idx_house_parts_project_id ON public.house_parts(project_id);

-- Initialize function
CREATE OR REPLACE FUNCTION public.initialize_house_parts(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM house_parts WHERE project_id = p_project_id) THEN
    RETURN;
  END IF;

  INSERT INTO house_parts (project_id, naam, volgorde) VALUES
    (p_project_id, 'Woning', 0),
    (p_project_id, 'Keuken', 1),
    (p_project_id, 'Badkamer', 2),
    (p_project_id, 'Slaapkamer', 3),
    (p_project_id, 'Woonkamer', 4),
    (p_project_id, 'Hal', 5),
    (p_project_id, 'Zolder', 6),
    (p_project_id, 'Garage', 7),
    (p_project_id, 'Schuur', 8),
    (p_project_id, 'Bijgebouw', 9),
    (p_project_id, 'Tuin en buitenruimte', 10),
    (p_project_id, 'Poort', 11),
    (p_project_id, 'Brievenbus', 12),
    (p_project_id, 'CV-ketel en verwarming', 13),
    (p_project_id, 'Airconditioning', 14),
    (p_project_id, 'Dakgoten en afvoer', 15),
    (p_project_id, 'Elektrische installatie', 16),
    (p_project_id, 'Waterleiding en sanitair', 17),
    (p_project_id, 'Alarm en beveiliging', 18),
    (p_project_id, 'Zonnepanelen', 19),
    (p_project_id, 'Ventilatie en afzuiging', 20),
    (p_project_id, 'Ramen en deuren', 21),
    (p_project_id, 'Dak', 22),
    (p_project_id, 'Gevels', 23),
    (p_project_id, 'Zwembad/jacuzzi', 24);
END;
$$;
