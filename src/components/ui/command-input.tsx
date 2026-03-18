import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface CommandInputSearchProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  suggestions?: string[];
  className?: string;
}

const CommandInputSearch = ({
  placeholder = "Buscar...",
  value = "",
  onChange,
  suggestions = [],
  className = "",
}: CommandInputSearchProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange?.(newValue);
    if (newValue.length > 0 && suggestions.length > 0) {
      setOpen(true);
    }
  };

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange?.(selectedValue);
    setOpen(false);
  };

  const handleClear = () => {
    setInputValue("");
    onChange?.("");
    setOpen(false);
  };

  const filteredSuggestions = suggestions.filter((s) =>
    s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <Command className="rounded-lg border-0 bg-transparent">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none z-10" />
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleInputChange}
            onFocus={() => inputValue.length > 0 && suggestions.length > 0 && setOpen(true)}
            className="input-field pl-10 pr-10 h-10"
          />
          {inputValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {open && filteredSuggestions.length > 0 && (
          <CommandList className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border border-border bg-card shadow-lg">
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {filteredSuggestions.map((suggestion) => (
                <CommandItem
                  key={suggestion}
                  value={suggestion}
                  onSelect={handleSelect}
                  className="cursor-pointer px-4 py-2 hover:bg-secondary"
                >
                  {suggestion}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        )}
      </Command>
    </div>
  );
};

export { CommandInputSearch };
