import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

const DatePicker = ({
  value,
  onChange,
  placeholder = "Selecione uma data",
  className = "",
}: DatePickerProps) => {
  const [open, setOpen] = useState(false);
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

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-field w-full flex items-center gap-2 text-left"
      >
        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
        <span className={value ? "text-foreground" : "text-muted-foreground"}>
          {value ? format(value, "dd/MM/yyyy", { locale: ptBR }) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 rounded-lg border border-border bg-card shadow-lg p-3">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            locale={ptBR}
            initialFocus
          />
        </div>
      )}
    </div>
  );
};

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onStartChange?: (date: Date | undefined) => void;
  onEndChange?: (date: Date | undefined) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  className?: string;
}

const DateRangePicker = ({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  startPlaceholder = "Data inicial",
  endPlaceholder = "Data final",
  className = "",
}: DateRangePickerProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DatePicker
        value={startDate}
        onChange={onStartChange}
        placeholder={startPlaceholder}
        className="w-auto"
      />
      <span className="text-muted-foreground">até</span>
      <DatePicker
        value={endDate}
        onChange={onEndChange}
        placeholder={endPlaceholder}
        className="w-auto"
      />
    </div>
  );
};

export { DatePicker, DateRangePicker };
