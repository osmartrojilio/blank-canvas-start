import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FuelRecord } from "@/hooks/useFuelRecords";
import { useMemo } from "react";

interface FuelChartProps {
  fuelRecords: FuelRecord[];
}

const FuelChart = ({ fuelRecords }: FuelChartProps) => {
  // Aggregate fuel data by month (last 6 months)
  const chartData = useMemo(() => {
    const now = new Date();
    const months: { month: string; consumo: number; custo: number }[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      
      const monthRecords = fuelRecords.filter(record => {
        const recordDate = new Date(record.fuel_date);
        return recordDate.getMonth() === date.getMonth() && 
               recordDate.getFullYear() === date.getFullYear();
      });
      
      const totalLiters = monthRecords.reduce((sum, r) => sum + Number(r.liters || 0), 0);
      const totalCost = monthRecords.reduce((sum, r) => sum + Number(r.total_value || 0), 0);
      
      months.push({
        month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        consumo: Math.round(totalLiters),
        custo: Math.round(totalCost),
      });
    }
    
    return months;
  }, [fuelRecords]);

  const hasData = chartData.some(d => d.consumo > 0 || d.custo > 0);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Consumo de Combustível</h3>
          <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
        </div>
      </div>

      <div className="h-64">
        {!hasData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Nenhum registro de abastecimento</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38 92% 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38 92% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(215 20% 55%)", fontSize: 12 }}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString()}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222 47% 14%)",
                  border: "1px solid hsl(217 33% 22%)",
                  borderRadius: "8px",
                  color: "hsl(210 40% 98%)",
                }}
                formatter={(value: number) => [`${value.toLocaleString("pt-BR")} L`, "Consumo"]}
              />
              <Area
                type="monotone"
                dataKey="consumo"
                stroke="hsl(38 92% 50%)"
                strokeWidth={2}
                fill="url(#colorConsumo)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default FuelChart;
