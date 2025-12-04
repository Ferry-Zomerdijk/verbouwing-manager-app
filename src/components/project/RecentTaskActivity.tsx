import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { History, Plus, Pencil, Trash2 } from "lucide-react";

interface RecentTaskActivityProps {
  projectId: string;
}

interface ActivityLog {
  id: string;
  task_title: string;
  action: string;
  changes: Record<string, { van?: string; naar?: string }> | null;
  created_at: string;
  user_id: string | null;
  user_name?: string;
}

const RecentTaskActivity = ({ projectId }: RecentTaskActivityProps) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['task-activity', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_activity_log')
        .select('id, task_title, action, changes, created_at, user_id')
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

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'aangemaakt': return <Plus className="w-4 h-4 text-green-500" />;
      case 'bijgewerkt': return <Pencil className="w-4 h-4 text-blue-500" />;
      case 'verwijderd': return <Trash2 className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const formatChanges = (changes: Record<string, { van?: string; naar?: string }> | null) => {
    if (!changes) return '-';
    const entries = Object.entries(changes);
    if (entries.length === 0) return '-';
    return entries.map(([key, value]) => 
      `${key}: ${value.van || '–'} → ${value.naar || '–'}`
    ).join(', ');
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Laatste Wijzigingen</CardTitle>
        <History className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Laden...</p>
        ) : !activities || activities.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nog geen activiteit</p>
        ) : (
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
                {activities.map((activity) => (
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
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {activity.task_title}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">
                      {formatChanges(activity.changes)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentTaskActivity;
