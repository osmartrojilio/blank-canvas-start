import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Option {
  value: string;
  label: string;
}

interface CommandSelectProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
}

const CommandSelect = ({
  options,
  value = "",
  onChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
  className = "",
}: CommandSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (selectedValue: string) => {
    onChange?.(selectedValue === value ? "" : selectedValue);
    setOpen(false);
    setSearch("");
  };

  const selectedOption = options.find((opt) => opt.value === value);
  
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-field w-full flex items-center justify-between gap-2 text-left"
      >
        <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-card shadow-lg">
          <Command className="bg-transparent">
            <CommandInput
              placeholder={searchPlaceholder}
              value={search}
              onValueChange={setSearch}
              className="border-b border-border"
            />
            <CommandList className="max-h-60 overflow-auto">
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer px-4 py-2 hover:bg-secondary flex items-center justify-between"
                  >
                    <span>{option.label}</span>
                    {value === option.value && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

export { CommandSelect };
