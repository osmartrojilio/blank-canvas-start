import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, Save, AlertCircle, Calculator, Percent } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FinanceiroConfig {
  valor_padrao_tonelada: number;
  imposto_percentual: number;
  metodo_calculo_lucro: string;
}

const defaultConfig: FinanceiroConfig = {
  valor_padrao_tonelada: 120,
  imposto_percentual: 0,
  metodo_calculo_lucro: "receita_menos_custos",
};

const metodosCalculo = [
  { value: "receita_menos_custos", label: "Receita - Custos Diretos" },
  { value: "receita_menos_todos", label: "Receita - Todos os Custos" },
  { value: "margem_contribuicao", label: "Margem de Contribuição" },
];

export function FinanceiroSettings() {
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<FinanceiroConfig>(defaultConfig);

  useEffect(() => {
    loadSettings();
  }, [profile?.organization_id]);

  const loadSettings = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("organization_settings")
        .select("key, value")
        .eq("organization_id", profile.organization_id)
        .in("key", Object.keys(defaultConfig));

      if (error) throw error;

      const loadedConfig = { ...defaultConfig };
      data?.forEach((setting) => {
        if (setting.key in loadedConfig) {
          (loadedConfig as any)[setting.key] = setting.value;
        }
      });

      setConfig(loadedConfig);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading settings:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.organization_id || !isAdmin) return;

    setSaving(true);
    try {
      const updates = Object.entries(config).map(([key, value]) => ({
        organization_id: profile.organization_id!,
        key,
        value: value as any,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("organization_settings")
          .upsert(update, { onConflict: "organization_id,key" });

        if (error) throw error;
      }

      toast({
        title: "Configurações salvas",
        description: "As configurações financeiras foram atualizadas.",
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error saving settings:", error);
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
      {!isAdmin && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para editar as configurações financeiras.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Valores Padrão
          </CardTitle>
          <CardDescription>
            Configure os valores padrão para cálculos financeiros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="valor_tonelada">Valor Padrão por Tonelada</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">R$</span>
              <Input
                id="valor_tonelada"
                type="number"
                step="0.01"
                value={config.valor_padrao_tonelada}
                onChange={(e) => setConfig({ ...config, valor_padrao_tonelada: parseFloat(e.target.value) || 0 })}
                className="w-32"
                disabled={!isAdmin}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Usado como sugestão ao registrar viagens com carga
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Impostos
          </CardTitle>
          <CardDescription>
            Configure alíquotas para cálculos de lucro líquido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="imposto">Percentual de Impostos</Label>
            <div className="flex items-center gap-2">
              <Input
                id="imposto"
                type="number"
                step="0.1"
                value={config.imposto_percentual}
                onChange={(e) => setConfig({ ...config, imposto_percentual: parseFloat(e.target.value) || 0 })}
                className="w-32"
                disabled={!isAdmin}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Alíquota aproximada de impostos sobre faturamento
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Método de Cálculo
          </CardTitle>
          <CardDescription>
            Como o lucro é calculado nos relatórios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="metodo">Fórmula de Cálculo do Lucro</Label>
            <Select
              value={config.metodo_calculo_lucro}
              onValueChange={(value) => setConfig({ ...config, metodo_calculo_lucro: value })}
              disabled={!isAdmin}
            >
              <SelectTrigger className="w-full md:w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metodosCalculo.map((metodo) => (
                  <SelectItem key={metodo.value} value={metodo.value}>
                    {metodo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground space-y-1 mt-2">
              <p><strong>Receita - Custos Diretos:</strong> Combustível + manutenção direta</p>
              <p><strong>Receita - Todos os Custos:</strong> Inclui despesas administrativas</p>
              <p><strong>Margem de Contribuição:</strong> Receita - custos variáveis</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Alterações nestas configurações afetarão todos os relatórios financeiros do sistema.
        </AlertDescription>
      </Alert>

      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      )}
    </div>
  );
}
