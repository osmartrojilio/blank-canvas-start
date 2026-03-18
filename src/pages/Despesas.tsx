import { useState } from "react";
import { Plus, Wrench, DollarSign, Save, Search, Loader2, Eye, Pencil, Trash2 } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useExpenses, ExpenseType, Expense } from "@/hooks/useExpenses";
import { useVehicles } from "@/hooks/useVehicles";
import { formatCurrency, parseBRNumber, numberToBRString } from "@/lib/formatters";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DateField } from "@/components/ui/date-field";
import { QuickCreateVehicle } from "@/components/shared/QuickCreateVehicle";

const tipoLabels: Record<ExpenseType, { label: string; class: string }> = {
  maintenance: { label: "Manutenção", class: "badge-warning" },
  tire: { label: "Pneus", class: "badge-status bg-primary/20 text-primary" },
  toll: { label: "Pedágio", class: "badge-status bg-secondary text-muted-foreground" },
  parts: { label: "Peças", class: "badge-success" },
  insurance: { label: "Seguro", class: "badge-status bg-blue-500/20 text-blue-500" },
  tax: { label: "Imposto", class: "badge-status bg-purple-500/20 text-purple-500" },
  fine: { label: "Multa", class: "badge-danger" },
  other: { label: "Outros", class: "badge-status bg-secondary text-muted-foreground" },
};

const tipoOptions = [
  { value: "", label: "Todos os tipos" },
  { value: "maintenance", label: "Manutenção" },
  { value: "tire", label: "Pneus" },
  { value: "toll", label: "Pedágio" },
  { value: "parts", label: "Peças" },
  { value: "insurance", label: "Seguro" },
  { value: "tax", label: "Imposto" },
  { value: "fine", label: "Multa" },
  { value: "other", label: "Outros" },
];

const tipoFormOptions = tipoOptions.filter((o) => o.value);

