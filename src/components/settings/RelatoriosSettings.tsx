import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Save, AlertCircle, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RelatoriosConfig {
  periodo_padrao: string;
  exibir_valores_zerados: boolean;
  comparativo_mensal: boolean;
  agrupamento_padrao: string;
}

const defaultConfig: RelatoriosConfig = {
  periodo_padrao: "mes_atual",
  exibir_valores_zerados: false,
  comparativo_mensal: true,
  agrupamento_padrao: "veiculo",
};

const periodos = [
  { value: "semana_atual", label: "Semana Atual" },
  { value: "mes_atual", label: "Mês Atual" },
  { value: "trimestre_atual", label: "Trimestre Atual" },
  { value: "ano_atual", label: "Ano Atual" },
  { value: "ultimos_30", label: "Últimos 30 dias" },
  { value: "ultimos_90", label: "Últimos 90 dias" },
];

const agrupamentos = [
  { value: "veiculo", label: "Por Veículo" },
  { value: "motorista", label: "Por Motorista" },
  { value: "mes", label: "Por Mês" },
  { value: "tipo_despesa", label: "Por Tipo de Despesa" },
];

export function RelatoriosSettings() {
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<RelatoriosConfig>(defaultConfig);

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
        description: "As configurações de relatórios foram atualizadas.",
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
            Você não tem permissão para editar as configurações de relatórios.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Período Padrão
          </CardTitle>
          <CardDescription>
            Configure o período padrão ao abrir relatórios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="periodo">Período Inicial</Label>
            <Select
              value={config.periodo_padrao}
              onValueChange={(value) => setConfig({ ...config, periodo_padrao: value })}
              disabled={!isAdmin}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodos.map((periodo) => (
                  <SelectItem key={periodo.value} value={periodo.value}>
                    {periodo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Período selecionado por padrão ao abrir a tela de relatórios
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Exibição
          </CardTitle>
          <CardDescription>
            Configure como os dados são exibidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Exibir Valores Zerados</Label>
              <p className="text-sm text-muted-foreground">
                Mostrar itens sem movimentação no período
              </p>
            </div>
            <Switch
              checked={config.exibir_valores_zerados}
              onCheckedChange={(checked) => setConfig({ ...config, exibir_valores_zerados: checked })}
              disabled={!isAdmin}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Comparativo Mensal</Label>
              <p className="text-sm text-muted-foreground">
                Exibir comparação com mês anterior
              </p>
            </div>
            <Switch
              checked={config.comparativo_mensal}
              onCheckedChange={(checked) => setConfig({ ...config, comparativo_mensal: checked })}
              disabled={!isAdmin}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agrupamento">Agrupamento Padrão</Label>
            <Select
              value={config.agrupamento_padrao}
              onValueChange={(value) => setConfig({ ...config, agrupamento_padrao: value })}
              disabled={!isAdmin}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {agrupamentos.map((agr) => (
                  <SelectItem key={agr.value} value={agr.value}>
                    {agr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Como os dados são agrupados por padrão nos relatórios
            </p>
          </div>
        </CardContent>
      </Card>

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
