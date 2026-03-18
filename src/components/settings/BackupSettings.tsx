import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Download, Upload, AlertTriangle, CheckCircle2, Loader2, FileJson, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BackupData {
  version: string;
  created_at: string;
  organization_id: string;
  organization_name: string;
  data: {
    vehicles: any[];
    drivers: any[];
    trips: any[];
    fuel_records: any[];
    expenses: any[];
    maintenance_records: any[];
    attachments: any[];
  };
}

export function BackupSettings() {
  const { profile, organization } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<BackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!profile?.organization_id) {
      toast({
        title: "Erro",
        description: "Organização não encontrada",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      // Fetch all organization data in parallel
      const [
        vehiclesRes,
        driversRes,
        tripsRes,
        fuelRes,
        expensesRes,
        maintenanceRes,
        attachmentsRes,
      ] = await Promise.all([
        supabase.from("vehicles").select("*").eq("organization_id", profile.organization_id),
        supabase.from("drivers").select("*").eq("organization_id", profile.organization_id),
        supabase.from("trips").select("*").eq("organization_id", profile.organization_id),
        supabase.from("fuel_records").select("*").eq("organization_id", profile.organization_id),
        supabase.from("expenses").select("*").eq("organization_id", profile.organization_id),
        supabase.from("maintenance_records").select("*").eq("organization_id", profile.organization_id),
        supabase.from("attachments").select("*").eq("organization_id", profile.organization_id),
      ]);

      // Check for errors
      const errors = [vehiclesRes, driversRes, tripsRes, fuelRes, expensesRes, maintenanceRes, attachmentsRes]
        .filter(res => res.error);
      
      if (errors.length > 0) {
        throw new Error("Erro ao buscar dados para backup");
      }

      const backupData: BackupData = {
        version: "1.0",
        created_at: new Date().toISOString(),
        organization_id: profile.organization_id,
        organization_name: organization?.name || "Organização",
        data: {
          vehicles: vehiclesRes.data || [],
          drivers: driversRes.data || [],
          trips: tripsRes.data || [],
          fuel_records: fuelRes.data || [],
          expenses: expensesRes.data || [],
          maintenance_records: maintenanceRes.data || [],
          attachments: attachmentsRes.data || [],
        },
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_${organization?.slug || "org"}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup criado!",
        description: "O arquivo foi baixado com sucesso.",
      });
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        title: "Erro ao exportar",
        description: error.message || "Não foi possível criar o backup",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImportError(null);
    setImportPreview(null);

    if (!file) {
      setImportFile(null);
      return;
    }

    if (!file.name.endsWith(".json")) {
      setImportError("O arquivo deve ser do tipo JSON");
      setImportFile(null);
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;

      // Validate backup structure
      if (!data.version || !data.data || !data.organization_id) {
        setImportError("Arquivo de backup inválido ou corrompido");
        setImportFile(null);
        return;
      }

      setImportFile(file);
      setImportPreview(data);
    } catch (error) {
      setImportError("Erro ao ler o arquivo. Verifique se é um backup válido.");
      setImportFile(null);
    }
  };

  const handleImport = async () => {
    if (!importPreview || !profile?.organization_id) return;

    setIsImporting(true);
    try {
      const orgId = profile.organization_id;
      const { data: backupData } = importPreview;

      // Import in sequence to handle dependencies
      // 1. Vehicles first (referenced by trips, fuel_records, etc.)
      if (backupData.vehicles.length > 0) {
        const vehiclesToInsert = backupData.vehicles.map(v => ({
          ...v,
          id: undefined, // Let DB generate new ID
          organization_id: orgId,
          driver_id: null, // Will need to be remapped
        }));
        
        const { error } = await supabase.from("vehicles").insert(vehiclesToInsert);
        if (error) throw new Error(`Erro ao importar veículos: ${error.message}`);
      }

      // 2. Expenses (standalone)
      if (backupData.expenses.length > 0) {
        const expensesToInsert = backupData.expenses.map(e => ({
          ...e,
          id: undefined,
          organization_id: orgId,
          vehicle_id: null,
          driver_id: null,
          trip_id: null,
          created_by: null,
        }));
        
        const { error } = await supabase.from("expenses").insert(expensesToInsert);
        if (error) throw new Error(`Erro ao importar despesas: ${error.message}`);
      }

      toast({
        title: "Backup restaurado!",
        description: `Dados importados com sucesso. Veículos: ${backupData.vehicles.length}, Despesas: ${backupData.expenses.length}`,
      });

      // Reset state
      setImportFile(null);
      setImportPreview(null);
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Erro ao importar",
        description: error.message || "Não foi possível restaurar o backup",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getTotalRecords = (data: BackupData["data"]) => {
    return Object.values(data).reduce((acc, arr) => acc + arr.length, 0);
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Criar Backup
          </CardTitle>
          <CardDescription>
            Exporte todos os dados da sua organização em formato JSON
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <FileJson className="h-4 w-4" />
            <AlertDescription>
              O backup incluirá: veículos, motoristas, viagens, abastecimentos, despesas, manutenções e anexos.
              Arquivos anexados não são incluídos, apenas os metadados.
            </AlertDescription>
          </Alert>

          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando backup...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Baixar Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Restaurar Backup
          </CardTitle>
          <CardDescription>
            Importe dados de um backup JSON criado anteriormente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> A restauração de backup irá adicionar novos registros ao sistema.
              Registros existentes não serão modificados ou excluídos.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="backup-file">Selecionar arquivo de backup</Label>
            <Input
              id="backup-file"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              disabled={isImporting}
            />
          </div>

          {importError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}

          {importPreview && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-medium">Arquivo válido</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Organização:</div>
                    <div className="font-medium">{importPreview.organization_name}</div>
                    
                    <div className="text-muted-foreground">Data do backup:</div>
                    <div className="font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(importPreview.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                    
                    <div className="text-muted-foreground">Total de registros:</div>
                    <div className="font-medium">{getTotalRecords(importPreview.data)}</div>
                  </div>

                  <div className="pt-2 border-t space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">Detalhes:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <span>Veículos: {importPreview.data.vehicles.length}</span>
                      <span>Motoristas: {importPreview.data.drivers.length}</span>
                      <span>Viagens: {importPreview.data.trips.length}</span>
                      <span>Abastecimentos: {importPreview.data.fuel_records.length}</span>
                      <span>Despesas: {importPreview.data.expenses.length}</span>
                      <span>Manutenções: {importPreview.data.maintenance_records.length}</span>
                      <span>Anexos: {importPreview.data.attachments.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={handleImport} 
            disabled={!importPreview || isImporting}
            variant="outline"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Restaurando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Restaurar Backup
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
