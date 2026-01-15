-- Create attendance_time_presets table for configurable work times
CREATE TABLE public.attendance_time_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attendance_time_presets ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view presets for their projects"
ON public.attendance_time_presets
FOR SELECT
USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can create presets for their projects"
ON public.attendance_time_presets
FOR INSERT
WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update presets for their projects"
ON public.attendance_time_presets
FOR UPDATE
USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can delete presets for their projects"
ON public.attendance_time_presets
FOR DELETE
USING (public.has_project_access(auth.uid(), project_id));

-- Index for faster lookups
CREATE INDEX idx_attendance_time_presets_project_id ON public.attendance_time_presets(project_id);