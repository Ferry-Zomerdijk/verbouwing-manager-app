-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow project owners to view profiles of users in their projects
CREATE POLICY "Project owners can view profiles of project users"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM project_users pu
    JOIN projects p ON p.id = pu.project_id
    WHERE pu.user_id = profiles.id
    AND p.user_id = auth.uid()
  )
);