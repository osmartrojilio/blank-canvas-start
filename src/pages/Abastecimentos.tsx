import { useState } from "react";
import { Plus, Fuel, Save, Search, Loader2, Eye, Pencil, Trash2 } from "lucide-react";
import { BackToHome } from "@/components/shared/BackToHome";
import Layout from "@/components/layout/Layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useFuelRecords, FuelRecord } from "@/hooks/useFuelRecords";
import { useVehicles } from "@/hooks/useVehicles";
import { formatCurrency, formatKm, formatDecimalBR, parseBRNumber, maskCurrencyInput, numberToBRString } from "@/lib/formatters";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateField } from "@/components/ui/date-field";
import { QuickCreateVehicle } from "@/components/shared/QuickCreateVehicle";

const Abastecimentos = () => {
  const { fuelRecords, loading, stats, createFuelRecord, updateFuelRecord, deleteFuelRecord } = useFuelRecords();
  const { vehicles, fetchVehicles } = useVehicles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FuelRecord | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    vehicle_id: "",
    liters: "",
    price_per_liter: "",
    total_value: "",
    odometer: "",
    gas_station: "",
  });
  const [formDate, setFormDate] = useState<Date | undefined>();

  const filteredRecords = fuelRecords.filter((item) => {
    const matchesSearch = searchValue === "" || 
      item.vehicle?.prefix?.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.gas_station?.toLowerCase().includes(searchValue.toLowerCase());
    return matchesSearch;
  });

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
      liters: "",
      price_per_liter: "",
      total_value: "",
      odometer: "",
      gas_station: "",
    });
    setFormDate(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_id || !formDate || !formData.liters || !formData.price_per_liter || !formData.odometer) {
      return;
    }

    setSaving(true);
    const result = await createFuelRecord({
      vehicle_id: formData.vehicle_id,
      fuel_date: formDate.toISOString(),
      liters: parseFloat(formData.liters) || 0,
      price_per_liter: parseBRNumber(formData.price_per_liter),
      total_value: parseBRNumber(formData.total_value) || (parseFloat(formData.liters) || 0) * parseBRNumber(formData.price_per_liter),
      odometer: parseInt(formData.odometer),
      gas_station: formData.gas_station || undefined,
    });
    setSaving(false);

    if (result) {
      resetForm();
      setIsDialogOpen(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !formData.vehicle_id || !formDate || !formData.liters || !formData.price_per_liter || !formData.odometer) {
      return;
    }

    setSaving(true);
    const result = await updateFuelRecord(selectedRecord.id, {
      vehicle_id: formData.vehicle_id,
      fuel_date: formDate.toISOString(),
      liters: parseFloat(formData.liters) || 0,
      price_per_liter: parseBRNumber(formData.price_per_liter),
      total_value: parseBRNumber(formData.total_value) || (parseFloat(formData.liters) || 0) * parseBRNumber(formData.price_per_liter),
      odometer: parseInt(formData.odometer),
      gas_station: formData.gas_station || undefined,
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
    const success = await deleteFuelRecord(selectedRecord.id);
    setDeleting(false);

    if (success) {
      setSelectedRecord(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleView = (record: FuelRecord) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (record: FuelRecord) => {
    setSelectedRecord(record);
    setFormData({
      vehicle_id: record.vehicle_id,
      liters: String(record.liters),
      price_per_liter: numberToBRString(record.price_per_liter),
      total_value: numberToBRString(record.total_value),
      odometer: String(record.odometer),
      gas_station: record.gas_station || "",
    });
    setFormDate(new Date(record.fuel_date));
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (record: FuelRecord) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  };

  // Auto-calculate total value
  const handleLitersOrPriceChange = (field: "liters" | "price_per_liter", value: string) => {
    const newFormData = { ...formData, [field]: value };
    const liters = field === "liters" ? (parseFloat(value) || 0) : (parseFloat(newFormData.liters) || 0);
    const price = field === "price_per_liter" ? parseBRNumber(value) : parseBRNumber(newFormData.price_per_liter);
    if (liters && price) {
      newFormData.total_value = numberToBRString(liters * price);
    }
    setFormData(newFormData);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const renderFuelForm = (onSubmit: (e: React.FormEvent) => void, isEdit = false) => (
    <form onSubmit={onSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Veículo</label>
          <div className="flex gap-2">
            <Select value={formData.vehicle_id} onValueChange={(v) => setFormData({...formData, vehicle_id: v})}>
              <SelectTrigger className="input-field">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.prefix} - {v.plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <QuickCreateVehicle onCreated={(id) => { fetchVehicles(); setFormData({...formData, vehicle_id: id}); }} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Data</label>
          <DateField value={formDate} onChange={setFormDate} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Litros</label>
          <input
            type="number"
            step="0.01"
            placeholder="0"
            className="input-field"
            value={formData.liters}
            onChange={(e) => handleLitersOrPriceChange("liters", e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Preço/Litro (R$)</label>
          <CurrencyInput
            value={formData.price_per_liter}
            onChange={(v) => handleLitersOrPriceChange("price_per_liter", v)}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Valor Total (R$)</label>
          <CurrencyInput
            value={formData.total_value}
            onChange={(v) => setFormData({...formData, total_value: v})}
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Odômetro (km)</label>
          <input 
            type="number" 
            placeholder="0" 
            className="input-field"
            value={formData.odometer}
            onChange={(e) => setFormData({...formData, odometer: e.target.value})}
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Posto de Abastecimento</label>
        <input 
          type="text" 
          placeholder="Nome do posto" 
          className="input-field"
          value={formData.gas_station}
          onChange={(e) => setFormData({...formData, gas_station: e.target.value})}
        />
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
            <h1 className="page-title">Abastecimentos</h1>
            <p className="page-subtitle">Controle de combustível da frota</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary">
                <Plus className="w-5 h-5" />
                Novo Abastecimento
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-foreground">Registrar Abastecimento</DialogTitle>
              </DialogHeader>
              {renderFuelForm(handleSubmit)}
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Total Gasto</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalValue)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Litros Abastecidos</p>
            <p className="text-2xl font-bold text-foreground">{formatDecimalBR(stats.totalLiters, 1)} L</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Preço Médio</p>
            <p className="text-2xl font-bold text-foreground">R$ {formatDecimalBR(stats.avgPrice)}/L</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Registros</p>
            <p className="text-2xl font-bold text-foreground">{fuelRecords.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="stat-card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por veículo ou posto..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <DateField value={startDate} onChange={setStartDate} placeholder="Data inicial" className="w-40" />
            <DateField value={endDate} onChange={setEndDate} placeholder="Data final" className="w-40" />
          </div>
        </div>

        {/* Empty State */}
        {fuelRecords.length === 0 ? (
          <div className="stat-card text-center py-12">
            <Fuel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum abastecimento registrado</h3>
            <p className="text-muted-foreground mb-4">Comece registrando seu primeiro abastecimento.</p>
            <button onClick={() => setIsDialogOpen(true)} className="btn-primary">
              <Plus className="w-5 h-5" />
              Registrar Abastecimento
            </button>
          </div>
        ) : (
          /* Table with Scroll */
          <div className="stat-card overflow-hidden p-0">
            <ScrollArea className="w-full">
              <div className="min-w-[900px]">
                <table className="data-table">
                  <thead>
                    <tr className="bg-secondary/30">
                      <th>Veículo</th>
                      <th>Data</th>
                      <th>Litros</th>
                      <th>Preço/L</th>
                      <th>Valor Total</th>
                      <th>Odômetro</th>
                      <th>Posto</th>
                      <th className="text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-warning/20 flex items-center justify-center">
                              <Fuel className="w-5 h-5 text-warning" />
                            </div>
                            <span className="font-medium text-foreground">{item.vehicle?.prefix || "N/A"}</span>
                          </div>
                        </td>
                        <td className="text-muted-foreground">
                          {new Date(item.fuel_date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="text-foreground font-medium">{formatDecimalBR(Number(item.liters), 1)} L</td>
                        <td className="text-muted-foreground">
                          R$ {formatDecimalBR(Number(item.price_per_liter))}
                        </td>
                        <td className="text-foreground font-semibold">
                          {formatCurrency(Number(item.total_value))}
                        </td>
                        <td className="text-muted-foreground">{formatKm(item.odometer)}</td>
                        <td className="text-muted-foreground max-w-[150px] truncate">{item.gas_station || "-"}</td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleView(item)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteClick(item)}
                            >
                              <Trash2 className="w-4 h-4" />
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
              <DialogTitle className="text-foreground">Detalhes do Abastecimento</DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Veículo</p>
                    <p className="text-sm font-medium text-foreground">{selectedRecord.vehicle?.prefix} - {selectedRecord.vehicle?.plate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data</p>
                    <p className="text-sm font-medium text-foreground">{new Date(selectedRecord.fuel_date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Litros</p>
                    <p className="text-sm font-medium text-foreground">{formatDecimalBR(Number(selectedRecord.liters), 1)} L</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Preço/Litro</p>
                    <p className="text-sm font-medium text-foreground">R$ {formatDecimalBR(Number(selectedRecord.price_per_liter))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Total</p>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(Number(selectedRecord.total_value))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Odômetro</p>
                    <p className="text-sm font-medium text-foreground">{formatKm(selectedRecord.odometer)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Posto</p>
                  <p className="text-sm text-foreground">{selectedRecord.gas_station || "-"}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { if (!open) { resetForm(); setSelectedRecord(null); } setIsEditDialogOpen(open); }}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Abastecimento</DialogTitle>
            </DialogHeader>
            {renderFuelForm(handleEditSubmit, true)}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir abastecimento</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este registro de abastecimento? Esta ação não pode ser desfeita.
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

export default Abastecimentos;
