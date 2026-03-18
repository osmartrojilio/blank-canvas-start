import { useState } from "react";
import { Plus, MapPin, ArrowRight, Save, Search, Loader2, FileText } from "lucide-react";
import { BackToHome } from "@/components/shared/BackToHome";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Layout from "@/components/layout/Layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTrips, Trip } from "@/hooks/useTrips";
import { useVehicles } from "@/hooks/useVehicles";
import { TripCtePreview } from "@/components/trips/TripCtePreview";
import { formatCurrency, formatKm, formatTonnage, parseBRNumber, numberToBRString } from "@/lib/formatters";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateField } from "@/components/ui/date-field";
import { QuickCreateVehicle } from "@/components/shared/QuickCreateVehicle";
import { QuickCreateClient } from "@/components/shared/QuickCreateClient";
import { useClients } from "@/hooks/useClients";

const statusLabels = {
  scheduled: { label: "Agendada", class: "badge-status bg-secondary text-muted-foreground" },
  in_progress: { label: "Em Andamento", class: "badge-warning" },
  completed: { label: "Concluída", class: "badge-success" },
  cancelled: { label: "Cancelada", class: "badge-danger" },
};

const statusFilterOptions = [
  { value: "", label: "Todos os status" },
  { value: "scheduled", label: "Agendada" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

const Viagens = () => {
  const { trips, loading, stats, createTrip } = useTrips();
  const { vehicles, fetchVehicles } = useVehicles();
  const { clients, fetchClients } = useClients();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);
  const [cteTrip, setCteTrip] = useState<Trip | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    vehicle_id: "",
    origin: "",
    destination: "",
    client_name: "",
    start_km: "",
    tonnage: "",
    freight_value: "",
  });
  const [formDate, setFormDate] = useState<Date | undefined>();

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch = searchValue === "" || 
      trip.client_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
      trip.origin.toLowerCase().includes(searchValue.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === "" || statusFilter === "all" || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_id || !formData.origin || !formData.destination || !formDate) {
      return;
    }

    setSaving(true);
    const result = await createTrip({
      vehicle_id: formData.vehicle_id,
      origin: formData.origin,
      destination: formData.destination,
      start_date: formDate.toISOString(),
      start_km: parseInt(formData.start_km) || 0,
      client_name: formData.client_name || undefined,
      tonnage: formData.tonnage ? parseFloat(formData.tonnage) : undefined,
      freight_value: formData.freight_value ? parseBRNumber(formData.freight_value) : undefined,
      status: "scheduled",
    });
    setSaving(false);

    if (result) {
      setFormData({
        vehicle_id: "",
        origin: "",
        destination: "",
        client_name: "",
        start_km: "",
        tonnage: "",
        freight_value: "",
      });
      setFormDate(undefined);
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
            <h1 className="page-title">Viagens</h1>
            <p className="page-subtitle">Controle de rotas e faturamento</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary">
                <Plus className="w-5 h-5" />
                Nova Viagem
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">Registrar Viagem</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Cliente</label>
                  <div className="flex gap-2">
                    <Select value={formData.client_name} onValueChange={(v) => setFormData({...formData, client_name: v})}>
                      <SelectTrigger className="input-field flex-1">
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.name}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <QuickCreateClient onCreated={(_, name) => { fetchClients(); setFormData({...formData, client_name: name}); }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Origem</label>
                    <input 
                      type="text" 
                      placeholder="Cidade, Estado" 
                      className="input-field"
                      value={formData.origin}
                      onChange={(e) => setFormData({...formData, origin: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Destino</label>
                    <input 
                      type="text" 
                      placeholder="Cidade, Estado" 
                      className="input-field"
                      value={formData.destination}
                      onChange={(e) => setFormData({...formData, destination: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">KM Inicial</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      className="input-field"
                      value={formData.start_km}
                      onChange={(e) => setFormData({...formData, start_km: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Toneladas</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      placeholder="0" 
                      className="input-field"
                      value={formData.tonnage}
                      onChange={(e) => setFormData({...formData, tonnage: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Valor Frete (R$)</label>
                    <CurrencyInput
                      value={formData.freight_value}
                      onChange={(v) => setFormData({...formData, freight_value: v})}
                    />
                  </div>
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Total de Viagens</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalTrips}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">KM Total</p>
            <p className="text-2xl font-bold text-foreground">{formatKm(stats.totalKm)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Toneladas</p>
            <p className="text-2xl font-bold text-foreground">{formatTonnage(stats.totalTonnage)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Faturamento</p>
            <p className="text-2xl font-bold text-gradient">{formatCurrency(stats.totalRevenue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="stat-card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, origem ou destino..."
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
                {statusFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value || "all"}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateField value={dateFilter} onChange={setDateFilter} placeholder="Filtrar por data" className="w-44" />
          </div>
        </div>

        {/* Empty State */}
        {trips.length === 0 ? (
          <div className="stat-card text-center py-12">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma viagem registrada</h3>
            <p className="text-muted-foreground mb-4">Comece registrando sua primeira viagem.</p>
            <button onClick={() => setIsDialogOpen(true)} className="btn-primary">
              <Plus className="w-5 h-5" />
              Registrar Viagem
            </button>
          </div>
        ) : (
          /* Cards View with Scroll */
          <ScrollArea className="h-[calc(100vh-380px)] rounded-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pr-4">
              {filteredTrips.map((trip) => (
                <div key={trip.id} className="stat-card hover:border-primary/30 border border-transparent transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{trip.client_name || "Sem cliente"}</p>
                        <p className="text-sm text-muted-foreground">
                          {trip.vehicle?.prefix || "N/A"} • {trip.driver?.profile?.full_name || "Sem motorista"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge-status ${statusLabels[trip.status as keyof typeof statusLabels]?.class || ""}`}>
                        {statusLabels[trip.status as keyof typeof statusLabels]?.label || trip.status}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCteTrip(trip)}>
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-muted-foreground">{trip.origin}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{trip.destination}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Data</p>
                      <p className="font-medium text-foreground">{new Date(trip.start_date).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Toneladas</p>
                      <p className="font-medium text-foreground">{formatTonnage(trip.tonnage || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Frete</p>
                      <p className="font-semibold text-gradient">{formatCurrency(trip.freight_value || 0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar />
          </ScrollArea>
        )}

        {/* CTE Preview */}
        {cteTrip && <TripCtePreview trip={cteTrip} open={true} onClose={() => setCteTrip(null)} />}
      </div>
    </Layout>
  );
};

export default Viagens;
