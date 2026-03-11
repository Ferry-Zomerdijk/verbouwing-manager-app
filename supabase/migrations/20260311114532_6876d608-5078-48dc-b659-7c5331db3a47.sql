-- SELECT: alle projectleden + admins
DROP POLICY "Users can view costs of their projects" ON costs;
CREATE POLICY "Users can view costs of accessible projects" ON costs
  FOR SELECT USING (has_project_access(auth.uid(), project_id));

-- INSERT: alle projectleden + admins
DROP POLICY "Users can create costs for their projects" ON costs;
CREATE POLICY "Users can create costs for accessible projects" ON costs
  FOR INSERT WITH CHECK (has_project_access(auth.uid(), project_id));

-- UPDATE: alle projectleden + admins
DROP POLICY "Users can update costs of their projects" ON costs;
CREATE POLICY "Users can update costs of accessible projects" ON costs
  FOR UPDATE USING (has_project_access(auth.uid(), project_id));

-- DELETE: alleen eigenaar + admin
DROP POLICY "Users can delete costs of their projects" ON costs;
CREATE POLICY "Only owners and admins can delete costs" ON costs
  FOR DELETE USING (
    has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM projects WHERE id = costs.project_id AND user_id = auth.uid())
  );