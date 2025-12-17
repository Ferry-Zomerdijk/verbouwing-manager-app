-- Add INSERT policy for notifications table
-- Allows admins and project owners to create notifications for project members
CREATE POLICY "Admins and project owners can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (
    project_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = notifications.project_id 
      AND projects.user_id = auth.uid()
    )
  )
);