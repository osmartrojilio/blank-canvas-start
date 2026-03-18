import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AlertLevel = "critical" | "warning" | "info";
export type AlertCategory = "cnh" | "maintenance" | "document" | "insurance";

export interface ProactiveAlert {
  id: string;
  level: AlertLevel;
  category: AlertCategory;
  title: string;
  message: string;
  entityName: string;
  dueDate: string | null;
  daysRemaining: number | null;
}

function getDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getLevel(days: number | null): AlertLevel {
  if (days === null) return "info";
  if (days <= 0) return "critical";
  if (days <= 15) return "critical";
  if (days <= 30) return "warning";
  return "info";
}

export function useProactiveAlerts() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<ProactiveAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    const fetchAlerts = async () => {
      setLoading(true);
      const allAlerts: ProactiveAlert[] = [];

      try {
        // 1. CNH Expiry alerts from drivers
        const { data: drivers } = await supabase
          .from("drivers")
          .select("id, cnh_expiry, cnh_number, profile:profiles(full_name)")
          .eq("organization_id", profile.organization_id)
          .not("cnh_expiry", "is", null);

        (drivers || []).forEach((driver: any) => {
          const days = getDaysUntil(driver.cnh_expiry);
          if (days !== null && days <= 30) {
            const name = driver.profile?.full_name || "Motorista";
            allAlerts.push({
              id: `cnh-${driver.id}`,
              level: getLevel(days),
              category: "cnh",
              title: days <= 0 ? "CNH Vencida" : "CNH Próxima do Vencimento",
              message: days <= 0
                ? `A CNH de ${name} venceu há ${Math.abs(days)} dia(s).`
                : `A CNH de ${name} vence em ${days} dia(s).`,
              entityName: name,
              dueDate: driver.cnh_expiry,
              daysRemaining: days,
            });
          }
        });

        // 2. Maintenance alerts (next_maintenance_date)
        const { data: maintenances } = await supabase
          .from("maintenance_records")
          .select("id, next_maintenance_date, next_maintenance_km, vehicle:vehicles(prefix, plate, current_km)")
          .eq("organization_id", profile.organization_id)
          .not("next_maintenance_date", "is", null)
          .in("status", ["completed", "scheduled"]);

        (maintenances || []).forEach((m: any) => {
          const days = getDaysUntil(m.next_maintenance_date);
          if (days !== null && days <= 30) {
            const vehicleName = `${m.vehicle?.prefix || ""} ${m.vehicle?.plate || ""}`.trim();
            allAlerts.push({
              id: `maint-date-${m.id}`,
              level: getLevel(days),
              category: "maintenance",
              title: days <= 0 ? "Manutenção Atrasada" : "Manutenção Programada",
              message: days <= 0
                ? `Manutenção do veículo ${vehicleName} está atrasada há ${Math.abs(days)} dia(s).`
                : `Manutenção do veículo ${vehicleName} programada para ${days} dia(s).`,
              entityName: vehicleName,
              dueDate: m.next_maintenance_date,
              daysRemaining: days,
            });
          }

          // KM-based alert
          if (m.next_maintenance_km && m.vehicle?.current_km) {
            const kmRemaining = m.next_maintenance_km - m.vehicle.current_km;
            if (kmRemaining <= 1000 && kmRemaining > -5000) {
              const vehicleName = `${m.vehicle?.prefix || ""} ${m.vehicle?.plate || ""}`.trim();
              allAlerts.push({
                id: `maint-km-${m.id}`,
                level: kmRemaining <= 0 ? "critical" : "warning",
                category: "maintenance",
                title: kmRemaining <= 0 ? "KM de Manutenção Ultrapassado" : "Manutenção por KM Próxima",
                message: kmRemaining <= 0
                  ? `Veículo ${vehicleName} ultrapassou ${Math.abs(kmRemaining)} km do limite de manutenção.`
                  : `Veículo ${vehicleName} está a ${kmRemaining} km da próxima manutenção.`,
                entityName: vehicleName,
                dueDate: null,
                daysRemaining: null,
              });
            }
          }
        });

        // 3. Vehicle document alerts (we check acquisition_date as a proxy for licensing)
        // For now we alert on vehicles in maintenance status
        const { data: vehicles } = await supabase
          .from("vehicles")
          .select("id, prefix, plate, status")
          .eq("organization_id", profile.organization_id)
          .eq("status", "maintenance");

        (vehicles || []).forEach((v: any) => {
          allAlerts.push({
            id: `doc-${v.id}`,
            level: "warning",
            category: "document",
            title: "Veículo em Manutenção",
            message: `O veículo ${v.prefix} (${v.plate}) está em manutenção e indisponível.`,
            entityName: `${v.prefix} ${v.plate}`,
            dueDate: null,
            daysRemaining: null,
          });
        });

        // Sort: critical first, then warning, then info
        const levelOrder: Record<AlertLevel, number> = { critical: 0, warning: 1, info: 2 };
        allAlerts.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

        setAlerts(allAlerts);
      } catch (err) {
        if (import.meta.env.DEV) console.error("Error fetching proactive alerts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [profile?.organization_id]);

  const criticalCount = alerts.filter((a) => a.level === "critical").length;
  const warningCount = alerts.filter((a) => a.level === "warning").length;

  return { alerts, loading, criticalCount, warningCount };
}
