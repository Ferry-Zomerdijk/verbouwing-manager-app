-- Create attendance status enum
CREATE TYPE public.attendance_status AS ENUM ('aanwezig', 'afwezig', 'ziek', 'vakantie');

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  status attendance_status NOT NULL DEFAULT 'aanwezig',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(project_id, contractor_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view attendance of accessible projects"
ON public.attendance
FOR SELECT
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can create attendance for accessible projects"
ON public.attendance
FOR INSERT
WITH CHECK (has_project_access(auth.uid(), project_id));

CREATE POLICY "Users can update attendance of accessible projects"
ON public.attendance
FOR UPDATE
USING (has_project_access(auth.uid(), project_id));

CREATE POLICY "Only admins and owners can delete attendance"
ON public.attendance
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = attendance.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_attendance_project_date ON public.attendance(project_id, date);
CREATE INDEX idx_attendance_contractor ON public.attendance(contractor_id);