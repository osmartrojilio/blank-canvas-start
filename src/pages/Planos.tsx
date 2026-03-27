import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Crown, Sparkles, Building2, Loader2, CreditCard, XCircle, AlertTriangle, Ticket, X, TrendingDown, ArrowLeft } from "lucide-react";
import { BackToHome } from "@/components/shared/BackToHome";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import PaymentBrick from "@/components/payment/PaymentBrick";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly: number;
  max_trucks: number | null;
  max_users: number | null;
  features: string[];
}

interface PaymentInfo {
  payment_id: string;
  amount: number | null;
  created_at: string;
  days_since_payment: number;
  within_grace_period: boolean;
}

type DurationOption = 1 | 12 | 24 | 36;

const DURATION_OPTIONS: { value: DurationOption; label: string; badge?: string }[] = [
  { value: 1, label: "Mensal" },
  { value: 12, label: "Anual", badge: "Popular" },
  { value: 24, label: "2 Anos" },
  { value: 36, label: "3 Anos", badge: "Melhor Valor" },
];

const DISCOUNT_MAP: Record<DurationOption, number> = {
  1: 0,
  12: 15,
  24: 25,
  36: 35,
};

const DURATION_LABEL_MAP: Record<DurationOption, string> = {
  1: "Mensal",
  12: "Anual",
  24: "2 Anos",
  36: "3 Anos",
};

