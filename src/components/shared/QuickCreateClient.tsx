import { useState } from "react";
import { Plus, Save, Loader2, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClients } from "@/hooks/useClients";
import { useCepLookup } from "@/hooks/useCepLookup";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

const clientTypeOptions = [
  { value: "sender", label: "Remetente" },
  { value: "receiver", label: "Destinatário" },
  { value: "both", label: "Ambos" },
];

interface QuickCreateClientProps {
  onCreated: (clientId: string, clientName: string) => void;
}

export function QuickCreateClient({ onCreated }: QuickCreateClientProps) {
  const { createClient } = useClients();
  const { lookupCep, loading: cepLoading } = useCepLookup();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    cpf_cnpj: "",
    client_type: "both",
    ie: "",
    email: "",
    phone: "",
    zip_code: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    city_ibge_code: "",
    state: "",
  });

  const resetForm = () => {
    setForm({
      name: "", cpf_cnpj: "", client_type: "both", ie: "",
      email: "", phone: "", zip_code: "", street: "", number: "",
      complement: "", neighborhood: "", city: "", city_ibge_code: "", state: "",
    });
  };

  const handleCepBlur = async () => {
    const result = await lookupCep(form.zip_code);
    if (result) {
      setForm(prev => ({
        ...prev,
        street: result.street,
        neighborhood: result.neighborhood,
        city: result.city,
        state: result.state,
        city_ibge_code: result.ibge,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.cpf_cnpj) return;

    setSaving(true);
    const result = await createClient({
      name: form.name,
      cpf_cnpj: form.cpf_cnpj,
      client_type: form.client_type,
      ie: form.ie || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      zip_code: form.zip_code || undefined,
      street: form.street || undefined,
      number: form.number || undefined,
      complement: form.complement || undefined,
      neighborhood: form.neighborhood || undefined,
      city: form.city || undefined,
      city_ibge_code: form.city_ibge_code || undefined,
      state: form.state || undefined,
    });
    setSaving(false);

    if (result) {
      onCreated(result.id, result.name);
      resetForm();
      setOpen(false);
    }
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

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
          <TooltipContent>Cadastrar cliente rápido</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Cadastro Rápido de Cliente</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-3">
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Nome */}
            <div>
              <Label>Nome / Razão Social *</Label>
              <Input placeholder="Nome completo ou razão social" value={form.name} onChange={e => update("name", e.target.value)} required />
            </div>

            {/* CPF/CNPJ + Tipo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CPF/CNPJ *</Label>
                <Input placeholder="000.000.000-00" value={form.cpf_cnpj} onChange={e => update("cpf_cnpj", e.target.value)} required />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.client_type} onValueChange={v => update("client_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {clientTypeOptions.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* IE + Email + Telefone */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>IE</Label>
                <Input placeholder="Inscrição Estadual" value={form.ie} onChange={e => update("ie", e.target.value)} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => update("email", e.target.value)} />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input placeholder="(00) 00000-0000" value={form.phone} onChange={e => update("phone", e.target.value)} />
              </div>
            </div>

            {/* Endereço */}
            <div className="border-t border-border pt-3">
              <p className="text-sm font-medium text-muted-foreground mb-3">Endereço</p>
              <div className="space-y-3">
                {/* CEP */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>CEP</Label>
                    <div className="relative">
                      <Input
                        placeholder="00000-000"
                        value={form.zip_code}
                        onChange={e => update("zip_code", e.target.value)}
                        onBlur={handleCepBlur}
                      />
                      {cepLoading && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label>Logradouro</Label>
                    <Input placeholder="Rua, Av..." value={form.street} onChange={e => update("street", e.target.value)} />
                  </div>
                </div>

                {/* Número + Complemento + Bairro */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Número</Label>
                    <Input placeholder="Nº" value={form.number} onChange={e => update("number", e.target.value)} />
                  </div>
                  <div>
                    <Label>Complemento</Label>
                    <Input placeholder="Sala, Andar..." value={form.complement} onChange={e => update("complement", e.target.value)} />
                  </div>
                  <div>
                    <Label>Bairro</Label>
                    <Input placeholder="Bairro" value={form.neighborhood} onChange={e => update("neighborhood", e.target.value)} />
                  </div>
                </div>

                {/* Cidade + UF + IBGE */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Cidade</Label>
                    <Input placeholder="Cidade" value={form.city} onChange={e => update("city", e.target.value)} />
                  </div>
                  <div>
                    <Label>UF</Label>
                    <Input placeholder="UF" value={form.state} onChange={e => update("state", e.target.value)} maxLength={2} />
                  </div>
                  <div>
                    <Label>Cód. IBGE</Label>
                    <Input placeholder="0000000" value={form.city_ibge_code} onChange={e => update("city_ibge_code", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
