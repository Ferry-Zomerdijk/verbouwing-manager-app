import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InlineEditableFieldProps {
  value: string | number;
  onSave: (value: string) => Promise<void>;
  type?: "text" | "number";
  className?: string;
  displayClassName?: string;
}

const InlineEditableField = ({
  value,
  onSave,
  type = "text",
  className = "",
  displayClassName = "",
}: InlineEditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value.toString()) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      setEditValue(value.toString());
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8"
          disabled={saving}
          autoFocus
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleSave}
          disabled={saving}
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleCancel}
          disabled={saving}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 group cursor-pointer hover:text-primary transition-smooth ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <span className={displayClassName}>{value}</span>
      <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default InlineEditableField;
