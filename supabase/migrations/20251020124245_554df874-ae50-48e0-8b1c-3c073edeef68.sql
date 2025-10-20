-- Fix function search_path for update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix function search_path for update_project_costs
CREATE OR REPLACE FUNCTION update_project_costs()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET werkelijke_kosten = (
    SELECT COALESCE(SUM(bedrag), 0)
    FROM costs
    WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
  )
  WHERE id = COALESCE(NEW.project_id, OLD.project_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;