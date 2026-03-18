import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Printer, CheckCircle } from "lucide-react";
import jsPDF from "jspdf";

interface ReceiptData {
  paymentId: string;
  planName: string;
  planPrice: number;
  organizationName: string;
  organizationCnpj: string | null;
  payerEmail: string;
  paymentMethod: string;
  installments: number;
  date: string;
}

interface PaymentReceiptProps {
  data: ReceiptData;
  onClose: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatCnpj(cnpj: string | null) {
  if (!cnpj) return "—";
  const c = cnpj.replace(/\D/g, "");
  if (c.length !== 14) return cnpj;
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12)}`;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export default function PaymentReceipt({ data, onClose }: PaymentReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const generatePdf = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pw = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RECIBO DE PAGAMENTO", pw / 2, y, { align: "center" });
    y += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Gerenciar Frotas", pw / 2, y, { align: "center" });
    y += 12;

    // Line
    doc.setDrawColor(200);
    doc.line(20, y, pw - 20, y);
    y += 10;

    const addRow = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(label, 25, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, pw - 25, y, { align: "right" });
      y += 7;
    };

    addRow("Nº do Pagamento:", data.paymentId);
    addRow("Data:", formatDate(data.date));
    addRow("Plano:", data.planName);
    addRow("Valor:", formatCurrency(data.planPrice));
    if (data.installments > 1) {
      addRow("Parcelas:", `${data.installments}x de ${formatCurrency(data.planPrice / data.installments)}`);
    }
    addRow("Forma de Pagamento:", data.paymentMethod);
    y += 3;

    doc.line(20, y, pw - 20, y);
    y += 10;

    addRow("Empresa:", data.organizationName);
    if (data.organizationCnpj) {
      addRow("CNPJ:", formatCnpj(data.organizationCnpj));
    }
    addRow("Email:", data.payerEmail);
    y += 10;

    doc.line(20, y, pw - 20, y);
    y += 10;

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("Este recibo comprova o pagamento do plano de assinatura.", pw / 2, y, { align: "center" });
    y += 5;
    doc.text("Gerado automaticamente pelo sistema Gerenciar Frotas.", pw / 2, y, { align: "center" });

    doc.save(`recibo-${data.paymentId}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Visual receipt */}
      <div
        ref={receiptRef}
        className="bg-card border rounded-lg p-6 space-y-4 print:border-none print:shadow-none"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
          <h3 className="text-lg font-bold">Pagamento Aprovado</h3>
          <p className="text-xs text-muted-foreground">Recibo de Pagamento</p>
        </div>

        <Separator />

        {/* Details */}
        <div className="space-y-2 text-sm">
          <Row label="Nº Pagamento" value={data.paymentId} />
          <Row label="Data" value={formatDate(data.date)} />
          <Row label="Plano" value={data.planName} />
          <Row label="Valor" value={formatCurrency(data.planPrice)} highlight />
          {data.installments > 1 && (
            <Row
              label="Parcelas"
              value={`${data.installments}x de ${formatCurrency(data.planPrice / data.installments)}`}
            />
          )}
          <Row label="Pagamento" value={data.paymentMethod} />
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <Row label="Empresa" value={data.organizationName} />
          {data.organizationCnpj && (
            <Row label="CNPJ" value={formatCnpj(data.organizationCnpj)} />
          )}
          <Row label="Email" value={data.payerEmail} />
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-2">
          Gerado automaticamente pelo sistema Gerenciar Frotas
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 print:hidden">
        <Button onClick={generatePdf} className="flex-1" variant="default">
          <Download className="w-4 h-4 mr-2" />
          Baixar PDF
        </Button>
        <Button onClick={handlePrint} variant="outline" size="icon">
          <Printer className="w-4 h-4" />
        </Button>
      </div>

      <Button onClick={onClose} variant="ghost" className="w-full print:hidden">
        Fechar
      </Button>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold text-green-600" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}
