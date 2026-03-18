import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Calendar, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const timezones = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Cuiaba", label: "Cuiabá (GMT-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)" },
];

const currencies = [
  { value: "BRL", label: "Real (R$)" },
  { value: "USD", label: "Dólar (US$)" },
  { value: "EUR", label: "Euro (€)" },
];

const fiscalPeriods = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function EmpresaSettings() {
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    timezone: "America/Sao_Paulo",
    currency: "BRL",
    fiscal_period_start: 1,
    is_active: true,
    logo_url: "",
  });

  const [subscription, setSubscription] = useState({
    plan_name: "",
    status: "",
    ends_at: "",
  });

  useEffect(() => {
    loadOrganizationData();
  }, [profile?.organization_id]);

  const loadOrganizationData = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      const { data: org, error } = await supabase
        .from("organizations")
        .select(`
          *,
          subscription_plans (name)
        `)
        .eq("id", profile.organization_id)
        .maybeSingle();

      if (error) throw error;

      if (org) {
        setFormData({
          name: org.name || "",
          cnpj: (org as any).cnpj || "",
          timezone: (org as any).timezone || "America/Sao_Paulo",
          currency: (org as any).currency || "BRL",
          fiscal_period_start: (org as any).fiscal_period_start || 1,
          is_active: (org as any).is_active ?? true,
          logo_url: org.logo_url || "",
        });

        setSubscription({
          plan_name: org.subscription_plans?.name || "Sem plano",
          status: org.subscription_status || "trialing",
          ends_at: org.subscription_ends_at || org.trial_ends_at || "",
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading organization:", error);
      }
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados da empresa.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.organization_id || !isAdmin) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: formData.name,
          cnpj: formData.cnpj,
          timezone: formData.timezone,
          currency: formData.currency,
          fiscal_period_start: formData.fiscal_period_start,
          is_active: formData.is_active,
          logo_url: formData.logo_url || null,
        } as any)
        .eq("id", profile.organization_id);

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações da empresa foram atualizadas.",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error saving organization:", error);
      }
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      active: { label: "Ativo", variant: "default" },
      trialing: { label: "Período de Teste", variant: "secondary" },
      past_due: { label: "Pagamento Pendente", variant: "destructive" },
      canceled: { label: "Cancelado", variant: "destructive" },
      unpaid: { label: "Não Pago", variant: "destructive" },
    };
    const info = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={info.variant}>{info.label}</Badge>;
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Dados da Empresa
          </CardTitle>
          <CardDescription>
            Informações básicas da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isAdmin && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você não tem permissão para editar as configurações da empresa.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ (opcional)</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">URL do Logo</Label>
              <Input
                id="logo_url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://..."
                disabled={!isAdmin}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                disabled={!isAdmin}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Moeda</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
                disabled={!isAdmin}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fiscal_period">Início do Período Fiscal</Label>
              <Select
                value={String(formData.fiscal_period_start)}
                onValueChange={(value) => setFormData({ ...formData, fiscal_period_start: parseInt(value) })}
                disabled={!isAdmin}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fiscalPeriods.map((period) => (
                    <SelectItem key={period.value} value={String(period.value)}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                disabled={!isAdmin}
              />
              <Label htmlFor="is_active">Empresa Ativa</Label>
            </div>

            {isAdmin && (
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Plano e Assinatura
          </CardTitle>
          <CardDescription>
            Informações sobre seu plano atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Plano Atual</p>
              <p className="text-lg font-semibold">{subscription.plan_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge(subscription.status)}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {subscription.status === "trialing" ? "Fim do Teste" : "Vencimento"}
              </p>
              <p className="text-lg font-semibold">{formatDate(subscription.ends_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          As configurações de moeda e período fiscal afetam todos os relatórios do sistema.
        </AlertDescription>
      </Alert>
    </div>
  );
}
