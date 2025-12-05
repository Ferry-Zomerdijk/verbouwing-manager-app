import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "./TaskCard";

interface DraggableTaskCardProps {
  task: any;
  onUpdate: () => void;
  canDelete?: boolean;
  availableDelenVanHuis?: string[];
}

const DraggableTaskCard = ({ task, onUpdate, canDelete = true, availableDelenVanHuis = [] }: DraggableTaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onUpdate={onUpdate} canDelete={canDelete} availableDelenVanHuis={availableDelenVanHuis} />
    </div>
  );
};

export default DraggableTaskCard;
