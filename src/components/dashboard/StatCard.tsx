import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning";
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) => {
  const iconBgClasses = {
    default: "bg-secondary",
    primary: "bg-primary/20",
    success: "bg-success/20",
    warning: "bg-warning/20",
  };

  const iconColorClasses = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl ${iconBgClasses[variant]} flex items-center justify-center`}
        >
          <Icon className={`w-6 h-6 ${iconColorClasses[variant]}`} />
        </div>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? "text-success" : "text-destructive"
            }`}
          >
            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
          </span>
        )}
      </div>

      <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;
