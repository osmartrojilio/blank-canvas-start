import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, Truck, Users, Paperclip, ArrowUpCircle, Check, Calendar } from "lucide-react";

interface PlanInfo {
  name: string;
  price_monthly: number;
  max_trucks: number | null;
  max_users: number | null;
  features: unknown;
}

interface UsageInfo {
  trucks: number;
  users: number;
  storage_mb: number;
}

interface SubscriptionInfo {
  status: string;
  ends_at: string | null;
  trial_ends_at: string | null;
}

export function PlanosSettings() {
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo>({ trucks: 0, users: 0, storage_mb: 0 });
  const [subscription, setSubscription] = useState<SubscriptionInfo>({ status: "", ends_at: null, trial_ends_at: null });
  const [allPlans, setAllPlans] = useState<PlanInfo[]>([]);

  useEffect(() => {
    loadPlanInfo();
  }, [profile?.organization_id]);

  const loadPlanInfo = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      // Load organization with plan
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select(`
          subscription_status,
          subscription_ends_at,
          trial_ends_at,
          subscription_plans (
            name,
            price_monthly,
            max_trucks,
            max_users,
            features
          )
        `)
        .eq("id", profile.organization_id)
        .maybeSingle();

      if (orgError) throw orgError;

      if (org) {
        setPlan(org.subscription_plans as PlanInfo | null);
        setSubscription({
          status: org.subscription_status || "trialing",
          ends_at: org.subscription_ends_at,
          trial_ends_at: org.trial_ends_at,
        });
      }

      // Load all active plans for upgrade options
      const { data: plans, error: plansError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true });

      if (plansError) throw plansError;
      setAllPlans(plans || []);

      // Get current usage
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id);

      // TODO: Get trucks count when trucks table exists
      // TODO: Get storage usage from storage bucket

      setUsage({
        trucks: 0, // Will be updated when trucks table exists
        users: usersCount || 0,
        storage_mb: 45, // Mock value
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading plan info:", error);
      }
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar as informações do plano.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };


  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Ativo", variant: "default" },
      trialing: { label: "Período de Teste", variant: "secondary" },
      past_due: { label: "Pagamento Pendente", variant: "destructive" },
      canceled: { label: "Cancelado", variant: "destructive" },
      unpaid: { label: "Não Pago", variant: "destructive" },
    };
    return statusMap[status] || { label: status, variant: "outline" as const };
  };

  const getUsagePercent = (current: number, max: number | null) => {
    if (!max) return 0;
    return Math.min((current / max) * 100, 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const statusInfo = getStatusInfo(subscription.status);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Plano Atual
              </CardTitle>
              <CardDescription>
                Informações da sua assinatura
              </CardDescription>
            </div>
            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div>
              <h3 className="text-xl font-bold">{plan?.name || "Sem plano"}</h3>
              <p className="text-muted-foreground">
                {plan ? formatCurrency(plan.price_monthly) + "/mês" : "Gratuito"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {subscription.status === "trialing" ? "Fim do teste" : "Próximo vencimento"}
              </p>
              <p className="font-medium">
                {subscription.status === "trialing"
                  ? formatDate(subscription.trial_ends_at)
                  : formatDate(subscription.ends_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uso Atual</CardTitle>
          <CardDescription>
            Consumo dos recursos do seu plano
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span>Veículos</span>
              </div>
              <span className="text-sm">
                {usage.trucks} / {plan?.max_trucks ?? "Ilimitado"}
              </span>
            </div>
            {plan?.max_trucks && (
              <Progress value={getUsagePercent(usage.trucks, plan.max_trucks)} className="h-2" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Usuários</span>
              </div>
              <span className="text-sm">
                {usage.users} / {plan?.max_users ?? "Ilimitado"}
              </span>
            </div>
            {plan?.max_users && (
              <Progress value={getUsagePercent(usage.users, plan.max_users)} className="h-2" />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span>Armazenamento</span>
              </div>
              <span className="text-sm">{usage.storage_mb} MB / 500 MB</span>
            </div>
            <Progress value={(usage.storage_mb / 500) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {allPlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5" />
              Planos Disponíveis
            </CardTitle>
            <CardDescription>
              Compare e faça upgrade do seu plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allPlans.filter((p) => p.price_monthly >= (plan?.price_monthly ?? 0)).map((p) => {
                const isCurrent = p.name === plan?.name;
                return (
                  <div
                    key={p.name}
                    className={`p-4 rounded-lg border ${isCurrent ? "border-primary bg-primary/5" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{p.name}</h4>
                      {isCurrent && (
                        <Badge variant="outline" className="text-xs">
                          Atual
                        </Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold mb-4">
                      {formatCurrency(p.price_monthly)}
                      <span className="text-sm font-normal text-muted-foreground">/mês</span>
                    </p>
                    <ul className="space-y-2 text-sm mb-4">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {p.max_trucks ?? "∞"} veículos
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        {p.max_users ?? "∞"} usuários
                      </li>
                    </ul>
                    {!isCurrent && isAdmin && (
                      <Button className="w-full" variant="outline" size="sm">
                        Fazer Upgrade
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
