import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, X, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO, isValid } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface InlineEditableCellProps {
  value: string | null;
  onSave: (value: string | null) => Promise<void>;
  type?: "text" | "select" | "date";
  options?: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  displayRenderer?: (value: string | null) => React.ReactNode;
}

const formatDisplayValue = (val: string | null, fieldType: string, locale: typeof nl | typeof enUS): string | null => {
  if (!val) return null;
  if (fieldType === "date") {
    try {
      const date = parseISO(val);
      if (isValid(date)) {
        return format(date, "d MMM yyyy", { locale });
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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();
  const calendarLocale = language === 'nl' ? nl : enUS;

  // Sync localValue met prop wanneer die verandert (bijv. na refetch)
  useEffect(() => {
    if (!isEditing && !isSaving) {
      setLocalValue(value);
      setEditValue(value || "");
    }
  }, [value, isEditing, isSaving]);

  useEffect(() => {
    if (isEditing && inputRef.current && type === "text") {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing, type]);

  const handleSave = async () => {
    const newValue = editValue.trim() || null;
    if (newValue === (value || null)) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(newValue);
      setLocalValue(newValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
      // Blijf in edit mode bij error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(localValue || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const startEditing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditing && !isSaving) {
      setEditValue(localValue || "");
      setIsEditing(true);
    }
  };

  // Display mode
  if (!isEditing) {
    return (
      <div
        className={cn(
          "cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors min-h-[28px] flex items-center",
          className
        )}
        onClick={startEditing}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {displayRenderer 
          ? displayRenderer(localValue) 
          : (formatDisplayValue(localValue, type, calendarLocale) || <span className="text-muted-foreground italic">{placeholder}</span>)
        }
      </div>
    );
  }

  // Select type
  if (type === "select") {
    return (
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <Select
          value={editValue || "none"}
          onValueChange={(newValue) => {
            const saveValue = newValue === "none" ? null : newValue;
            setIsSaving(true);
            onSave(saveValue)
              .then(() => {
                setLocalValue(saveValue);
                setEditValue(newValue);
                setIsEditing(false);
              })
              .catch((err) => console.error("Save error:", err))
              .finally(() => setIsSaving(false));
          }}
          open={true}
          onOpenChange={(open) => {
            if (!open && !isSaving) {
              setIsEditing(false);
            }
          }}
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
      </div>
    );
  }

  // Date type
  if (type === "date") {
    const selectedDate = editValue ? parseISO(editValue) : undefined;
    const validSelectedDate = selectedDate && isValid(selectedDate) ? selectedDate : undefined;

    return (
      <div 
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <Popover 
          open={true} 
          onOpenChange={(open) => {
            if (!open && !isSaving) {
              setIsEditing(false);
            }
          }}
        >
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
                  setIsSaving(true);
                  onSave(formattedDate)
                    .then(() => {
                      setLocalValue(formattedDate);
                      setEditValue(formattedDate);
                      setIsEditing(false);
                    })
                    .catch((err) => console.error("Save error:", err))
                    .finally(() => setIsSaving(false));
                }
              }}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Text type
  return (
    <div 
      ref={containerRef} 
      className="flex items-center gap-1"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8 text-sm"
        disabled={isSaving}
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0 text-green-600 hover:text-green-700 hover:bg-green-100"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSave();
        }}
        disabled={isSaving}
        type="button"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-100"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleCancel();
        }}
        disabled={isSaving}
        type="button"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
