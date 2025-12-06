import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO, isValid } from "date-fns";
import { nl } from "date-fns/locale";

interface InlineEditableCellProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  type?: "text" | "select" | "date";
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  displayRenderer?: (value: string | null) => React.ReactNode;
}

const formatDisplayValue = (val: string | null, fieldType: string): string | null => {
  if (!val) return null;
  if (fieldType === "date") {
    try {
      const date = parseISO(val);
      if (isValid(date)) {
        return format(date, "d MMM yyyy", { locale: nl });
      }
    } catch {
      return val;
    }
  }
  return val;
};

export const InlineEditableCell = ({
  value,
  onSave,
  type = "text",
  options = [],
  placeholder = "-",
  className = "",
  displayRenderer,
}: InlineEditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === (value || "")) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue || null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        className={`cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors ${className}`}
        onClick={() => setIsEditing(true)}
      >
        {displayRenderer 
          ? displayRenderer(value) 
          : (formatDisplayValue(value, type) || <span className="text-muted-foreground italic">{placeholder}</span>)
        }
      </div>
    );
  }

  if (type === "select") {
    return (
      <Select
        value={editValue}
        onValueChange={(newValue) => {
          setEditValue(newValue);
          setIsSaving(true);
          onSave(newValue === "none" ? null : newValue).finally(() => {
            setIsSaving(false);
            setIsEditing(false);
          });
        }}
        open={isEditing}
        onOpenChange={(open) => !open && handleCancel()}
      >
        <SelectTrigger className="h-8 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Niet ingevuld</SelectItem>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => {
          const newValue = e.target.value;
          setEditValue(newValue);
          
          // Auto-save voor date type zodra een datum is geselecteerd
          if (type === "date" && newValue) {
            setIsSaving(true);
            onSave(newValue).finally(() => {
              setIsSaving(false);
              setIsEditing(false);
            });
          }
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Small timeout to allow button clicks
          setTimeout(() => {
            if (!isSaving) handleCancel();
          }, 150);
        }}
        className="h-8 text-sm"
        disabled={isSaving}
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-green-600"
        onClick={handleSave}
        disabled={isSaving}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-red-600"
        onClick={handleCancel}
        disabled={isSaving}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
