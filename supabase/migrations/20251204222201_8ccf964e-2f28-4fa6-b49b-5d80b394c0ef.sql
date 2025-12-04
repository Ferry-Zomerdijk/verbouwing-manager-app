-- Create function to update project progress based on tasks
CREATE OR REPLACE FUNCTION public.update_project_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _project_id uuid;
  _total int;
  _completed int;
  _percentage int;
BEGIN
  -- Get the project_id from either NEW or OLD record
  _project_id := COALESCE(NEW.project_id, OLD.project_id);
  
  -- Count total and completed tasks
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'Gereed')
  INTO _total, _completed
  FROM tasks
  WHERE project_id = _project_id;
  
  -- Calculate percentage (0 if no tasks)
  IF _total > 0 THEN
    _percentage := ROUND((_completed::numeric / _total::numeric) * 100);
  ELSE
    _percentage := 0;
  END IF;
  
  -- Update project voortgang
  UPDATE projects
  SET voortgang = _percentage
  WHERE id = _project_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger on tasks table
DROP TRIGGER IF EXISTS update_project_progress_trigger ON tasks;
CREATE TRIGGER update_project_progress_trigger
AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_project_progress();