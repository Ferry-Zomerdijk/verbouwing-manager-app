import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, X, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO, isValid } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  const [localValue, setLocalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync localValue met prop wanneer die verandert (bijv. na refetch)
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
      setEditValue(value || "");
    }
  }, [value, isEditing]);

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
          ? displayRenderer(localValue) 
          : (formatDisplayValue(localValue, type) || <span className="text-muted-foreground italic">{placeholder}</span>)
        }
      </div>
    );
  }

  if (type === "select") {
    return (
      <Select
        value={editValue}
        onValueChange={(newValue) => {
          const saveValue = newValue === "none" ? null : newValue;
          setEditValue(newValue);
          setLocalValue(saveValue);
          setIsSaving(true);
          onSave(saveValue).finally(() => {
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

  // Date type met Shadcn Calendar in Popover - voorkomt auto-save bij maand navigatie
  if (type === "date") {
    const selectedDate = editValue ? parseISO(editValue) : undefined;
    const validSelectedDate = selectedDate && isValid(selectedDate) ? selectedDate : undefined;

    return (
      <Popover open={isEditing} onOpenChange={(open) => !open && handleCancel()}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-8 w-full justify-start text-left font-normal text-sm",
              !editValue && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {editValue && validSelectedDate
              ? format(validSelectedDate, "d MMM yyyy", { locale: nl })
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={validSelectedDate}
            onSelect={(date) => {
              if (date) {
                const formattedDate = format(date, "yyyy-MM-dd");
                setEditValue(formattedDate);
                setLocalValue(formattedDate);
                setIsSaving(true);
                onSave(formattedDate).finally(() => {
                  setIsSaving(false);
                  setIsEditing(false);
                });
              }
            }}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Text type
  return (
    <div className="flex items-center gap-1">
      <Input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
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
