import { useEffect, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentReceipt from "./PaymentReceipt";

interface PaymentBrickProps {
  planId: string;
  planName: string;
  planPrice: number;
  organizationId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
  onClose: () => void;
  couponId?: string;
  durationMonths?: number;
}

type PaymentResult = {
  status: "approved" | "pending" | "rejected";
  payment_id: string;
  status_detail: string;
  message: string;
  organization_name?: string;
  organization_cnpj?: string | null;
  payer_email?: string;
  payment_method?: string;
  installments?: number;
  amount?: number;
  payment_date?: string;
} | null;

export default function PaymentBrick({
  planId,
  planName,
  planPrice,
  organizationId,
  onSuccess,
  onError,
  onClose,
  couponId,
  durationMonths,
}: PaymentBrickProps) {
  const { user } = useAuth();
  const [sdkReady, setSdkReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<PaymentResult>(null);
  const [keyError, setKeyError] = useState(false);

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-mp-public-key");
        if (error || !data?.public_key) {
          setKeyError(true);
          return;
        }
        initMercadoPago(data.public_key, { locale: "pt-BR" });
        setSdkReady(true);
      } catch {
        setKeyError(true);
      }
    };
    fetchKey();
  }, []);

  const formatPaymentMethod = (method: string | undefined) => {
    const map: Record<string, string> = {
      pix: "PIX",
      credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito",
      bank_transfer: "Transferência Bancária",
      bolbradesco: "Boleto",
    };
    return method ? map[method] || method : "—";
  };

  const handleSubmit = async (submitData: any) => {
    setProcessing(true);
    try {
      const fd = submitData.formData || submitData;
      console.log("Payment submit data:", JSON.stringify(fd, null, 2));
      
      const payload = {
        token: fd.token,
        payment_method_id: fd.payment_method_id,
        installments: fd.installments || 1,
        issuer_id: fd.issuer_id,
        payer: fd.payer,
        transaction_amount: fd.transaction_amount || planPrice,
        plan_id: planId,
        plan_name: planName,
        plan_price: planPrice,
        organization_id: organizationId,
        coupon_id: couponId || undefined,
        duration_months: durationMonths || 12,
      };

      const { data, error } = await supabase.functions.invoke("mercado-pago-checkout", {
        body: payload,
      });

      if (error) {
        console.error("Payment error:", error);
        onError("Erro ao processar pagamento. Tente novamente.");
        setProcessing(false);
        return;
      }

      setResult(data);

      if (data?.status === "approved") {
        onSuccess();
      } else if (data?.status === "rejected") {
        onError(data?.message || "Pagamento não aprovado.");
      }
    } catch (err) {
      console.error("Payment submit error:", err);
      onError("Erro de conexão. Verifique sua internet.");
    } finally {
      setProcessing(false);
    }
  };

  if (keyError) {
    return (
      <div className="text-center py-8 text-destructive">
        Configuração de pagamento não encontrada.
      </div>
    );
  }

  if (result?.status === "approved") {
    return (
      <PaymentReceipt
        data={{
          paymentId: result.payment_id,
          planName: planName,
          planPrice: result.amount || planPrice,
          organizationName: result.organization_name || "",
          organizationCnpj: result.organization_cnpj || null,
          payerEmail: result.payer_email || user?.email || "",
          paymentMethod: formatPaymentMethod(result.payment_method),
          installments: result.installments || 1,
          date: result.payment_date || new Date().toISOString(),
        }}
        onClose={onClose}
      />
    );
  }

  if (result) {
    return (
      <div className="text-center py-8 space-y-4">
        {result.status === "pending" && (
          <>
            <Clock className="w-16 h-16 text-amber-500 mx-auto" />
            <h3 className="text-lg font-semibold text-amber-600">Pagamento Pendente</h3>
            <p className="text-sm text-muted-foreground">{result.message}</p>
            <p className="text-xs text-muted-foreground">
              Seu plano será ativado assim que o pagamento for confirmado.
            </p>
            <Button onClick={onClose} variant="outline" className="mt-4">Fechar</Button>
          </>
        )}
        {result.status === "rejected" && (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <h3 className="text-lg font-semibold text-destructive">Pagamento Não Aprovado</h3>
            <p className="text-sm text-muted-foreground">{result.message}</p>
            <Button onClick={() => setResult(null)} variant="outline" className="mt-4">
              Tentar Novamente
            </Button>
          </>
        )}
      </div>
    );
  }

  if (!sdkReady) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando formulário de pagamento...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {processing && (
        <div className="absolute inset-0 z-10 bg-background/80 flex items-center justify-center rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 font-medium">Processando pagamento...</span>
        </div>
      )}
      <Payment
        initialization={{
          amount: planPrice,
          payer: {
            email: user?.email || "",
          },
        }}
        customization={{
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            bankTransfer: "all",
            maxInstallments: 12,
          },
          visual: {
            style: {
              theme: "default",
            },
          },
        }}
        onSubmit={handleSubmit}
        onError={(error: any) => {
          console.error("Brick error:", error);
          onError("Erro no formulário de pagamento.");
        }}
      />
    </div>
  );
}
