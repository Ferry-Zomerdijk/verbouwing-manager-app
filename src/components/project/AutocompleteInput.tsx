import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface AutocompleteInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  className?: string;
  allowCreate?: boolean;
  createLabel?: string;
  showAllOnFocus?: boolean;
}

export const AutocompleteInput = ({
  placeholder,
  value,
  onChange,
  suggestions,
  className,
  allowCreate = false,
  createLabel = "Voeg toe:",
  showAllOnFocus = false,
}: AutocompleteInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input value
  const filteredSuggestions = value
    ? suggestions.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      )
    : suggestions;

  // Check if the current value is a new entry (not in suggestions)
  const isNewValue = value.trim() !== "" && 
    !suggestions.some(s => s.toLowerCase() === value.toLowerCase().trim());

  // Build the list of items to display
  const displayItems: { type: "suggestion" | "create"; value: string }[] = [
    ...filteredSuggestions.map(s => ({ type: "suggestion" as const, value: s })),
  ];

  // Add "create new" option if allowed and value is new
  if (allowCreate && isNewValue) {
    displayItems.unshift({ type: "create", value: value.trim() });
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset focused index when items change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [displayItems.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleItemClick = (item: { type: "suggestion" | "create"; value: string }) => {
    onChange(item.value);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || displayItems.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < displayItems.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < displayItems.length) {
          handleItemClick(displayItems[focusedIndex]);
        } else if (allowCreate && isNewValue) {
          // If no item is focused but we have a new value, use it
          onChange(value.trim());
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const handleFocus = () => {
    if (showAllOnFocus || value) {
      setIsOpen(true);
    }
  };

  const showDropdown = isOpen && displayItems.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        className={className}
      />
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
          {displayItems.map((item, index) => (
            <div
              key={item.type === "create" ? `create-${item.value}` : item.value}
              className={cn(
                "px-3 py-2 text-sm cursor-pointer transition-colors flex items-center gap-2",
                focusedIndex === index
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted",
                item.type === "create" && "text-primary font-medium"
              )}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {item.type === "create" ? (
                <>
                  <Plus className="h-4 w-4" />
                  <span>{createLabel} "{item.value}"</span>
                </>
              ) : (
                item.value
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
