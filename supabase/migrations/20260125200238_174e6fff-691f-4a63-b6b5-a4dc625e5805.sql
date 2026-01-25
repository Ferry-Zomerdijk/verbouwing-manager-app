-- Drop de restrictieve DELETE policy
DROP POLICY IF EXISTS "Only admins and owners can delete tasks" ON public.tasks;

-- Maak een nieuwe policy die alle project users toestaat taken te verwijderen
CREATE POLICY "Project users can delete tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (has_project_access(auth.uid(), project_id));