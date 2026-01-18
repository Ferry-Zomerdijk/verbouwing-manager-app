import * as React from "react";
import { format, parse } from "date-fns";
import { nl } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value: string; // Format: "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: string; // Format: "YYYY-MM-DD"
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecteer datum",
  disabled,
  minDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Convert string date to Date object
  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const minDateObj = minDate ? parse(minDate, "yyyy-MM-dd", new Date()) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
    } else {
      onChange("");
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "d MMMM yyyy", { locale: nl })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={minDateObj ? (date) => date < minDateObj : undefined}
          initialFocus
          locale={nl}
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}
