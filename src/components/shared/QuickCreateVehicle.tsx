import { useState } from "react";
import { Plus, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVehicles } from "@/hooks/useVehicles";
import { maskPlate } from "@/lib/formatters";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const formStatusOptions = [
  { value: "available", label: "Disponível" },
  { value: "in_use", label: "Em Uso" },
  { value: "maintenance", label: "Em Manutenção" },
  { value: "inactive", label: "Inativo" },
];

interface QuickCreateVehicleProps {
  onCreated: (vehicleId: string) => void;
}

export function QuickCreateVehicle({ onCreated }: QuickCreateVehicleProps) {
  const { createVehicle } = useVehicles();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    prefix: "",
    plate: "",
    model: "",
    year: "",
    current_km: "",
    status: "available",
  });

  const resetForm = () => {
    setForm({ prefix: "", plate: "", model: "", year: "", current_km: "", status: "available" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.prefix || !form.plate || !form.model) return;

    setSaving(true);
    const result = await createVehicle({
      prefix: form.prefix,
      plate: form.plate,
      model: form.model,
      year: form.year ? parseInt(form.year) : undefined,
      current_km: parseInt(form.current_km) || 0,
      status: (form.status || "available") as "available" | "in_use" | "maintenance" | "inactive",
    });
    setSaving(false);

    if (result) {
      onCreated(result.id);
      resetForm();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="icon" className="shrink-0 h-10 w-10">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Cadastrar veículo rápido</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Cadastro Rápido de Veículo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Prefixo *</label>
              <input
                type="text"
                placeholder="VEI-001"
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Placa *</label>
              <input
                type="text"
                placeholder="ABC-1234"
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: maskPlate(e.target.value) })}
                className="input-field"
                required
                maxLength={8}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Modelo *</label>
            <input
              type="text"
              placeholder="Volvo FH 540"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Ano</label>
              <input
                type="number"
                placeholder="2024"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">KM</label>
              <input
                type="number"
                placeholder="0"
                value={form.current_km}
                onChange={(e) => setForm({ ...form, current_km: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="input-field">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formStatusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { resetForm(); setOpen(false); }}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
