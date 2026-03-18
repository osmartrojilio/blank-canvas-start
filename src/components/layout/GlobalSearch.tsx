import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const searchItems = [
  { label: "Painel", path: "/", group: "Páginas" },
  { label: "Viagens", path: "/viagens", group: "Páginas" },
  { label: "Veículos", path: "/veiculos", group: "Páginas" },
  { label: "Abastecimentos", path: "/abastecimentos", group: "Páginas" },
  { label: "Despesas", path: "/despesas", group: "Páginas" },
  { label: "Anexos", path: "/anexos", group: "Páginas" },
  { label: "Relatórios", path: "/relatorios", group: "Páginas" },
  { label: "Usuários", path: "/usuarios", group: "Páginas" },
  { label: "Planos", path: "/planos", group: "Páginas" },
  { label: "Configurações", path: "/configuracoes", group: "Configurações" },
];

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const groupedItems = searchItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, typeof searchItems>);

  return (
    <div ref={containerRef} className="relative w-full max-w-xs md:max-w-sm lg:max-w-md">
      <button
        onClick={() => setOpen(true)}
        className="relative w-full"
      >
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <div className="input-field pl-10 w-full text-left text-muted-foreground cursor-pointer hover:bg-secondary/50 transition-colors">
            Buscar... 
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50">
          <Command className="rounded-lg border shadow-lg bg-popover">
            <CommandInput placeholder="Buscar páginas, ações..." autoFocus />
            <CommandList className="max-h-80">
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
              {Object.entries(groupedItems).map(([group, items]) => (
                <CommandGroup key={group} heading={group}>
                  {items.map((item) => (
                    <CommandItem
                      key={item.path}
                      value={item.label}
                      onSelect={() => handleSelect(item.path)}
                    >
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
