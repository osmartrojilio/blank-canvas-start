import { useState } from "react";
import { Plus, Wrench, Save, Search, Loader2, Eye, Pencil, Trash2 } from "lucide-react";
import { BackToHome } from "@/components/shared/BackToHome";
import Layout from "@/components/layout/Layout";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useMaintenanceRecords, MaintenanceRecord } from "@/hooks/useMaintenanceRecords";
import { useVehicles } from "@/hooks/useVehicles";
import { formatCurrency, formatKm, parseBRNumber, numberToBRString } from "@/lib/formatters";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateField } from "@/components/ui/date-field";
import { QuickCreateVehicle } from "@/components/shared/QuickCreateVehicle";

const maintenanceTypes = [
  { value: "preventive", label: "Preventiva" },
  { value: "corrective", label: "Corretiva" },
  { value: "predictive", label: "Preditiva" },
  { value: "inspection", label: "Inspeção" },
];

const statusOptions = [
  { value: "scheduled", label: "Agendada", variant: "secondary" as const },
  { value: "in_progress", label: "Em Andamento", variant: "default" as const },
  { value: "completed", label: "Concluída", variant: "outline" as const },
  { value: "canceled", label: "Cancelada", variant: "destructive" as const },
];

const Manutencoes = () => {
  const { records, loading, stats, createRecord, updateRecord, deleteRecord } = useMaintenanceRecords();
  const { vehicles, fetchVehicles } = useVehicles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_id: "",
    maintenance_type: "",
    description: "",
    status: "scheduled",
    service_provider: "",
    parts_cost: "",
    labor_cost: "",
    total_cost: "",
    entry_km: "",
    exit_km: "",
    next_maintenance_km: "",
    notes: "",
  });
  const [entryDate, setEntryDate] = useState<Date | undefined>();
  const [exitDate, setExitDate] = useState<Date | undefined>();
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState<Date | undefined>();

  const filteredRecords = records.filter((item) => {
    const matchesSearch = searchValue === "" ||
      item.vehicle?.prefix?.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.service_provider?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      vehicle_id: "", maintenance_type: "", description: "", status: "scheduled",
      service_provider: "", parts_cost: "", labor_cost: "", total_cost: "",
      entry_km: "", exit_km: "", next_maintenance_km: "", notes: "",
    });
    setEntryDate(undefined);
    setExitDate(undefined);
    setNextMaintenanceDate(undefined);
  };

  const handleCostChange = (field: "parts_cost" | "labor_cost", value: string) => {
    const newFormData = { ...formData, [field]: value };
    const parts = parseBRNumber(newFormData.parts_cost);
    const labor = parseBRNumber(newFormData.labor_cost);
    newFormData.total_cost = numberToBRString(parts + labor);
    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_id || !entryDate || !formData.maintenance_type || !formData.description) return;

    setSaving(true);
    const result = await createRecord({
      vehicle_id: formData.vehicle_id,
      maintenance_type: formData.maintenance_type,
      description: formData.description,
      status: formData.status,
      entry_date: entryDate.toISOString(),
      exit_date: exitDate?.toISOString(),
      entry_km: formData.entry_km ? parseInt(formData.entry_km) : undefined,
      exit_km: formData.exit_km ? parseInt(formData.exit_km) : undefined,
      service_provider: formData.service_provider || undefined,
      parts_cost: formData.parts_cost ? parseBRNumber(formData.parts_cost) : undefined,
      labor_cost: formData.labor_cost ? parseBRNumber(formData.labor_cost) : undefined,
      total_cost: formData.total_cost ? parseBRNumber(formData.total_cost) : undefined,
      next_maintenance_date: nextMaintenanceDate?.toISOString().split("T")[0],
      next_maintenance_km: formData.next_maintenance_km ? parseInt(formData.next_maintenance_km) : undefined,
      notes: formData.notes || undefined,
    });
    setSaving(false);

    if (result) {
      resetForm();
      setIsDialogOpen(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !formData.vehicle_id || !entryDate || !formData.maintenance_type || !formData.description) return;

    setSaving(true);
    const result = await updateRecord(selectedRecord.id, {
      vehicle_id: formData.vehicle_id,
      maintenance_type: formData.maintenance_type,
      description: formData.description,
      status: formData.status,
      entry_date: entryDate.toISOString(),
      exit_date: exitDate?.toISOString(),
      entry_km: formData.entry_km ? parseInt(formData.entry_km) : undefined,
      exit_km: formData.exit_km ? parseInt(formData.exit_km) : undefined,
      service_provider: formData.service_provider || undefined,
      parts_cost: formData.parts_cost ? parseBRNumber(formData.parts_cost) : undefined,
      labor_cost: formData.labor_cost ? parseBRNumber(formData.labor_cost) : undefined,
      total_cost: formData.total_cost ? parseBRNumber(formData.total_cost) : undefined,
      next_maintenance_date: nextMaintenanceDate?.toISOString().split("T")[0],
      next_maintenance_km: formData.next_maintenance_km ? parseInt(formData.next_maintenance_km) : undefined,
      notes: formData.notes || undefined,
    });
    setSaving(false);

    if (result) {
      resetForm();
      setSelectedRecord(null);
      setIsEditDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    setDeleting(true);
    const success = await deleteRecord(selectedRecord.id);
    setDeleting(false);
    if (success) {
      setSelectedRecord(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleView = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setFormData({
      vehicle_id: record.vehicle_id,
      maintenance_type: record.maintenance_type,
      description: record.description,
      status: record.status || "scheduled",
      service_provider: record.service_provider || "",
      parts_cost: numberToBRString(record.parts_cost),
      labor_cost: numberToBRString(record.labor_cost),
      total_cost: numberToBRString(record.total_cost),
      entry_km: String(record.entry_km || ""),
      exit_km: String(record.exit_km || ""),
      next_maintenance_km: String(record.next_maintenance_km || ""),
      notes: record.notes || "",
    });
    setEntryDate(new Date(record.entry_date));
    setExitDate(record.exit_date ? new Date(record.exit_date) : undefined);
    setNextMaintenanceDate(record.next_maintenance_date ? new Date(record.next_maintenance_date) : undefined);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (record: MaintenanceRecord) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string | null) => {
    const opt = statusOptions.find((s) => s.value === status);
    return <Badge variant={opt?.variant || "secondary"}>{opt?.label || status || "N/A"}</Badge>;
  };

  const getTypeLabel = (type: string) => maintenanceTypes.find((t) => t.value === type)?.label || type;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const renderMaintenanceForm = (onSubmit: (e: React.FormEvent) => void, isEdit = false) => (
    <form onSubmit={onSubmit} className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Veículo *</label>
          <div className="flex gap-2">
            <Select value={formData.vehicle_id} onValueChange={(v) => setFormData({ ...formData, vehicle_id: v })}>
              <SelectTrigger className="input-field"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.prefix} - {v.plate}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <QuickCreateVehicle onCreated={(id) => { fetchVehicles(); setFormData({ ...formData, vehicle_id: id }); }} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Tipo *</label>
          <Select value={formData.maintenance_type} onValueChange={(v) => setFormData({ ...formData, maintenance_type: v })}>
            <SelectTrigger className="input-field"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {maintenanceTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Descrição *</label>
        <input type="text" placeholder="Descreva o serviço" className="input-field" value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Data Entrada *</label>
          <DateField value={entryDate} onChange={setEntryDate} placeholder="Selecione" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Data Saída</label>
          <DateField value={exitDate} onChange={setExitDate} placeholder="Selecione" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Status</label>
          <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
            <SelectTrigger className="input-field"><SelectValue /></SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Prestador</label>
          <input type="text" placeholder="Nome da oficina" className="input-field" value={formData.service_provider}
            onChange={(e) => setFormData({ ...formData, service_provider: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">KM Entrada</label>
          <input type="number" placeholder="0" className="input-field" value={formData.entry_km}
            onChange={(e) => setFormData({ ...formData, entry_km: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">KM Saída</label>
          <input type="number" placeholder="0" className="input-field" value={formData.exit_km}
            onChange={(e) => setFormData({ ...formData, exit_km: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Peças (R$)</label>
          <CurrencyInput value={formData.parts_cost}
            onChange={(v) => handleCostChange("parts_cost", v)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Mão de Obra (R$)</label>
          <CurrencyInput value={formData.labor_cost}
            onChange={(v) => handleCostChange("labor_cost", v)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Custo Total (R$)</label>
          <CurrencyInput value={formData.total_cost}
            onChange={() => {}} readOnly />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Próxima Manutenção</label>
          <DateField value={nextMaintenanceDate} onChange={setNextMaintenanceDate} placeholder="Selecione" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Próxima KM</label>
          <input type="number" placeholder="0" className="input-field" value={formData.next_maintenance_km}
            onChange={(e) => setFormData({ ...formData, next_maintenance_km: e.target.value })} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Observações</label>
        <textarea placeholder="Observações adicionais..." className="input-field min-h-[80px]" value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={() => { resetForm(); isEdit ? setIsEditDialogOpen(false) : setIsDialogOpen(false); }} className="btn-secondary flex-1">
          Cancelar
        </button>
        <button type="submit" className="btn-primary flex-1" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? "Atualizar" : "Salvar"}
        </button>
      </div>
    </form>
  );

  return (
    <Layout>
      <div className="animate-fade-in">
        <BackToHome />
        <div className="flex items-center justify-between mb-8">
          <div className="page-header mb-0">
            <h1 className="page-title">Manutenções</h1>
            <p className="page-subtitle">Controle de manutenção preventiva e corretiva da frota</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary">
                <Plus className="w-5 h-5" />
                Nova Manutenção
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">Registrar Manutenção</DialogTitle>
              </DialogHeader>
              {renderMaintenanceForm(handleSubmit)}
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Custo Total</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalCost)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Agendadas</p>
            <p className="text-2xl font-bold text-foreground">{stats.scheduled}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Em Andamento</p>
            <p className="text-2xl font-bold text-warning">{stats.inProgress}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold text-foreground">{records.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="stat-card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input placeholder="Buscar por veículo, descrição ou prestador..." value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)} className="input-field pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="input-field w-48"><SelectValue placeholder="Todos os status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statusOptions.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Empty State */}
        {records.length === 0 ? (
          <div className="stat-card text-center py-12">
            <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma manutenção registrada</h3>
            <p className="text-muted-foreground mb-4">Comece registrando sua primeira manutenção.</p>
            <button onClick={() => setIsDialogOpen(true)} className="btn-primary">
              <Plus className="w-5 h-5" />
              Registrar Manutenção
            </button>
          </div>
        ) : (
          <div className="stat-card overflow-hidden p-0">
            <ScrollArea className="w-full">
              <div className="min-w-[1000px]">
                <table className="data-table">
                  <thead>
                    <tr className="bg-secondary/30">
                      <th>Veículo</th>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th>Data Entrada</th>
                      <th>Status</th>
                      <th>Prestador</th>
                      <th className="text-right">Custo Total</th>
                      <th className="text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                              <Wrench className="w-5 h-5 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">{item.vehicle?.prefix || "N/A"}</span>
                          </div>
                        </td>
                        <td className="text-muted-foreground">{getTypeLabel(item.maintenance_type)}</td>
                        <td className="text-foreground max-w-[200px] truncate">{item.description}</td>
                        <td className="text-muted-foreground">{new Date(item.entry_date).toLocaleDateString("pt-BR")}</td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td className="text-muted-foreground">{item.service_provider || "-"}</td>
                        <td className="text-right font-semibold text-foreground">{formatCurrency(Number(item.total_cost) || 0)}</td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(item)}>
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteClick(item)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Detalhes da Manutenção</DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Veículo</p><p className="text-sm font-medium text-foreground">{selectedRecord.vehicle?.prefix} - {selectedRecord.vehicle?.plate}</p></div>
                  <div><p className="text-xs text-muted-foreground">Tipo</p><p className="text-sm font-medium text-foreground">{getTypeLabel(selectedRecord.maintenance_type)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Data Entrada</p><p className="text-sm font-medium text-foreground">{new Date(selectedRecord.entry_date).toLocaleDateString("pt-BR")}</p></div>
                  <div><p className="text-xs text-muted-foreground">Data Saída</p><p className="text-sm font-medium text-foreground">{selectedRecord.exit_date ? new Date(selectedRecord.exit_date).toLocaleDateString("pt-BR") : "-"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Status</p>{getStatusBadge(selectedRecord.status)}</div>
                  <div><p className="text-xs text-muted-foreground">Prestador</p><p className="text-sm font-medium text-foreground">{selectedRecord.service_provider || "-"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Custo Peças</p><p className="text-sm font-medium text-foreground">{formatCurrency(Number(selectedRecord.parts_cost) || 0)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Mão de Obra</p><p className="text-sm font-medium text-foreground">{formatCurrency(Number(selectedRecord.labor_cost) || 0)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Custo Total</p><p className="text-sm font-semibold text-foreground">{formatCurrency(Number(selectedRecord.total_cost) || 0)}</p></div>
                  <div><p className="text-xs text-muted-foreground">KM Entrada</p><p className="text-sm font-medium text-foreground">{selectedRecord.entry_km ? formatKm(selectedRecord.entry_km) : "-"}</p></div>
                </div>
                <div><p className="text-xs text-muted-foreground">Descrição</p><p className="text-sm text-foreground">{selectedRecord.description}</p></div>
                {selectedRecord.notes && <div><p className="text-xs text-muted-foreground">Observações</p><p className="text-sm text-foreground">{selectedRecord.notes}</p></div>}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) { resetForm(); setSelectedRecord(null); } setIsEditDialogOpen(open); }}>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Manutenção</DialogTitle>
            </DialogHeader>
            {renderMaintenanceForm(handleEditSubmit, true)}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir manutenção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Manutencoes;
