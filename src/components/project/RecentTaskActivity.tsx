import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { History, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
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

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'aangemaakt': return <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
      case 'bijgewerkt': return <Pencil className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />;
      case 'verwijderd': return <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />;
      default: return null;
    }
  };

  const formatChanges = (changes: Record<string, { van?: string; naar?: string } | null> | null) => {
    if (!changes) return '-';
    const entries = Object.entries(changes).filter(([_, value]) => value !== null);
    if (entries.length === 0) return '-';
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

  // Mobile card layout
  const MobileActivityList = () => (
    <div className="space-y-2">
      {activities?.map((activity) => (
        <div
          key={activity.id}
          className={`p-3 bg-muted/30 rounded-lg ${activity.task_id && activity.action !== 'verwijderd' ? 'cursor-pointer active:bg-muted/50' : ''}`}
          onClick={() => activity.task_id && activity.action !== 'verwijderd' && handleTaskClick(activity.task_id)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {getActionIcon(activity.action)}
              <span className="text-xs font-medium capitalize">{activity.action}</span>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {format(new Date(activity.created_at), "dd MMM HH:mm", { locale: nl })}
            </span>
          </div>
          <p className="font-medium text-sm mt-1 truncate flex items-center gap-1">
            {activity.task_title}
            {activity.task_id && activity.action !== 'verwijderd' && (
              <ExternalLink className="w-3 h-3 opacity-50 shrink-0" />
            )}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground">
              Door: {activity.user_name}
            </span>
          </div>
          {activity.changes && Object.keys(activity.changes).length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1.5 bg-muted/50 p-1.5 rounded line-clamp-2">
              {formatChanges(activity.changes)}
            </p>
          )}
        </div>
      ))}
    </div>
  );

  // Desktop table layout
  const DesktopActivityTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Wanneer</TableHead>
            <TableHead className="w-[120px]">Wie</TableHead>
            <TableHead className="w-[100px]">Actie</TableHead>
            <TableHead>Taak</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities?.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(activity.created_at), "dd MMM HH:mm", { locale: nl })}
              </TableCell>
              <TableCell className="text-sm">{activity.user_name}</TableCell>
              <TableCell>
                <span className="flex items-center gap-1 text-sm">
                  {getActionIcon(activity.action)}
                  {activity.action}
                </span>
              </TableCell>
              <TableCell 
                className={`font-medium max-w-[200px] truncate ${activity.task_id && activity.action !== 'verwijderd' ? 'cursor-pointer hover:text-primary hover:underline' : ''}`}
                onClick={() => activity.task_id && activity.action !== 'verwijderd' && handleTaskClick(activity.task_id)}
              >
                <span className="flex items-center gap-1">
                  {activity.task_title}
                  {activity.task_id && activity.action !== 'verwijderd' && (
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  )}
                </span>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">
                {formatChanges(activity.changes)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
        <CardTitle className="text-xs sm:text-sm font-medium">Laatste Wijzigingen</CardTitle>
        <History className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <p className="text-muted-foreground text-xs sm:text-sm">Laden...</p>
        ) : !activities || activities.length === 0 ? (
          <p className="text-muted-foreground text-xs sm:text-sm">Nog geen activiteit</p>
        ) : isMobile ? (
          <MobileActivityList />
        ) : (
          <DesktopActivityTable />
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