export default function Planos() {
  const { organization } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [paymentInfoLoading, setPaymentInfoLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponValidating, setCouponValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount_percent: number } | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<DurationOption>(12);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true });

      if (error) throw error;

      const formattedPlans = data.map((plan) => ({
        ...plan,
        features: Array.isArray(plan.features) 
          ? plan.features as string[]
          : [],
      }));

      setPlans(formattedPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast.error("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentInfo = async () => {
    if (!organization) return;
    setPaymentInfoLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_events")
        .select("payment_id, amount, created_at, status")
        .eq("organization_id", organization.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const paymentDate = new Date(data.created_at);
        const now = new Date();
        const diffMs = now.getTime() - paymentDate.getTime();
        const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        setPaymentInfo({
          payment_id: data.payment_id,
          amount: data.amount,
          created_at: data.created_at,
          days_since_payment: daysSince,
          within_grace_period: daysSince <= 7,
        });
      } else {
        setPaymentInfo(null);
      }
    } catch (err) {
      console.error("Error fetching payment info:", err);
      setPaymentInfo(null);
    } finally {
      setPaymentInfoLoading(false);
    }
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case "basic":
        return <Sparkles className="w-6 h-6" />;
      case "pro":
        return <Crown className="w-6 h-6" />;
      case "enterprise":
        return <Building2 className="w-6 h-6" />;
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  // Duration-aware price calculations
  const getDiscountPercent = () => DISCOUNT_MAP[selectedDuration];

  const getMonthlyPrice = (baseMonthly: number) => {
    const discount = getDiscountPercent();
    return Math.round((baseMonthly * (1 - discount / 100)) * 100) / 100;
  };

  const getTotalPrice = (baseMonthly: number) => {
    return Math.round((getMonthlyPrice(baseMonthly) * selectedDuration) * 100) / 100;
  };

  const getSavings = (baseMonthly: number) => {
    const fullPrice = baseMonthly * selectedDuration;
    const discountedTotal = getTotalPrice(baseMonthly);
    return Math.round((fullPrice - discountedTotal) * 100) / 100;
  };

  const handleSubscribe = (plan: Plan) => {
    if (!organization) {
      toast.error("Você precisa estar logado em uma organização");
      return;
    }
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    toast.success("Pagamento aprovado! Seu plano foi ativado.");
  };

  const handlePaymentError = (msg: string) => {
    toast.error(msg);
  };

  const handlePaymentDialogClose = () => {
    setPaymentDialogOpen(false);
    setSelectedPlan(null);
    setAppliedCoupon(null);
    setCouponCode("");
    window.location.reload();
  };

  const validateCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponValidating(true);
    try {
      const { data, error } = await supabase
        .from("discount_coupons")
        .select("id, code, discount_percent, max_uses, current_uses, valid_until, is_active")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Cupom não encontrado ou inativo.");
        return;
      }

      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        toast.error("Este cupom expirou.");
        return;
      }

      if (data.max_uses != null && (data as any).current_uses >= data.max_uses) {
        toast.error("Este cupom atingiu o limite de uso.");
        return;
      }

      setAppliedCoupon({ id: data.id, code: data.code, discount_percent: data.discount_percent });
      toast.success(`Cupom ${data.code} aplicado! ${data.discount_percent}% de desconto.`);
    } catch {
      toast.error("Erro ao validar cupom.");
    } finally {
      setCouponValidating(false);
    }
  };

  const getDiscountedPrice = (price: number) => {
    if (!appliedCoupon) return price;
    return Math.round((price * (1 - appliedCoupon.discount_percent / 100)) * 100) / 100;
  };

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription");

      if (error) {
        console.error("Cancel error:", error);
        toast.error("Erro ao cancelar plano. Tente novamente.");
        return;
      }

      if (data?.success) {
        toast.success(data.message);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(data?.error || "Erro ao cancelar plano");
      }
    } catch (err) {
      console.error("Cancel error:", err);
      toast.error("Erro de conexão. Verifique sua internet.");
    } finally {
      setCancelLoading(false);
    }
  };

  const isCurrentPlan = (planId: string) => {
    return organization?.plan_id === planId;
  };

  const currentPlanName = () => {
    const current = plans.find((p) => p.id === organization?.plan_id);
    return current?.name || "Plano";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  // Payment dialog calculated values
  const getPaymentPlanName = () => {
    if (!selectedPlan) return "";
    return `${selectedPlan.name} - ${DURATION_LABEL_MAP[selectedDuration]}`;
  };

  const getPaymentTotalPrice = () => {
    if (!selectedPlan) return 0;
    const total = getTotalPrice(selectedPlan.price_monthly);
    return getDiscountedPrice(total);
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

  // Bloquear acesso aos sábados
  const isSaturday = new Date().getDay() === 6;
  if (isSaturday) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertTriangle className="w-12 h-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Tente novamente mais tarde</h2>
           <p className="text-muted-foreground text-center max-w-md">
             Este recurso não está disponível no momento. Por favor, tente novamente em outro dia.
           </p>
           <p className="text-muted-foreground text-center max-w-md text-sm mt-2">
             A contratação de planos está disponível de domingo a sexta-feira até às 23:59. Aos sábados, a contratação fica temporariamente indisponível.
           </p>
           <Button variant="outline" className="gap-2 mt-2" onClick={() => navigate("/")}>
             <ArrowLeft className="h-4 w-4" />
             Voltar ao Início
           </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <BackToHome />
      {/* Aviso de horário de contratação */}
      <div className="mb-6 p-4 rounded-lg border border-border bg-muted/50 text-center">
        <p className="text-sm text-muted-foreground">
          A contratação de planos está disponível de domingo a sexta-feira até às 23:59. Aos sábados, a contratação fica temporariamente indisponível.
        </p>
      </div>

      {/* Header - only show when no active plan */}
      {organization?.subscription_status !== "active" && (
        <div className="page-header text-center mb-8">
          <h1 className="page-title text-3xl font-bold">Escolha seu Plano</h1>
          <p className="page-subtitle text-muted-foreground mt-2 max-w-2xl mx-auto">
            Selecione o plano ideal para sua operação. Todos incluem 14 dias grátis.
          </p>
        </div>
      )}

      {/* Trial Banner */}
      {organization?.subscription_status === "trialing" && organization?.trial_ends_at && (
        (() => {
          const trialEnd = new Date(organization.trial_ends_at);
          const now = new Date();
          const daysLeft = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          const isExpired = daysLeft <= 0;

          return isExpired ? (
            <div className="mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                📦 Seu período de teste expirou. Você está no plano Free com funcionalidades limitadas. Faça upgrade para desbloquear tudo!
              </p>
            </div>
          ) : (
            <div className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
              <p className="text-sm text-primary font-medium">
                🎉 Você está no período de teste gratuito! Restam {daysLeft} dia{daysLeft !== 1 ? "s" : ""}.
              </p>
            </div>
          );
        })()
      )}

      {/* Free Plan Banner (canceled or no plan after trial) */}
      {(organization?.subscription_status === "canceled" || 
        (organization?.subscription_status !== "active" && organization?.subscription_status !== "trialing")) && (
        <div className="mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
            📦 Você está no plano Free. Faça upgrade para desbloquear veículos ilimitados, relatórios avançados e exportação.
          </p>
        </div>
      )}

      {/* Active Subscription Banner */}
      {organization?.subscription_status === "active" && organization?.subscription_ends_at && (() => {
        const canCancel = organization.last_payment_at
          ? Math.floor((new Date().getTime() - new Date(organization.last_payment_at).getTime()) / (1000 * 60 * 60 * 24)) <= 7
          : false;
        return (
        <div className="mb-8 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center space-y-3">
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            ✓ Assinatura ativa até {new Date(organization.subscription_ends_at!).toLocaleDateString("pt-BR")}
          </p>
          {canCancel && (
          <AlertDialog onOpenChange={(open) => { if (open) fetchPaymentInfo(); }}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <XCircle className="w-4 h-4 mr-2" />
                Cancelar Plano
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar assinatura — {currentPlanName()}</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-4">
                    {paymentInfoLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Carregando informações...</span>
                      </div>
                    ) : paymentInfo ? (
                      <>
                        <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Valor pago:</span>
                            <span className="font-medium text-foreground">
                              {paymentInfo.amount ? formatPrice(paymentInfo.amount) : "—"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Data do pagamento:</span>
                            <span className="font-medium text-foreground">
                              {new Date(paymentInfo.created_at).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dias desde o pagamento:</span>
                            <span className="font-medium text-foreground">
                              {paymentInfo.days_since_payment} dia{paymentInfo.days_since_payment !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>

                        {paymentInfo.within_grace_period ? (
                          <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm">
                            <p className="font-medium text-green-700 dark:text-green-400">
                              ✓ Dentro do período de carência (7 dias)
                            </p>
                            <p className="text-muted-foreground mt-1">
                              Você receberá o reembolso total de{" "}
                              <strong className="text-foreground">
                                {paymentInfo.amount ? formatPrice(paymentInfo.amount) : "—"}
                              </strong>. Sua conta voltará ao período de teste gratuito de 14 dias.
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium text-amber-700 dark:text-amber-400">
                                  Período de carência expirado
                                </p>
                                <p className="text-muted-foreground mt-1">
                                  O período de 7 dias para reembolso já passou. Não é possível cancelar por autoatendimento.
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2 border-amber-400 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950"
                                  onClick={() => navigate("/suporte")}
                                >
                                  Entrar em contato com o suporte
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum pagamento encontrado. O plano será cancelado e sua conta voltará ao período de teste gratuito de 14 dias.
                      </p>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Manter Plano</AlertDialogCancel>
                {(!paymentInfo || paymentInfo.within_grace_period) && (
                  <AlertDialogAction
                    onClick={handleCancelSubscription}
                    disabled={cancelLoading || paymentInfoLoading}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {cancelLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cancelando...
                      </>
                    ) : (
                      "Confirmar Cancelamento"
                    )}
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Duration Selector */}
      <div className="flex justify-center mb-8">
          <div className="inline-flex items-center rounded-xl border bg-card p-1.5 shadow-sm gap-1">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedDuration(option.value)}
                className={`relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedDuration === option.value
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {option.label}
                {option.badge && (
                  <span className={`absolute -top-2.5 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none whitespace-nowrap ${
                    selectedDuration === option.value
                      ? "bg-green-500 text-white"
                      : "bg-green-500/20 text-green-600 dark:text-green-400"
                  }`}>
                    {option.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

      {/* Discount info */}
      {selectedDuration > 1 && (
        <div className="text-center mb-6">
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-sm px-3 py-1">
            <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
            {DISCOUNT_MAP[selectedDuration]}% de desconto no plano {DURATION_LABEL_MAP[selectedDuration]}
          </Badge>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.filter((p) => {
          if (p.slug === "free") return false;
          const currentPlan = plans.find((cp) => cp.id === organization?.plan_id);
          return !currentPlan || p.price_monthly >= currentPlan.price_monthly;
        }).map((plan) => {
          const discount = getDiscountPercent();
          const monthlyDiscounted = getMonthlyPrice(plan.price_monthly);
          const total = getTotalPrice(plan.price_monthly);
          const savings = getSavings(plan.price_monthly);

          return (
            <Card
              key={plan.id}
              className={`relative transition-all duration-300 hover:shadow-lg ${
                plan.slug === "pro" ? "border-primary shadow-md ring-1 ring-primary/20" : ""
              } ${isCurrentPlan(plan.id) ? "ring-2 ring-green-500" : ""}`}
            >
              {plan.slug === "pro" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Mais Popular
                  </Badge>
                </div>
              )}

              {isCurrentPlan(plan.id) && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500">
                    Plano Atual
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pt-8">
                <div
                  className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-4 ${
                    plan.slug === "pro"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  }`}
                >
                  {getPlanIcon(plan.slug)}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="text-center">
                <div className="mb-6">
                  {/* Price display */}
                  {discount > 0 ? (
                    <>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-lg line-through text-muted-foreground">
                          {formatPrice(plan.price_monthly)}
                        </span>
                        <span className="text-4xl font-bold text-foreground">
                          {formatPrice(monthlyDiscounted)}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-sm">/mês</span>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Total: <strong className="text-foreground">{formatPrice(total)}</strong>
                          {selectedDuration === 12 ? " /ano" : ` por ${selectedDuration} meses`}
                        </p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          Economize {formatPrice(savings)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl font-bold">{formatPrice(plan.price_monthly)}</span>
                      <span className="text-muted-foreground">/mês</span>
                      <p className="text-sm text-muted-foreground mt-2">
                        Cobrado mensalmente
                      </p>
                    </>
                  )}
                </div>

                <div className="space-y-2 mb-6 text-sm text-muted-foreground">
                  <p>
                    {plan.max_trucks ? `Até ${plan.max_trucks} veículos` : "Veículos ilimitados"}
                  </p>
                  <p>
                    {plan.max_users ? `Até ${plan.max_users} usuários` : "Usuários ilimitados"}
                  </p>
                </div>

                <ul className="space-y-3 text-left">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrentPlan(plan.id) ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700" disabled>
                    <Check className="w-4 h-4 mr-2" />
                    Plano Ativo
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant="default"
                    onClick={() => handleSubscribe(plan)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Assinar
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Footer - only show when no active plan */}
      {organization?.subscription_status !== "active" && (
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Pagamento seguro via Mercado Pago. Você tem 7 dias para cancelar com reembolso total.
          </p>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assinar {getPaymentPlanName()}</DialogTitle>
            <DialogDescription>
              {selectedPlan && (
                <span className="space-y-1 block">
                  {(() => {
                    const total = getTotalPrice(selectedPlan.price_monthly);
                    const finalPrice = getDiscountedPrice(total);
                    const hasDiscount = selectedDuration > 1;
                    const hasCoupon = !!appliedCoupon;

                    return (
                      <>
                        {(hasDiscount || hasCoupon) && (
                          <>
                            <span className="line-through text-muted-foreground">
                              {formatPrice(selectedPlan.price_monthly * selectedDuration)}
                            </span>{" "}
                          </>
                        )}
                        <span className={hasDiscount || hasCoupon ? "font-bold text-green-600" : ""}>
                          {formatPrice(finalPrice)}
                        </span>
                        {selectedDuration === 1 ? " /mês" : selectedDuration === 12 ? " /ano" : ` por ${selectedDuration} meses`}
                        {hasCoupon && (
                          <span className="text-green-600 text-xs ml-1">(-{appliedCoupon.discount_percent}%)</span>
                        )}
                        {hasDiscount && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({formatPrice(getMonthlyPrice(selectedPlan.price_monthly))}/mês)
                          </span>
                        )}
                      </>
                    );
                  })()}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Coupon Input */}
          <div className="border rounded-lg p-3 space-y-2">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Ticket className="h-4 w-4" />
              Cupom de desconto
            </p>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-md px-3 py-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-400">
                  {appliedCoupon.code} — {appliedCoupon.discount_percent}% off
                </span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o código"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && validateCoupon()}
                  className="flex-1"
                  maxLength={30}
                />
                <Button variant="outline" size="sm" onClick={validateCoupon} disabled={couponValidating || !couponCode.trim()}>
                  {couponValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                </Button>
              </div>
            )}
          </div>

          {selectedPlan && organization && (
            <PaymentBrick
              planId={selectedPlan.id}
              planName={getPaymentPlanName()}
              planPrice={getPaymentTotalPrice()}
              organizationId={organization.id}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onClose={handlePaymentDialogClose}
              couponId={appliedCoupon?.id}
              durationMonths={selectedDuration}
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
