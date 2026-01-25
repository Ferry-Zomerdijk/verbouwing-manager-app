-- Verwijder de bestaande foreign key constraint
ALTER TABLE public.task_activity_log 
DROP CONSTRAINT IF EXISTS task_activity_log_task_id_fkey;

-- Maak een nieuwe foreign key met ON DELETE SET NULL
ALTER TABLE public.task_activity_log 
ADD CONSTRAINT task_activity_log_task_id_fkey 
FOREIGN KEY (task_id) 
REFERENCES public.tasks(id) 
ON DELETE SET NULL;

-- Update de trigger functie zodat DELETE operaties task_id op NULL zetten
CREATE OR REPLACE FUNCTION public.log_task_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _action text;
  _changes jsonb;
  _project_id uuid;
  _task_title text;
  _task_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _action := 'aangemaakt';
    _project_id := NEW.project_id;
    _task_title := NEW.titel;
    _task_id := NEW.id;
    _changes := jsonb_build_object('titel', NEW.titel, 'status', NEW.status);
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'bijgewerkt';
    _project_id := NEW.project_id;
    _task_title := NEW.titel;
    _task_id := NEW.id;
    _changes := jsonb_build_object(
      'status', CASE WHEN OLD.status IS DISTINCT FROM NEW.status 
                THEN jsonb_build_object('van', OLD.status, 'naar', NEW.status) END,
      'titel', CASE WHEN OLD.titel IS DISTINCT FROM NEW.titel 
               THEN jsonb_build_object('van', OLD.titel, 'naar', NEW.titel) END,
      'prioriteit', CASE WHEN OLD.prioriteit IS DISTINCT FROM NEW.prioriteit 
                    THEN jsonb_build_object('van', OLD.prioriteit, 'naar', NEW.prioriteit) END,
      'verantwoordelijke', CASE WHEN OLD.verantwoordelijke IS DISTINCT FROM NEW.verantwoordelijke 
                           THEN jsonb_build_object('van', OLD.verantwoordelijke, 'naar', NEW.verantwoordelijke) END,
      'deadline', CASE WHEN OLD.deadline IS DISTINCT FROM NEW.deadline 
                  THEN jsonb_build_object('van', OLD.deadline, 'naar', NEW.deadline) END,
      'begindatum', CASE WHEN OLD.begindatum IS DISTINCT FROM NEW.begindatum 
                    THEN jsonb_build_object('van', OLD.begindatum, 'naar', NEW.begindatum) END,
      'deel_van_huis', CASE WHEN OLD.deel_van_huis IS DISTINCT FROM NEW.deel_van_huis 
                       THEN jsonb_build_object('van', OLD.deel_van_huis, 'naar', NEW.deel_van_huis) END
    );
    _changes := (SELECT jsonb_object_agg(key, value) FROM jsonb_each(_changes) WHERE value IS NOT NULL);
    IF _changes IS NULL OR _changes = '{}'::jsonb THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'verwijderd';
    _project_id := OLD.project_id;
    _task_title := OLD.titel;
    _task_id := NULL;  -- Expliciet NULL voor verwijderde taken
    _changes := NULL;
  END IF;

  INSERT INTO public.task_activity_log (project_id, task_id, task_title, user_id, action, changes)
  VALUES (_project_id, _task_id, _task_title, auth.uid(), _action, _changes);

  RETURN COALESCE(NEW, OLD);
END;
$function$;