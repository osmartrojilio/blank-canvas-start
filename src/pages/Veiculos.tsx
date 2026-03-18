import { useState } from "react";
import { Plus, Edit, Trash2, Eye, Car, Save, Search, Loader2 } from "lucide-react";
import { BackToHome } from "@/components/shared/BackToHome";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import UpgradeBanner from "@/components/plan/UpgradeBanner";
import Layout from "@/components/layout/Layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useVehicles, Vehicle, VehicleFormData } from "@/hooks/useVehicles";
import { maskPlate, formatKm } from "@/lib/formatters";

const statusLabels = {
  available: { label: "Disponível", class: "badge-success" },
  in_use: { label: "Em Uso", class: "badge-warning" },
  maintenance: { label: "Manutenção", class: "badge-danger" },
  inactive: { label: "Inativo", class: "badge-status bg-secondary text-muted-foreground" },
};

const statusOptions = [
  { value: "", label: "Todos os status" },
  { value: "available", label: "Disponível" },
  { value: "in_use", label: "Em Uso" },
  { value: "maintenance", label: "Manutenção" },
  { value: "inactive", label: "Inativo" },
];

const formStatusOptions = [
  { value: "available", label: "Disponível" },
  { value: "in_use", label: "Em Uso" },
  { value: "maintenance", label: "Em Manutenção" },
  { value: "inactive", label: "Inativo" },
];

