import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, FileText } from "lucide-react";
import { useFiscalData } from "@/hooks/useFiscalData";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { QuickCreateClient } from "@/components/shared/QuickCreateClient";
import type { Trip } from "@/hooks/useTrips";

interface TripCtePreviewProps {
  trip: Trip;
  open: boolean;
  onClose: () => void;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 group">
      <div className="min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <p className="text-sm font-medium text-foreground truncate">{value || "—"}</p>
      </div>
      {value && (
        <button onClick={handleCopy} className="p-1 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100">
          {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      )}
    </div>
  );
}

export function TripCtePreview({ trip, open, onClose }: TripCtePreviewProps) {
  const { fiscalData } = useFiscalData();
  const { clients, fetchClients } = useClients();
  const { organization } = useAuth();
  const [orgCnpj, setOrgCnpj] = useState("");

  useEffect(() => {
    supabase.rpc("get_organization_for_user").then(({ data }) => {
      if (data && data.length > 0) setOrgCnpj(data[0].cnpj || "");
    });
  }, []);

  // Find matching client by name
  const matchedClient = clients.find(
    c => c.name.toLowerCase() === trip.client_name?.toLowerCase()
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Dados para CT-e — Treeunfe
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Emitente */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Emitente</h3>
              <div className="bg-secondary/30 rounded-lg p-3 space-y-0.5">
                <CopyField label="Razão Social" value={organization?.name || ""} />
                <CopyField label="CNPJ" value={orgCnpj} />
                <CopyField label="IE" value={fiscalData?.ie || ""} />
                <CopyField label="RNTRC" value={fiscalData?.rntrc || ""} />
                {fiscalData?.street && (
                  <CopyField label="Endereço" value={`${fiscalData.street}, ${fiscalData.number || "S/N"} - ${fiscalData.neighborhood || ""} - ${fiscalData.city || ""}/${fiscalData.state || ""} - CEP ${fiscalData.zip_code || ""}`} />
                )}
                {fiscalData?.city_ibge_code && <CopyField label="Cód. IBGE Cidade" value={fiscalData.city_ibge_code} />}
              </div>
            </div>

            {/* Remetente/Destinatário */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">
                {matchedClient ? "Cliente (Remetente/Destinatário)" : "Cliente"}
              </h3>
              <div className="bg-secondary/30 rounded-lg p-3 space-y-0.5">
                <CopyField label="Nome/Razão Social" value={matchedClient?.name || trip.client_name || ""} />
                {matchedClient ? (
                  <>
                    <CopyField label="CPF/CNPJ" value={matchedClient.cpf_cnpj} />
                    <CopyField label="IE" value={matchedClient.ie || ""} />
                    {matchedClient.street && (
                      <CopyField label="Endereço" value={`${matchedClient.street}, ${matchedClient.number || "S/N"} - ${matchedClient.neighborhood || ""} - ${matchedClient.city || ""}/${matchedClient.state || ""} - CEP ${matchedClient.zip_code || ""}`} />
                    )}
                    {matchedClient.city_ibge_code && <CopyField label="Cód. IBGE Cidade" value={matchedClient.city_ibge_code} />}
                    {matchedClient.email && <CopyField label="Email" value={matchedClient.email} />}
                    {matchedClient.phone && <CopyField label="Telefone" value={matchedClient.phone} />}
                  </>
                ) : (
                  <div className="px-2 py-1 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Cliente não encontrado no cadastro. Cadastre-o para preencher automaticamente.
                    </p>
                    <QuickCreateClient onCreated={() => { fetchClients(); }} />
                  </div>
                )}
              </div>
            </div>

            {/* Dados da Prestação */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Prestação do Serviço</h3>
              <div className="bg-secondary/30 rounded-lg p-3 space-y-0.5">
                <CopyField label="Origem" value={trip.origin} />
                <CopyField label="Destino" value={trip.destination} />
                <CopyField label="Data Início" value={new Date(trip.start_date).toLocaleDateString("pt-BR")} />
                {trip.end_date && <CopyField label="Data Fim" value={new Date(trip.end_date).toLocaleDateString("pt-BR")} />}
              </div>
            </div>

            {/* Carga */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Informações da Carga</h3>
              <div className="bg-secondary/30 rounded-lg p-3 space-y-0.5">
                <CopyField label="Tipo de Carga" value={trip.cargo_type || ""} />
                <CopyField label="Peso (t)" value={trip.tonnage ? String(trip.tonnage) : ""} />
                <CopyField label="NF-e" value={trip.invoice_number || ""} />
              </div>
            </div>

            {/* Valores */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Valores do Frete</h3>
              <div className="bg-secondary/30 rounded-lg p-3 space-y-0.5">
                <CopyField label="Valor Total do Frete" value={trip.freight_value ? formatCurrency(trip.freight_value) : ""} />
                {fiscalData && (
                  <>
                    <CopyField label="CFOP" value={fiscalData.cfop_padrao} />
                    <CopyField label="CST ICMS" value={fiscalData.cst_icms} />
                    <CopyField label="Alíquota ICMS" value={`${fiscalData.aliquota_icms}%`} />
                    {trip.freight_value && fiscalData.aliquota_icms > 0 && (
                      <CopyField label="Valor ICMS" value={formatCurrency(trip.freight_value * fiscalData.aliquota_icms / 100)} />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Veículo */}
            <div>
              <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Veículo</h3>
              <div className="bg-secondary/30 rounded-lg p-3 space-y-0.5">
                <CopyField label="Placa" value={trip.vehicle?.plate || ""} />
                <CopyField label="Prefixo" value={trip.vehicle?.prefix || ""} />
              </div>
            </div>

            {trip.notes && (
              <div>
                <h3 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Observações</h3>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <CopyField label="Notas" value={trip.notes} />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
