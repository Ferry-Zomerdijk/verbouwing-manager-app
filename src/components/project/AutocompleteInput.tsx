import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AutocompleteInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  className?: string;
}

export const AutocompleteInput = ({
  placeholder,
  value,
  onChange,
  suggestions,
  className,
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

  // Reset focused index when suggestions change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [filteredSuggestions.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredSuggestions.length) {
          handleSuggestionClick(filteredSuggestions[focusedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  const showDropdown = isOpen && filteredSuggestions.length > 0 && value.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => value && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className={className}
      />
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={cn(
                "px-3 py-2 text-sm cursor-pointer transition-colors",
                focusedIndex === index
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              )}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
