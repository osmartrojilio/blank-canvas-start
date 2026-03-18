import { TrendingUp, TrendingDown, Truck, Download, Loader2, FileText, FileSpreadsheet, Save } from "lucide-react";
import { BackToHome } from "@/components/shared/BackToHome";
import { formatCurrency } from "@/lib/formatters";
import Layout from "@/components/layout/Layout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useVehicles } from "@/hooks/useVehicles";
import { useTrips } from "@/hooks/useTrips";
import { useFuelRecords } from "@/hooks/useFuelRecords";
import { useExpenses } from "@/hooks/useExpenses";
import { useReportExport } from "@/hooks/useReportExport";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import UpgradeBanner from "@/components/plan/UpgradeBanner";
import { useMemo, useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const EXPENSE_TYPE_LABELS: Record<string, string> = {
  fuel: "Combustível",
  maintenance: "Manutenção",
  tire: "Pneus",
  toll: "Pedágios",
  parts: "Peças",
  insurance: "Seguros",
  tax: "Impostos",
  fine: "Multas",
  other: "Outros",
};

const EXPENSE_COLORS: Record<string, string> = {
  fuel: "hsl(38 92% 50%)",
  maintenance: "hsl(0 72% 51%)",
  tire: "hsl(217 33% 45%)",
  toll: "hsl(142 76% 36%)",
  parts: "hsl(280 65% 60%)",
  insurance: "hsl(200 80% 50%)",
  tax: "hsl(45 90% 50%)",
  fine: "hsl(340 75% 55%)",
  other: "hsl(180 50% 45%)",
};

const Relatorios = () => {
  const { vehicles, loading: vehiclesLoading } = useVehicles();
  const { trips, loading: tripsLoading } = useTrips();
  const { fuelRecords, loading: fuelLoading } = useFuelRecords();
  const { expenses, loading: expensesLoading } = useExpenses();
  const { exportToPDF, exportToExcel } = useReportExport();
  const { canExport, canAccessAdvancedReports, isFreePlan } = usePlanLimits();

  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const isLoading = vehiclesLoading || tripsLoading || fuelLoading || expensesLoading;

  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      options.push({
        offset: i,
        label: format(date, "MMMM yyyy", { locale: ptBR }),
        start: startOfMonth(date),
        end: endOfMonth(date),
      });
    }
    return options;
  }, []);

  const selectedMonth = monthOptions[selectedMonthOffset];

  // Filter data by selected month
  const filteredTrips = useMemo(() => {
    if (!selectedMonth) return [];
    return trips.filter((trip) => {
      const tripDate = new Date(trip.start_date);
      return tripDate >= selectedMonth.start && tripDate <= selectedMonth.end;
    });
  }, [trips, selectedMonth]);

  const filteredFuelRecords = useMemo(() => {
    if (!selectedMonth) return [];
    return fuelRecords.filter((record) => {
      const recordDate = new Date(record.fuel_date);
      return recordDate >= selectedMonth.start && recordDate <= selectedMonth.end;
    });
  }, [fuelRecords, selectedMonth]);

  const filteredExpenses = useMemo(() => {
    if (!selectedMonth) return [];
    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.expense_date);
      return expenseDate >= selectedMonth.start && expenseDate <= selectedMonth.end;
    });
  }, [expenses, selectedMonth]);

  // Calculate costs per vehicle
  const custosPorVeiculo = useMemo(() => {
    const vehicleCosts: Record<string, { veiculo: string; custo: number }> = {};

    vehicles.forEach((v) => {
      vehicleCosts[v.id] = { veiculo: v.prefix || v.plate, custo: 0 };
    });

    // Add fuel costs
    filteredFuelRecords.forEach((record) => {
      if (vehicleCosts[record.vehicle_id]) {
        vehicleCosts[record.vehicle_id].custo += Number(record.total_value || 0);
      }
    });

    // Add expense costs
    filteredExpenses.forEach((expense) => {
      if (expense.vehicle_id && vehicleCosts[expense.vehicle_id]) {
        vehicleCosts[expense.vehicle_id].custo += Number(expense.value || 0);
      }
    });

    return Object.values(vehicleCosts)
      .filter((v) => v.custo > 0)
      .sort((a, b) => b.custo - a.custo)
      .slice(0, 10);
  }, [vehicles, filteredFuelRecords, filteredExpenses]);

  // Calculate expenses by type
  const despesasPorTipo = useMemo(() => {
    const byType: Record<string, number> = {};

    // Add fuel as a category
    const totalFuel = filteredFuelRecords.reduce((sum, r) => sum + Number(r.total_value || 0), 0);
    if (totalFuel > 0) {
      byType.fuel = totalFuel;
    }

    // Add expenses by type
    filteredExpenses.forEach((expense) => {
      const type = expense.expense_type || "other";
      byType[type] = (byType[type] || 0) + Number(expense.value || 0);
    });

    return Object.entries(byType)
      .map(([type, value]) => ({
        name: EXPENSE_TYPE_LABELS[type] || type,
        value,
        color: EXPENSE_COLORS[type] || EXPENSE_COLORS.other,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredFuelRecords, filteredExpenses]);

  // Calculate key metrics
  const metricas = useMemo(() => {
    // Total KM this month
    const totalKm = filteredTrips.reduce((sum, t) => {
      const km = (t.end_km || 0) - (t.start_km || 0);
      return sum + (km > 0 ? km : 0);
    }, 0);

    // Total fuel cost
    const totalFuelCost = filteredFuelRecords.reduce((sum, r) => sum + Number(r.total_value || 0), 0);
    const totalLiters = filteredFuelRecords.reduce((sum, r) => sum + Number(r.liters || 0), 0);

    // Total expenses (fuel + other)
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.value || 0), 0);
    const totalCosts = totalFuelCost + totalExpenses;

    // Total revenue (freight value from trips)
    const totalRevenue = filteredTrips.reduce((sum, t) => sum + Number(t.freight_value || 0), 0);

    // Net profit
    const netProfit = totalRevenue - totalCosts;

    // Cost per KM
    const costPerKm = totalKm > 0 ? totalCosts / totalKm : 0;

    // Average consumption (km/L)
    const avgConsumption = totalLiters > 0 ? totalKm / totalLiters : 0;

    // Cost per trip
    const costPerTrip = filteredTrips.length > 0 ? totalCosts / filteredTrips.length : 0;

    return [
      {
        titulo: "Custo por KM",
        valor: formatCurrency(costPerKm),
        variacao: 0,
        icon: TrendingDown,
        positivo: true,
      },
      {
        titulo: "Consumo Médio",
        valor: `${avgConsumption.toFixed(2).replace(".", ",")} km/L`,
        variacao: 0,
        icon: TrendingUp,
        positivo: true,
      },
      {
        titulo: "Custo por Viagem",
        valor: formatCurrency(costPerTrip),
        variacao: 0,
        icon: TrendingUp,
        positivo: false,
      },
      {
        titulo: "Lucro Líquido",
        valor: formatCurrency(netProfit),
        variacao: 0,
        icon: netProfit >= 0 ? TrendingUp : TrendingDown,
        positivo: netProfit >= 0,
      },
    ];
  }, [filteredTrips, filteredFuelRecords, filteredExpenses]);

  // Calculate profit per vehicle
  const lucroPorVeiculo = useMemo(() => {
    const vehicleData: Record<string, { 
      veiculo: string; 
      faturamento: number; 
      despesas: number; 
      lucro: number;
    }> = {};

    vehicles.forEach((v) => {
      vehicleData[v.id] = { 
        veiculo: v.prefix || v.plate, 
        faturamento: 0, 
        despesas: 0, 
        lucro: 0 
      };
    });

    // Add revenue from trips (freight value)
    filteredTrips.forEach((trip) => {
      if (vehicleData[trip.vehicle_id]) {
        vehicleData[trip.vehicle_id].faturamento += Number(trip.freight_value || 0);
      }
    });

    // Add fuel costs
    filteredFuelRecords.forEach((record) => {
      if (vehicleData[record.vehicle_id]) {
        vehicleData[record.vehicle_id].despesas += Number(record.total_value || 0);
      }
    });

    // Add expense costs
    filteredExpenses.forEach((expense) => {
      if (expense.vehicle_id && vehicleData[expense.vehicle_id]) {
        vehicleData[expense.vehicle_id].despesas += Number(expense.value || 0);
      }
    });

    // Calculate profit
    Object.values(vehicleData).forEach((v) => {
      v.lucro = v.faturamento - v.despesas;
    });

    return Object.values(vehicleData)
      .filter((v) => v.faturamento > 0 || v.despesas > 0)
      .sort((a, b) => b.lucro - a.lucro);
  }, [vehicles, filteredTrips, filteredFuelRecords, filteredExpenses]);

  // Export handlers
  const handleExport = async (format: "pdf" | "excel") => {
    setIsExporting(true);
    try {
      const reportData = {
        monthLabel: selectedMonth?.label || "",
        metricas: metricas.map(m => ({ titulo: m.titulo, valor: m.valor })),
        custosPorVeiculo,
        despesasPorTipo,
        lucroPorVeiculo,
      };

      if (format === "pdf") {
        exportToPDF(reportData);
        toast.success("Relatório PDF exportado com sucesso!");
      } else {
        await exportToExcel(reportData);
        toast.success("Relatório Excel exportado com sucesso!");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erro ao exportar relatório. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
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
            <h1 className="page-title">Relatórios</h1>
            <p className="page-subtitle">Análises e métricas da frota</p>
          </div>

          <div className="flex gap-3">
            <select 
              className="input-field w-auto capitalize"
              value={selectedMonthOffset}
              onChange={(e) => setSelectedMonthOffset(Number(e.target.value))}
            >
              {monthOptions.map((option) => (
                <option key={option.offset} value={option.offset} className="capitalize">
                  {option.label}
                </option>
              ))}
            </select>
            {canExport ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="btn-secondary" disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  Exportar
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleExport("pdf")} className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2 text-destructive" />
                  Exportar como PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("excel")} className="cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-success" />
                  Exportar como Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            ) : null}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metricas.map((metrica, index) => {
            const Icon = metrica.icon;
            return (
              <div key={index} className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{metrica.titulo}</span>
                  <Icon className={`w-4 h-4 ${metrica.positivo ? "text-success" : "text-destructive"}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{metrica.valor}</p>
              </div>
            );
          })}
        </div>

        {!canAccessAdvancedReports && (
          <UpgradeBanner message="Gráficos avançados, análise por veículo e exportação estão disponíveis nos planos pagos." />
        )}

        {canAccessAdvancedReports && (
        <>
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Custos por Veículo */}
          <div className="stat-card">
            <h3 className="text-lg font-semibold text-foreground mb-6">Custos por Veículo</h3>
            <div className="h-64">
              {custosPorVeiculo.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={custosPorVeiculo} layout="vertical">
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <YAxis
                      type="category"
                      dataKey="veiculo"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Custo"]}
                    />
                    <Bar dataKey="custo" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum custo registrado no período
                </div>
              )}
            </div>
          </div>

          {/* Despesas por Tipo */}
          <div className="stat-card">
            <h3 className="text-lg font-semibold text-foreground mb-6">Despesas por Categoria</h3>
            <div className="h-64 flex items-center">
              {despesasPorTipo.length > 0 ? (
                <>
                  <div className="w-1/2">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={despesasPorTipo}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {despesasPorTipo.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            color: "hsl(var(--foreground))",
                          }}
                          formatter={(value: number) => [formatCurrency(value), ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-1/2 space-y-3">
                    {despesasPorTipo.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-sm text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          R$ {(item.value / 1000).toFixed(1)}k
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center w-full text-muted-foreground">
                  Nenhuma despesa registrada no período
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lucro por Veículo Table */}
        <div className="stat-card overflow-hidden p-0">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Lucro por Veículo</h3>
          </div>
          {lucroPorVeiculo.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr className="bg-secondary/30">
                  <th>Veículo</th>
                  <th className="text-right">Faturamento</th>
                  <th className="text-right">Despesas</th>
                  <th className="text-right">Lucro Líquido</th>
                  <th className="text-right">Margem</th>
                </tr>
              </thead>
              <tbody>
                {lucroPorVeiculo.map((item) => {
                  const margem = item.faturamento > 0 
                    ? ((item.lucro / item.faturamento) * 100).toFixed(1) 
                    : "0.0";
                  return (
                    <tr key={item.veiculo}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Truck className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium text-foreground">{item.veiculo}</span>
                        </div>
                      </td>
                      <td className="text-right text-foreground">
                        R$ {item.faturamento.toLocaleString("pt-BR")}
                      </td>
                      <td className="text-right text-destructive">
                        R$ {item.despesas.toLocaleString("pt-BR")}
                      </td>
                      <td className={`text-right font-semibold ${item.lucro >= 0 ? "text-success" : "text-destructive"}`}>
                        R$ {item.lucro.toLocaleString("pt-BR")}
                      </td>
                      <td className="text-right">
                        <span className={`badge-status ${Number(margem) >= 0 ? "badge-success" : "badge-error"}`}>
                          {margem}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum dado de veículo disponível para o período selecionado
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </Layout>
  );
};

export default Relatorios;
