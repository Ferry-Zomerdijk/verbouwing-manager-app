import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { History, Plus, Pencil, Trash2, ExternalLink, MessageSquare, Clock } from "lucide-react";
import EditTaskDialog from "./EditTaskDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface RecentTaskActivityProps {
  projectId: string;
}

interface ActivityLog {
  id: string;
  task_id: string | null;
  task_title: string;
  action: string;
  changes: Record<string, { van?: string; naar?: string }> | null;
  created_at: string;
  user_id: string | null;
  user_name?: string;
}

const RecentTaskActivity = ({ projectId }: RecentTaskActivityProps) => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const { data: activities, isLoading } = useQuery({
    queryKey: ['task-activity', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_activity_log')
        .select('id, task_id, task_title, action, changes, created_at, user_id')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      // Haal user namen op
      const userIds = [...new Set(data?.filter(a => a.user_id).map(a => a.user_id))] as string[];
      let profileMap = new Map<string, string>();
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, naam, email')
          .in('id', userIds);
        
        profileMap = new Map(profiles?.map(p => [p.id, p.naam || p.email || 'Onbekend']));
      }
      
      return data?.map(activity => ({
        ...activity,
        user_name: activity.user_id ? profileMap.get(activity.user_id) || 'Onbekend' : 'Systeem'
      })) as ActivityLog[];
    },
  });

  // Real-time subscription voor nieuwe activiteiten
  useEffect(() => {
    const channel = supabase
      .channel(`task-activity-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_activity_log',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['task-activity', projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  const getActionConfig = (action: string) => {
    switch (action) {
      case 'aangemaakt': 
        return { 
          icon: <Plus className="w-3 h-3" />, 
          color: 'bg-green-500',
          bgColor: 'bg-green-500/10',
          textColor: 'text-green-600 dark:text-green-400'
        };
      case 'bijgewerkt': 
        return { 
          icon: <Pencil className="w-3 h-3" />, 
          color: 'bg-blue-500',
          bgColor: 'bg-blue-500/10',
          textColor: 'text-blue-600 dark:text-blue-400'
        };
      case 'verwijderd': 
        return { 
          icon: <Trash2 className="w-3 h-3" />, 
          color: 'bg-red-500',
          bgColor: 'bg-red-500/10',
          textColor: 'text-red-600 dark:text-red-400'
        };
      case 'update toegevoegd': 
        return { 
          icon: <MessageSquare className="w-3 h-3" />, 
          color: 'bg-purple-500',
          bgColor: 'bg-purple-500/10',
          textColor: 'text-purple-600 dark:text-purple-400'
        };
      default: 
        return { 
          icon: <History className="w-3 h-3" />, 
          color: 'bg-muted-foreground',
          bgColor: 'bg-muted',
          textColor: 'text-muted-foreground'
        };
    }
  };

  const formatChanges = (changes: Record<string, any> | null) => {
    if (!changes) return null;
    
    // Speciale weergave voor task updates
    if (changes.content !== undefined) {
      return changes.content + (changes.heeft_fotos ? ' 📷' : '');
    }
    
    const entries = Object.entries(changes).filter(([_, value]) => value !== null);
    if (entries.length === 0) return null;
    return entries.map(([key, value]) => 
      `${key}: ${value?.van || '–'} → ${value?.naar || '–'}`
    ).join(', ');
  };

  const handleTaskClick = async (taskId: string | null) => {
    if (!taskId) return;
    
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (error || !task) {
      return; // Task was deleted
    }
    
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  const handleTaskUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    queryClient.invalidateQueries({ queryKey: ['task-activity', projectId] });
  };

  // Timeline Layout Component
  const TimelineActivity = () => (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[15px] sm:left-[19px] top-2 bottom-2 w-0.5 bg-border" />
      
      <div className="space-y-3 sm:space-y-4">
        {activities?.map((activity, index) => {
          const config = getActionConfig(activity.action);
          const isClickable = activity.task_id && activity.action !== 'verwijderd';
          const changes = formatChanges(activity.changes);
          
          return (
            <div 
              key={activity.id} 
              className={`relative pl-9 sm:pl-12 group ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => isClickable && handleTaskClick(activity.task_id)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Timeline dot */}
              <div className={`absolute left-0 w-[30px] sm:w-[38px] h-[30px] sm:h-[38px] rounded-full ${config.bgColor} flex items-center justify-center border-4 border-background z-10 group-hover:scale-110 transition-transform`}>
                <div className={config.textColor}>
                  {config.icon}
                </div>
              </div>
              
              {/* Activity content */}
              <div className={`p-3 sm:p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all duration-200 ${isClickable ? 'hover:shadow-md hover:-translate-y-0.5' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold capitalize ${config.textColor}`}>
                        {activity.action}
                      </span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(activity.created_at), "dd MMM HH:mm", { locale: nl })}
                      </span>
                    </div>
                    <p className="font-medium text-sm mt-1 truncate flex items-center gap-1.5">
                      {activity.task_title}
                      {isClickable && (
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 shrink-0 transition-opacity" />
                      )}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                      Door {activity.user_name}
                    </p>
                  </div>
                </div>
                
                {changes && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2">
                      {changes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Card className="shadow-card overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 sm:p-2 rounded-lg bg-muted">
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
          </div>
          <CardTitle className="text-sm sm:text-base font-semibold">Laatste Wijzigingen</CardTitle>
        </div>
        {activities && activities.length > 0 && (
          <span className="text-xs text-muted-foreground">{activities.length} items</span>
        )}
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <History className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Nog geen activiteit</p>
            <p className="text-muted-foreground text-xs mt-1">Wijzigingen aan taken verschijnen hier</p>
          </div>
        ) : (
          <TimelineActivity />
        )}
      </CardContent>

      {selectedTask && (
        <EditTaskDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          task={selectedTask}
          onSuccess={handleTaskUpdate}
        />
      )}
    </Card>
  );
};

export default RecentTaskActivity;