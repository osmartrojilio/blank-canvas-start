import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Truck, Save, AlertCircle, Gauge, Wrench, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FrotaConfig {
  exigir_odometro: boolean;
  exigir_horimetro: boolean;
  tolerancia_km_inconsistente: number;
  alerta_manutencao_km: number;
  alerta_manutencao_dias: number;
}

const defaultConfig: FrotaConfig = {
  exigir_odometro: true,
  exigir_horimetro: false,
  tolerancia_km_inconsistente: 50,
  alerta_manutencao_km: 10000,
  alerta_manutencao_dias: 90,
};

export function FrotaSettings() {
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<FrotaConfig>(defaultConfig);

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
        description: "As configurações da frota foram atualizadas.",
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
            Você não tem permissão para editar as configurações da frota.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Controle de Odômetro
          </CardTitle>
          <CardDescription>
            Configure a validação de quilometragem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Exigir Odômetro no Abastecimento</Label>
              <p className="text-sm text-muted-foreground">
                Motoristas devem informar a quilometragem ao abastecer
              </p>
            </div>
            <Switch
              checked={config.exigir_odometro}
              onCheckedChange={(checked) => setConfig({ ...config, exigir_odometro: checked })}
              disabled={!isAdmin}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Exigir Horímetro</Label>
              <p className="text-sm text-muted-foreground">
                Para veículos com horímetro (máquinas, geradores)
              </p>
            </div>
            <Switch
              checked={config.exigir_horimetro}
              onCheckedChange={(checked) => setConfig({ ...config, exigir_horimetro: checked })}
              disabled={!isAdmin}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tolerancia">Tolerância de KM Inconsistente</Label>
            <div className="flex items-center gap-2">
              <Input
                id="tolerancia"
                type="number"
                value={config.tolerancia_km_inconsistente}
                onChange={(e) => setConfig({ ...config, tolerancia_km_inconsistente: parseInt(e.target.value) || 0 })}
                className="w-32"
                disabled={!isAdmin}
              />
              <span className="text-sm text-muted-foreground">km</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Diferença máxima aceita entre lançamentos consecutivos
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Alertas de Manutenção
          </CardTitle>
          <CardDescription>
            Configure quando receber alertas de manutenção preventiva
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="manutencao_km">Alerta por Quilometragem</Label>
            <div className="flex items-center gap-2">
              <Input
                id="manutencao_km"
                type="number"
                value={config.alerta_manutencao_km}
                onChange={(e) => setConfig({ ...config, alerta_manutencao_km: parseInt(e.target.value) || 0 })}
                className="w-32"
                disabled={!isAdmin}
              />
              <span className="text-sm text-muted-foreground">km desde última manutenção</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manutencao_dias">Alerta por Período</Label>
            <div className="flex items-center gap-2">
              <Input
                id="manutencao_dias"
                type="number"
                value={config.alerta_manutencao_dias}
                onChange={(e) => setConfig({ ...config, alerta_manutencao_dias: parseInt(e.target.value) || 0 })}
                className="w-32"
                disabled={!isAdmin}
              />
              <span className="text-sm text-muted-foreground">dias desde última manutenção</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Tipos de Veículo
          </CardTitle>
          <CardDescription>
            Categorias de veículos da sua frota
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              A personalização de tipos de veículos estará disponível em breve.
              Atualmente o sistema suporta: Caminhão, Carreta, Truck, Toco, Bitrem, Rodotrem, Van, Utilitário.
            </AlertDescription>
          </Alert>
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
