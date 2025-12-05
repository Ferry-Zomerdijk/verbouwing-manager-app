-- Functie om task updates te loggen in activity log
CREATE OR REPLACE FUNCTION public.log_task_update_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _project_id uuid;
  _task_title text;
BEGIN
  -- Haal project_id en task_title op van de gekoppelde taak
  SELECT project_id, titel INTO _project_id, _task_title
  FROM tasks
  WHERE id = NEW.task_id;

  -- Log de activiteit
  INSERT INTO public.task_activity_log (project_id, task_id, task_title, user_id, action, changes)
  VALUES (
    _project_id, 
    NEW.task_id, 
    _task_title, 
    NEW.created_by, 
    'update toegevoegd',
    jsonb_build_object(
      'content', CASE WHEN length(NEW.content) > 100 
                 THEN substring(NEW.content, 1, 100) || '...' 
                 ELSE NEW.content END,
      'heeft_fotos', CASE WHEN NEW.image_urls IS NOT NULL AND array_length(NEW.image_urls, 1) > 0 
                     THEN true ELSE false END
    )
  );

  RETURN NEW;
END;
$function$;

-- Trigger aanmaken op task_updates tabel
CREATE TRIGGER on_task_update_created
  AFTER INSERT ON task_updates
  FOR EACH ROW
  EXECUTE FUNCTION log_task_update_activity();