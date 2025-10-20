import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface TaskCardProps {
  task: any;
  onUpdate: () => void;
}

const priorityColors = {
  Laag: "bg-blue-500",
  Middel: "bg-yellow-500",
  Hoog: "bg-red-500",
};

const TaskCard = ({ task }: TaskCardProps) => {
  return (
    <Card className="p-4 hover:shadow-md transition-smooth cursor-pointer">
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold mb-1">{task.titel}</h4>
          {task.beschrijving && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {task.beschrijving}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge className={`${priorityColors[task.prioriteit as keyof typeof priorityColors]} text-white text-xs`}>
            {task.prioriteit}
          </Badge>
        </div>

        {task.deadline && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(task.deadline), "dd MMM yyyy", { locale: nl })}</span>
          </div>
        )}

        {task.verantwoordelijke && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>{task.verantwoordelijke}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TaskCard;
