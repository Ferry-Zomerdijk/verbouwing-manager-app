-- Create task_updates table
CREATE TABLE public.task_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.task_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view updates of accessible tasks
CREATE POLICY "Users can view updates of accessible tasks"
ON public.task_updates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_updates.task_id 
    AND public.has_project_access(auth.uid(), tasks.project_id)
  )
);

-- RLS Policy: Users can create updates for accessible tasks
CREATE POLICY "Users can create updates for accessible tasks"
ON public.task_updates FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = task_updates.task_id 
    AND public.has_project_access(auth.uid(), tasks.project_id)
  )
  AND auth.uid() = created_by
);

-- RLS Policy: Users can delete their own updates
CREATE POLICY "Users can delete their own updates"
ON public.task_updates FOR DELETE
TO authenticated
USING (created_by = auth.uid());