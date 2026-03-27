import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import SubscriptionValidityCard from "@/components/plan/SubscriptionValidityCard";
import ExpirationAlert from "@/components/plan/ExpirationAlert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreditCard, Truck, Users, Paperclip, ArrowUpCircle, Check, Calendar, XCircle, AlertTriangle, Info } from "lucide-react";

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
  last_payment_at: string | null;
}

export function PlanosSettings() {
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [usage, setUsage] = useState<UsageInfo>({ trucks: 0, users: 0, storage_mb: 0 });
  const [subscription, setSubscription] = useState<SubscriptionInfo>({ status: "", ends_at: null, trial_ends_at: null, last_payment_at: null });
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
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select(`
          subscription_status,
          subscription_ends_at,
          trial_ends_at,
          last_payment_at,
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
          last_payment_at: org.last_payment_at,
        });
      }

      const { data: plans, error: plansError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true });

      if (plansError) throw plansError;
      setAllPlans(plans || []);

      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id);

      setUsage({
        trucks: 0,
        users: usersCount || 0,
        storage_mb: 45,
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

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription");

      if (error) throw error;

      const result = data as { success?: boolean; message?: string; error?: string; scenario?: string };

      if (result.error) {
        toast({
          title: "Erro ao cancelar",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Plano cancelado",
        description: result.message || "Sua assinatura foi cancelada.",
      });

      // Reload data
      await loadPlanInfo();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao cancelar o plano.";
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setCanceling(false);
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
      trial_canceled: { label: "Trial Cancelado", variant: "destructive" },
      canceled_pending_refund: { label: "Cancelado - Reembolso em Análise", variant: "destructive" },
      canceled_active_until_end: { label: "Cancelado - Ativo até o fim do período", variant: "outline" },
      expired: { label: "Expirado", variant: "destructive" },
      unpaid: { label: "Não Pago", variant: "destructive" },
    };
    return statusMap[status] || { label: status, variant: "outline" as const };
  };

  const canCancel = (() => {
    if (subscription.status === "trialing") return true;
    if (subscription.status === "active" && subscription.last_payment_at) {
      const paymentDate = new Date(subscription.last_payment_at);
      const now = new Date();
      const daysSincePayment = Math.floor((now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysSincePayment <= 7;
    }
    return false;
  })();

  const getCancelWarningMessage = () => {
    if (subscription.status === "trialing") {
      return "Ao cancelar durante o período de teste, seu acesso será bloqueado imediatamente. Deseja continuar?";
    }
    return "Ao cancelar sua assinatura, dependendo do período, você pode ser elegível para reembolso ou manter acesso até o fim do ciclo pago. Deseja continuar?";
  };

  const getStatusBanner = () => {
    switch (subscription.status) {
      case "trial_canceled":
        return {
          icon: <XCircle className="h-5 w-5" />,
          title: "Período de teste encerrado",
          message: "Seu período de teste foi encerrado e sua assinatura foi cancelada. Faça upgrade para continuar usando o sistema.",
          variant: "destructive" as const,
        };
      case "canceled_pending_refund":
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          title: "Cancelamento em análise",
          message: "Sua assinatura foi cancelada e está em análise para reembolso. Entraremos em contato em breve.",
          variant: "destructive" as const,
        };
      case "canceled_active_until_end":
        return {
          icon: <AlertTriangle className="h-5 w-5" />,
          title: "Assinatura será encerrada",
          message: `Sua assinatura será encerrada ao final do período atual (${formatDate(subscription.ends_at)}). Você mantém acesso até lá.`,
          variant: "outline" as const,
        };
      case "expired":
        return {
          icon: <XCircle className="h-5 w-5" />,
          title: "Assinatura expirada",
          message: "Sua assinatura expirou. Faça upgrade para continuar usando o sistema.",
          variant: "destructive" as const,
        };
      case "canceled":
        return {
          icon: <XCircle className="h-5 w-5" />,
          title: "Assinatura cancelada",
          message: "Sua assinatura foi cancelada. Faça upgrade para continuar usando o sistema.",
          variant: "destructive" as const,
        };
      default:
        return null;
    }
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
  const statusBanner = getStatusBanner();

  return (
    <div className="space-y-6">
      {/* Expiration alert */}
      <ExpirationAlert />

      {/* Subscription validity card */}
      <SubscriptionValidityCard />

      {/* Status banner for canceled/expired states */}
      {statusBanner && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <div className="text-destructive mt-0.5">{statusBanner.icon}</div>
            <div>
              <h4 className="font-semibold text-destructive">{statusBanner.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{statusBanner.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

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

          {/* Cancel subscription button */}
          {canCancel && isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Plano
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {getCancelWarningMessage()}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Manter plano</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    disabled={canceling}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {canceling ? "Cancelando..." : "Sim, cancelar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
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
            {(subscription.status === "active" || subscription.status === "canceled_active_until_end") && subscription.ends_at && (
              <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Ao renovar, o tempo restante da sua assinatura atual será preservado. A nova vigência será adicionada a partir do vencimento atual ({formatDate(subscription.ends_at)}).
                </p>
              </div>
            )}
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
