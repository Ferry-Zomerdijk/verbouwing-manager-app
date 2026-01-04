import { supabase } from '@/integrations/supabase/client';
import { getQueue, removeFromQueue } from './offlineQueue';
import { toast } from 'sonner';

export async function syncOfflineChanges(): Promise<{ success: number; failed: number }> {
  const queue = getQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let successCount = 0;
  let errorCount = 0;

  for (const mutation of queue) {
    try {
      if (mutation.type === 'insert') {
        const { error } = await supabase
          .from(mutation.table as 'tasks' | 'costs' | 'contractors' | 'documents' | 'photos' | 'task_updates')
          .insert(mutation.data as never);
        if (error) throw error;
      } else if (mutation.type === 'update') {
        const { id, ...updateData } = mutation.data as { id: string; [key: string]: unknown };
        const { error } = await supabase
          .from(mutation.table as 'tasks' | 'costs' | 'contractors' | 'documents' | 'photos' | 'task_updates')
          .update(updateData as never)
          .eq('id', id);
        if (error) throw error;
      } else if (mutation.type === 'delete') {
        const { id } = mutation.data as { id: string };
        const { error } = await supabase
          .from(mutation.table as 'tasks' | 'costs' | 'contractors' | 'documents' | 'photos' | 'task_updates')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
      removeFromQueue(mutation.id);
      successCount++;
    } catch (error) {
      console.error('Sync failed for mutation:', mutation, error);
      errorCount++;
    }
  }

  if (successCount > 0) {
    toast.success(`${successCount} wijziging(en) gesynchroniseerd`);
  }
  if (errorCount > 0) {
    toast.error(`${errorCount} wijziging(en) konden niet worden gesynchroniseerd`);
  }

  return { success: successCount, failed: errorCount };
}
