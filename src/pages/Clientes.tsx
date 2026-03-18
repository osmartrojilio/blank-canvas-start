import { useState } from "react";
import { Plus, Search, Building2, User, Save, Loader2, Trash2, Pencil } from "lucide-react";
import { BackToHome } from "@/components/shared/BackToHome";
import { useCepLookup } from "@/hooks/useCepLookup";
import { maskCpfCnpj, maskPhone, maskCep, formatCpfCnpj } from "@/lib/formatters";
import Layout from "@/components/layout/Layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useClients, ClientFormData } from "@/hooks/useClients";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ESTADOS_BR = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"
];

const clientTypeLabels: Record<string, string> = {
  sender: "Remetente",
  receiver: "Destinatário",
  both: "Ambos",
};

const emptyForm: ClientFormData = {
  client_type: "both", name: "", cpf_cnpj: "", ie: "", email: "", phone: "",
  zip_code: "", street: "", number: "", complement: "", neighborhood: "",
  city: "", city_ibge_code: "", state: "", trade_name: "", notes: "",
};

const Clientes = () => {
  const { clients, loading, createClient, updateClient, deleteClient } = useClients();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [formData, setFormData] = useState<ClientFormData>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { lookupCep, loading: cepLoading } = useCepLookup();

  const handleCepChange = async (cep: string) => {
    setField("zip_code", cep);
    const clean = cep.replace(/\D/g, '');
    if (clean.length === 8) {
      const data = await lookupCep(cep);
      if (data) {
        setFormData(prev => ({
          ...prev,
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          city_ibge_code: data.ibge,
        }));
      }
    }
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    c.cpf_cnpj.includes(searchValue)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cpf_cnpj) return;
    setSaving(true);
    let result;
    if (editingId) {
      result = await updateClient(editingId, formData);
    } else {
      result = await createClient(formData);
    }
    setSaving(false);
    if (result) {
      setFormData({ ...emptyForm });
      setEditingId(null);
      setIsDialogOpen(false);
    }
  };

  const openEdit = (client: any) => {
    setFormData({
      client_type: client.client_type, name: client.name, cpf_cnpj: client.cpf_cnpj,
      ie: client.ie || "", email: client.email || "", phone: client.phone || "",
      zip_code: client.zip_code || "", street: client.street || "", number: client.number || "",
      complement: client.complement || "", neighborhood: client.neighborhood || "",
      city: client.city || "", city_ibge_code: client.city_ibge_code || "",
      state: client.state || "", trade_name: client.trade_name || "", notes: client.notes || "",
    });
    setEditingId(client.id);
    setIsDialogOpen(true);
  };

  const openNew = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const setField = (key: string, val: string) => setFormData(prev => ({ ...prev, [key]: val }));

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="animate-fade-in">
        <BackToHome />
        <div className="flex items-center justify-between mb-8">
          <div className="page-header mb-0">
            <h1 className="page-title">Clientes</h1>
            <p className="page-subtitle">Remetentes e destinatários para CT-e</p>
          </div>
          <button className="btn-primary" onClick={openNew}>
            <Plus className="w-5 h-5" /> Novo Cliente
          </button>
        </div>

        {/* Search */}
        <div className="stat-card mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF/CNPJ..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Empty State */}
        {clients.length === 0 ? (
          <div className="stat-card text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum cliente cadastrado</h3>
            <p className="text-muted-foreground mb-4">Cadastre remetentes e destinatários para facilitar o preenchimento do CT-e.</p>
            <button onClick={openNew} className="btn-primary">
              <Plus className="w-5 h-5" /> Cadastrar Cliente
            </button>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)] rounded-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pr-4">
              {filtered.map(client => (
                <div key={client.id} className="stat-card hover:border-primary/30 border border-transparent transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCpfCnpj(client.cpf_cnpj)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="badge-status bg-secondary text-muted-foreground text-xs">
                        {clientTypeLabels[client.client_type] || client.client_type}
                      </span>
                      <button onClick={() => openEdit(client)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteClient(client.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {client.city && client.state && (
                      <div><span className="text-muted-foreground">Cidade: </span><span className="text-foreground">{client.city}/{client.state}</span></div>
                    )}
                    {client.ie && (
                      <div><span className="text-muted-foreground">IE: </span><span className="text-foreground">{client.ie}</span></div>
                    )}
                    {client.email && (
                      <div><span className="text-muted-foreground">Email: </span><span className="text-foreground">{client.email}</span></div>
                    )}
                    {client.phone && (
                      <div><span className="text-muted-foreground">Tel: </span><span className="text-foreground">{maskPhone(client.phone)}</span></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        )}

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                  <Select value={formData.client_type} onValueChange={v => setField("client_type", v)}>
                    <SelectTrigger className="input-field"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Remetente e Destinatário</SelectItem>
                      <SelectItem value="sender">Remetente</SelectItem>
                      <SelectItem value="receiver">Destinatário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">CPF/CNPJ *</label>
                  <input className="input-field" value={formData.cpf_cnpj} onChange={e => setField("cpf_cnpj", maskCpfCnpj(e.target.value))} required placeholder="00.000.000/0000-00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Razão Social *</label>
                  <input className="input-field" value={formData.name} onChange={e => setField("name", e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nome Fantasia</label>
                  <input className="input-field" value={formData.trade_name || ""} onChange={e => setField("trade_name", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Inscrição Estadual</label>
                  <input className="input-field" value={formData.ie || ""} onChange={e => setField("ie", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Telefone</label>
                  <input className="input-field" value={formData.phone || ""} onChange={e => setField("phone", maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input type="email" className="input-field" value={formData.email || ""} onChange={e => setField("email", e.target.value)} />
              </div>

              {/* Endereço */}
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Endereço</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">CEP {cepLoading && <Loader2 className="inline w-3 h-3 animate-spin ml-1" />}</label>
                    <input className="input-field" value={formData.zip_code || ""} onChange={e => handleCepChange(maskCep(e.target.value))} placeholder="00000-000" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Logradouro</label>
                    <input className="input-field" value={formData.street || ""} onChange={e => setField("street", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Número</label>
                    <input className="input-field" value={formData.number || ""} onChange={e => setField("number", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Complemento</label>
                    <input className="input-field" value={formData.complement || ""} onChange={e => setField("complement", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Bairro</label>
                    <input className="input-field" value={formData.neighborhood || ""} onChange={e => setField("neighborhood", e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Cidade</label>
                    <input className="input-field" value={formData.city || ""} onChange={e => setField("city", e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">UF</label>
                    <Select value={formData.state || ""} onValueChange={v => setField("state", v)}>
                      <SelectTrigger className="input-field"><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>
                        {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Cód. IBGE</label>
                    <input className="input-field" value={formData.city_ibge_code || ""} onChange={e => setField("city_ibge_code", e.target.value)} placeholder="Ex: 3550308" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Observações</label>
                <textarea className="input-field min-h-[60px]" value={formData.notes || ""} onChange={e => setField("notes", e.target.value)} />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsDialogOpen(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Clientes;