const Veiculos = () => {
  const { vehicles, loading, createVehicle, updateVehicle, deleteVehicle } = useVehicles();
  const { maxVehicles, isFreePlan } = usePlanLimits();
  const vehicleLimitReached = maxVehicles !== null && vehicles.length >= maxVehicles;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [saving, setSaving] = useState(false);
  
  // New vehicle form states
  const [newForm, setNewForm] = useState({
    prefix: "",
    plate: "",
    model: "",
    year: "",
    current_km: "",
    status: "",
  });
  
  // View/Edit/Delete states
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Edit form states
  const [editForm, setEditForm] = useState({
    prefix: "",
    plate: "",
    model: "",
    year: "",
    current_km: "",
    status: "",
  });
  
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = searchValue === "" || 
      vehicle.prefix.toLowerCase().includes(searchValue.toLowerCase()) ||
      vehicle.plate.toLowerCase().includes(searchValue.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === "" || statusFilter === "all" || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleView = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setEditForm({
      prefix: vehicle.prefix,
      plate: vehicle.plate,
      model: vehicle.model,
      year: vehicle.year?.toString() || "",
      current_km: vehicle.current_km.toString(),
      status: vehicle.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedVehicle) {
      setSaving(true);
      await deleteVehicle(selectedVehicle.id, selectedVehicle.prefix);
      setSaving(false);
      setIsDeleteDialogOpen(false);
      setSelectedVehicle(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVehicle) {
      setSaving(true);
      await updateVehicle(selectedVehicle.id, {
        prefix: editForm.prefix,
        plate: editForm.plate,
        model: editForm.model,
        year: editForm.year ? parseInt(editForm.year) : undefined,
        current_km: parseInt(editForm.current_km) || 0,
        status: editForm.status as Vehicle["status"],
      });
      setSaving(false);
      setIsEditDialogOpen(false);
      setSelectedVehicle(null);
    }
  };

  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await createVehicle({
      prefix: newForm.prefix,
      plate: newForm.plate,
      model: newForm.model,
      year: newForm.year ? parseInt(newForm.year) : undefined,
      current_km: parseInt(newForm.current_km) || 0,
      status: (newForm.status || "available") as Vehicle["status"],
    });
    setSaving(false);
    if (result) {
      setNewForm({ prefix: "", plate: "", model: "", year: "", current_km: "", status: "" });
      setIsDialogOpen(false);
    }
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

  return (
    <Layout>
      <div className="animate-fade-in">
        <BackToHome />
        <div className="flex items-center justify-between mb-8">
          <div className="page-header mb-0">
            <h1 className="page-title">Veículos</h1>
            <p className="page-subtitle">Gerencie sua frota de veículos</p>
          </div>

          {vehicleLimitReached ? (
            <UpgradeBanner message={`O plano gratuito permite apenas ${maxVehicles} veículo. Faça upgrade para cadastrar mais.`} compact />
          ) : (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary">
                <Plus className="w-5 h-5" />
                Novo Veículo
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-foreground">Cadastrar Veículo</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleNewSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Prefixo</label>
                    <input 
                      type="text" 
                      placeholder="VEI-006" 
                      value={newForm.prefix}
                      onChange={(e) => setNewForm({...newForm, prefix: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Placa</label>
                    <input 
                      type="text" 
                      placeholder="ABC-1234" 
                      value={newForm.plate}
                      onChange={(e) => setNewForm({...newForm, plate: maskPlate(e.target.value)})}
                      className="input-field"
                      required
                      maxLength={8}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Modelo</label>
                  <input 
                    type="text" 
                    placeholder="Volvo FH 540" 
                    value={newForm.model}
                    onChange={(e) => setNewForm({...newForm, model: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Ano</label>
                    <input 
                      type="number" 
                      placeholder="2024" 
                      value={newForm.year}
                      onChange={(e) => setNewForm({...newForm, year: e.target.value})}
                      className="input-field" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Quilometragem</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={newForm.current_km}
                      onChange={(e) => setNewForm({...newForm, current_km: e.target.value})}
                      className="input-field" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                  <Select value={newForm.status} onValueChange={(value) => setNewForm({...newForm, status: value})}>
                    <SelectTrigger className="input-field">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {formStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsDialogOpen(false)} className="btn-secondary flex-1">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary flex-1" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>

        {/* Filters */}
        <div className="stat-card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por prefixo, placa ou modelo..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="input-field w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value || "all"}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Empty State */}
        {vehicles.length === 0 ? (
          <div className="stat-card text-center py-12">
            <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum veículo cadastrado</h3>
            <p className="text-muted-foreground mb-4">Comece adicionando seu primeiro veículo à frota.</p>
            <button onClick={() => setIsDialogOpen(true)} className="btn-primary">
              <Plus className="w-5 h-5" />
              Cadastrar Veículo
            </button>
          </div>
        ) : (
          /* Table with ScrollArea */
          <div className="stat-card overflow-hidden p-0">
            <ScrollArea className="h-[400px]" type="always">
              <div className="min-w-[900px]">
                <table className="data-table w-full">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="bg-secondary/30">
                    <th>Prefixo</th>
                    <th>Placa</th>
                    <th>Modelo</th>
                    <th>Ano</th>
                    <th>Quilometragem</th>
                    <th>Status</th>
                    <th className="text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Car className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{vehicle.prefix}</span>
                        </div>
                      </td>
                      <td className="text-muted-foreground">{vehicle.plate}</td>
                      <td className="text-foreground">{vehicle.model}</td>
                      <td className="text-muted-foreground">{vehicle.year || "-"}</td>
                      <td className="text-muted-foreground">{formatKm(vehicle.current_km)}</td>
                      <td>
                        <span className={`badge-status ${statusLabels[vehicle.status]?.class || "badge-status"}`}>
                          {statusLabels[vehicle.status]?.label || vehicle.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleView(vehicle)}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button 
                            onClick={() => handleEdit(vehicle)}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(vehicle)}
                            className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
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
              <DialogTitle className="text-foreground">Detalhes do Veículo</DialogTitle>
            </DialogHeader>
            {selectedVehicle && (
              <div className="space-y-4 mt-4">
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                  <div className="w-14 h-14 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Car className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{selectedVehicle.prefix}</h3>
                    <p className="text-muted-foreground">{selectedVehicle.model}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Placa</label>
                    <p className="font-medium text-foreground">{selectedVehicle.plate}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Ano</label>
                    <p className="font-medium text-foreground">{selectedVehicle.year || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Quilometragem</label>
                    <p className="font-medium text-foreground">{formatKm(selectedVehicle.current_km)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Status</label>
                    <p>
                      <span className={`badge-status ${statusLabels[selectedVehicle.status]?.class || ""}`}>
                        {statusLabels[selectedVehicle.status]?.label || selectedVehicle.status}
                      </span>
                    </p>
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <button onClick={() => setIsViewDialogOpen(false)} className="btn-secondary">
                    Fechar
                  </button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Veículo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Prefixo</label>
                  <input 
                    type="text" 
                    value={editForm.prefix}
                    onChange={(e) => setEditForm({...editForm, prefix: e.target.value})}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Placa</label>
                  <input 
                    type="text" 
                    value={editForm.plate}
                    onChange={(e) => setEditForm({...editForm, plate: maskPlate(e.target.value)})}
                    className="input-field"
                    required
                    maxLength={8}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Modelo</label>
                <input 
                  type="text" 
                  value={editForm.model}
                  onChange={(e) => setEditForm({...editForm, model: e.target.value})}
                  className="input-field"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Ano</label>
                  <input 
                    type="number" 
                    value={editForm.year}
                    onChange={(e) => setEditForm({...editForm, year: e.target.value})}
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Quilometragem</label>
                  <input 
                    type="number" 
                    value={editForm.current_km}
                    onChange={(e) => setEditForm({...editForm, current_km: e.target.value})}
                    className="input-field" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                  <SelectTrigger className="input-field">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {formStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditDialogOpen(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o veículo <strong>{selectedVehicle?.prefix}</strong>? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default Veiculos;
