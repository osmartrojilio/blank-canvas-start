import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Paperclip, Save, AlertCircle, HardDrive, FileImage, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AnexosConfig {
  permitir_anexos: boolean;
  tamanho_maximo_mb: number;
  exigir_nf_abastecimento: boolean;
  tipos_permitidos: string[];
}

const defaultConfig: AnexosConfig = {
  permitir_anexos: true,
  tamanho_maximo_mb: 5,
  exigir_nf_abastecimento: false,
  tipos_permitidos: ["pdf", "jpg", "jpeg", "png"],
};

const tiposArquivo = [
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "jpg", label: "JPG", icon: FileImage },
  { value: "jpeg", label: "JPEG", icon: FileImage },
  { value: "png", label: "PNG", icon: FileImage },
];

export function AnexosSettings() {
  const { toast } = useToast();
  const { profile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AnexosConfig>(defaultConfig);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(500); // MB

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
      
      // TODO: Calculate actual storage usage from storage bucket
      // For now, using mock data
      setStorageUsed(45);
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
        description: "As configurações de anexos foram atualizadas.",
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

  const toggleTipoArquivo = (tipo: string) => {
    if (!isAdmin) return;
    
    const tipos = [...config.tipos_permitidos];
    const index = tipos.indexOf(tipo);
    
    if (index > -1) {
      tipos.splice(index, 1);
    } else {
      tipos.push(tipo);
    }
    
    setConfig({ ...config, tipos_permitidos: tipos });
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

  const storagePercent = (storageUsed / storageLimit) * 100;

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para editar as configurações de anexos.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Armazenamento
          </CardTitle>
          <CardDescription>
            Uso de armazenamento da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usado: {storageUsed} MB</span>
              <span>Limite: {storageLimit} MB</span>
            </div>
            <Progress value={storagePercent} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground">
            O limite de armazenamento é definido pelo seu plano atual.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Configurações de Upload
          </CardTitle>
          <CardDescription>
            Configure as regras para upload de arquivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Permitir Anexos</Label>
              <p className="text-sm text-muted-foreground">
                Habilitar upload de arquivos no sistema
              </p>
            </div>
            <Switch
              checked={config.permitir_anexos}
              onCheckedChange={(checked) => setConfig({ ...config, permitir_anexos: checked })}
              disabled={!isAdmin}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Exigir NF no Abastecimento</Label>
              <p className="text-sm text-muted-foreground">
                Obrigatório anexar nota fiscal ao registrar abastecimento
              </p>
            </div>
            <Switch
              checked={config.exigir_nf_abastecimento}
              onCheckedChange={(checked) => setConfig({ ...config, exigir_nf_abastecimento: checked })}
              disabled={!isAdmin}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tamanho">Tamanho Máximo por Arquivo</Label>
            <div className="flex items-center gap-2">
              <Input
                id="tamanho"
                type="number"
                value={config.tamanho_maximo_mb}
                onChange={(e) => setConfig({ ...config, tamanho_maximo_mb: parseInt(e.target.value) || 1 })}
                className="w-24"
                min={1}
                max={20}
                disabled={!isAdmin}
              />
              <span className="text-sm text-muted-foreground">MB</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipos de Arquivo Permitidos</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {tiposArquivo.map((tipo) => {
                const isSelected = config.tipos_permitidos.includes(tipo.value);
                const Icon = tipo.icon;
                return (
                  <Badge
                    key={tipo.value}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${isAdmin ? "hover:opacity-80" : "opacity-70"}`}
                    onClick={() => toggleTipoArquivo(tipo.value)}
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {tipo.label}
                  </Badge>
                );
              })}
            </div>
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
