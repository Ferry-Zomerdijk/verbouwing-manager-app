-- Enable realtime for task_activity_log
ALTER TABLE public.task_activity_log REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_activity_log;