const Despesas = () => {
  const { expenses, loading, stats, createExpense, updateExpense, deleteExpense } = useExpenses();
  const { vehicles, fetchVehicles } = useVehicles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [veiculoFilter, setVeiculoFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);

  // View/Edit/Delete states
  const [viewExpense, setViewExpense] = useState<Expense | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Edit form states
  const [editFormData, setEditFormData] = useState({
    vehicle_id: "",
    expense_type: "",
    description: "",
    supplier: "",
    value: "",
  });
  const [editFormDate, setEditFormDate] = useState<Date | undefined>();

  // Form states
  const [formData, setFormData] = useState({
    vehicle_id: "",
    expense_type: "",
    description: "",
    supplier: "",
    value: "",
  });
  const [formDate, setFormDate] = useState<Date | undefined>();

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = searchValue === "" || 
      expense.description.toLowerCase().includes(searchValue.toLowerCase()) ||
      expense.supplier?.toLowerCase().includes(searchValue.toLowerCase());
    const matchesTipo = tipoFilter === "" || tipoFilter === "all" || expense.expense_type === tipoFilter;
    const matchesVeiculo = veiculoFilter === "" || veiculoFilter === "all" || expense.vehicle_id === veiculoFilter;
    return matchesSearch && matchesTipo && matchesVeiculo;
  });

  const openEdit = (expense: Expense) => {
    setEditFormData({
      vehicle_id: expense.vehicle_id || "",
      expense_type: expense.expense_type,
      description: expense.description,
      supplier: expense.supplier || "",
      value: numberToBRString(expense.value),
    });
    setEditFormDate(new Date(expense.expense_date));
    setEditExpense(expense);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editExpense || !editFormData.expense_type || !editFormData.description || !editFormData.value || !editFormDate) return;

    setSaving(true);
    const result = await updateExpense(editExpense.id, {
      vehicle_id: editFormData.vehicle_id || undefined,
      expense_date: editFormDate.toISOString(),
      expense_type: editFormData.expense_type as ExpenseType,
      description: editFormData.description,
      supplier: editFormData.supplier || undefined,
      value: parseBRNumber(editFormData.value),
    });
    setSaving(false);
    if (result) setEditExpense(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteExpense(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expense_type || !formData.description || !formData.value || !formDate) {
      return;
    }

    setSaving(true);
    const result = await createExpense({
      vehicle_id: formData.vehicle_id || undefined,
      expense_date: formDate.toISOString(),
      expense_type: formData.expense_type as ExpenseType,
      description: formData.description,
      supplier: formData.supplier || undefined,
      value: parseBRNumber(formData.value),
    });
    setSaving(false);

    if (result) {
      setFormData({ vehicle_id: "", expense_type: "", description: "", supplier: "", value: "" });
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
            <h1 className="page-title">Despesas e Manutenções</h1>
            <p className="page-subtitle">Controle de gastos com a frota</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary">
                <Plus className="w-5 h-5" />
                Nova Despesa
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-foreground">Registrar Despesa</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Veículo (opcional)</label>
                    <div className="flex gap-2">
                      <Select value={formData.vehicle_id} onValueChange={(v) => setFormData({...formData, vehicle_id: v})}>
                        <SelectTrigger className="input-field">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
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
                  <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                  <Select value={formData.expense_type} onValueChange={(v) => setFormData({...formData, expense_type: v})}>
                    <SelectTrigger className="input-field">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoFormOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Descrição</label>
                  <input 
                    type="text" 
                    placeholder="Descreva a despesa" 
                    className="input-field"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Fornecedor</label>
                    <input 
                      type="text" 
                      placeholder="Nome do fornecedor" 
                      className="input-field"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Valor (R$)</label>
                    <CurrencyInput
                      value={formData.value}
                      onChange={(v) => setFormData({...formData, value: v})}
                      required
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
            <p className="text-sm text-muted-foreground mb-1">Total de Despesas</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(stats.total)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Manutenção</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.byType.maintenance || 0)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Peças</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.byType.parts || 0)}</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground mb-1">Registros</p>
            <p className="text-2xl font-bold text-foreground">{expenses.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="stat-card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição ou fornecedor..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="input-field w-44">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                {tipoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value || "all"}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={veiculoFilter} onValueChange={setVeiculoFilter}>
              <SelectTrigger className="input-field w-48">
                <SelectValue placeholder="Todos os veículos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os veículos</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.prefix}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateField value={dateFilter} onChange={setDateFilter} placeholder="Filtrar por data" className="w-44" />
          </div>
        </div>

        {/* Empty State */}
        {expenses.length === 0 ? (
          <div className="stat-card text-center py-12">
            <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma despesa registrada</h3>
            <p className="text-muted-foreground mb-4">Comece registrando sua primeira despesa.</p>
            <button onClick={() => setIsDialogOpen(true)} className="btn-primary">
              <Plus className="w-5 h-5" />
              Registrar Despesa
            </button>
          </div>
        ) : (
          <div className="stat-card overflow-hidden p-0">
            <ScrollArea className="w-full">
              <div className="min-w-[900px]">
                <table className="data-table">
                  <thead>
                    <tr className="bg-secondary/30">
                      <th>Veículo</th>
                      <th>Data</th>
                      <th>Tipo</th>
                      <th>Descrição</th>
                      <th>Fornecedor</th>
                      <th className="text-right">Valor</th>
                      <th className="text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-destructive/20 flex items-center justify-center">
                              <Wrench className="w-5 h-5 text-destructive" />
                            </div>
                            <span className="font-medium text-foreground">{expense.vehicle?.prefix || "Geral"}</span>
                          </div>
                        </td>
                        <td className="text-muted-foreground">
                          {new Date(expense.expense_date).toLocaleDateString("pt-BR")}
                        </td>
                        <td>
                          <span className={`badge-status ${tipoLabels[expense.expense_type]?.class || ""}`}>
                            {tipoLabels[expense.expense_type]?.label || expense.expense_type}
                          </span>
                        </td>
                        <td className="text-foreground max-w-[250px] truncate">{expense.description}</td>
                        <td className="text-muted-foreground">{expense.supplier || "-"}</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <DollarSign className="w-4 h-4 text-destructive" />
                            <span className="font-semibold text-destructive">
                              {formatCurrency(Number(expense.value))}
                            </span>
                          </div>
                        </td>
                        <td className="text-right">
                          <TooltipProvider>
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewExpense(expense)}>
                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Visualizar</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(expense)}>
                                    <Pencil className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(expense)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Excluir</TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
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
        <Dialog open={!!viewExpense} onOpenChange={(open) => !open && setViewExpense(null)}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Detalhes da Despesa</DialogTitle>
            </DialogHeader>
            {viewExpense && (
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Veículo</p><p className="text-sm font-medium text-foreground">{viewExpense.vehicle?.prefix || "Geral"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Data</p><p className="text-sm font-medium text-foreground">{new Date(viewExpense.expense_date).toLocaleDateString("pt-BR")}</p></div>
                  <div><p className="text-xs text-muted-foreground">Tipo</p><p className="text-sm font-medium text-foreground">{tipoLabels[viewExpense.expense_type]?.label || viewExpense.expense_type}</p></div>
                  <div><p className="text-xs text-muted-foreground">Valor</p><p className="text-sm font-semibold text-destructive">{formatCurrency(Number(viewExpense.value))}</p></div>
                </div>
                <div><p className="text-xs text-muted-foreground">Descrição</p><p className="text-sm text-foreground">{viewExpense.description}</p></div>
                <div><p className="text-xs text-muted-foreground">Fornecedor</p><p className="text-sm text-foreground">{viewExpense.supplier || "-"}</p></div>
                {viewExpense.notes && <div><p className="text-xs text-muted-foreground">Observações</p><p className="text-sm text-foreground">{viewExpense.notes}</p></div>}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editExpense} onOpenChange={(open) => !open && setEditExpense(null)}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Despesa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Veículo</label>
                  <Select value={editFormData.vehicle_id} onValueChange={(v) => setEditFormData({...editFormData, vehicle_id: v})}>
                    <SelectTrigger className="input-field"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {vehicles.map((v) => (<SelectItem key={v.id} value={v.id}>{v.prefix} - {v.plate}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Data</label>
                  <DateField value={editFormDate} onChange={setEditFormDate} placeholder="Selecione" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
                <Select value={editFormData.expense_type} onValueChange={(v) => setEditFormData({...editFormData, expense_type: v})}>
                  <SelectTrigger className="input-field"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{tipoFormOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Descrição</label>
                <input type="text" className="input-field" value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Fornecedor</label>
                  <input type="text" className="input-field" value={editFormData.supplier} onChange={(e) => setEditFormData({...editFormData, supplier: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Valor (R$)</label>
                  <CurrencyInput value={editFormData.value} onChange={(v) => setEditFormData({...editFormData, value: v})} required />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setEditExpense(null)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir despesa</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a despesa "{deleteTarget?.description}"? Esta ação não pode ser desfeita.
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

export default Despesas;
