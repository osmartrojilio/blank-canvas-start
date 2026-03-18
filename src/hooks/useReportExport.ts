import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

interface VehicleCost {
  veiculo: string;
  custo: number;
}

interface ExpenseByType {
  name: string;
  value: number;
  color: string;
}

interface Metric {
  titulo: string;
  valor: string;
}

interface VehicleProfit {
  veiculo: string;
  faturamento: number;
  despesas: number;
  lucro: number;
}

interface ReportData {
  monthLabel: string;
  metricas: Metric[];
  custosPorVeiculo: VehicleCost[];
  despesasPorTipo: ExpenseByType[];
  lucroPorVeiculo: VehicleProfit[];
}

export function useReportExport() {
  const exportToPDF = (data: ReportData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("Relatório de Frota", pageWidth / 2, 20, { align: "center" });
    
    // Period
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${data.monthLabel}`, pageWidth / 2, 28, { align: "center" });
    
    // Metrics section
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Métricas Principais", 14, 42);
    
    const metricsData = data.metricas.map((m) => [m.titulo, m.valor]);
    autoTable(doc, {
      startY: 46,
      head: [["Métrica", "Valor"]],
      body: metricsData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });
    
    // Costs per vehicle
    let currentY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(14);
    doc.text("Custos por Veículo", 14, currentY);
    
    const vehicleCostsData = data.custosPorVeiculo.map((v) => [
      v.veiculo,
      `R$ ${v.custo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    ]);
    autoTable(doc, {
      startY: currentY + 4,
      head: [["Veículo", "Custo Total"]],
      body: vehicleCostsData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });
    
    // Expenses by type
    currentY = (doc as any).lastAutoTable.finalY + 12;
    
    // Check if we need a new page
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.text("Despesas por Categoria", 14, currentY);
    
    const expensesData = data.despesasPorTipo.map((e) => [
      e.name,
      `R$ ${e.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    ]);
    autoTable(doc, {
      startY: currentY + 4,
      head: [["Categoria", "Valor"]],
      body: expensesData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });
    
    // Profit per vehicle
    currentY = (doc as any).lastAutoTable.finalY + 12;
    
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(14);
    doc.text("Lucro por Veículo", 14, currentY);
    
    const profitData = data.lucroPorVeiculo.map((v) => {
      const margem = v.faturamento > 0 
        ? ((v.lucro / v.faturamento) * 100).toFixed(1) 
        : "0.0";
      return [
        v.veiculo,
        `R$ ${v.faturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${v.despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `R$ ${v.lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        `${margem}%`,
      ];
    });
    autoTable(doc, {
      startY: currentY + 4,
      head: [["Veículo", "Faturamento", "Despesas", "Lucro", "Margem"]],
      body: profitData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" }
      );
    }
    
    // Save
    const fileName = `relatorio-frota-${data.monthLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`;
    doc.save(fileName);
  };

  const exportToExcel = async (data: ReportData) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Sistema de Frota";
    workbook.created = new Date();
    
    const headerStyle: Partial<ExcelJS.Style> = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B82F6" } },
      alignment: { horizontal: "center", vertical: "middle" },
    };

    // Metrics sheet
    const metricsSheet = workbook.addWorksheet("Métricas");
    metricsSheet.columns = [
      { header: "Métrica", key: "titulo", width: 25 },
      { header: "Valor", key: "valor", width: 25 },
    ];
    metricsSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });
    data.metricas.forEach((m) => {
      metricsSheet.addRow({ titulo: m.titulo, valor: m.valor });
    });

    // Costs per vehicle sheet
    const costsSheet = workbook.addWorksheet("Custos por Veículo");
    costsSheet.columns = [
      { header: "Veículo", key: "veiculo", width: 20 },
      { header: "Custo Total (R$)", key: "custo", width: 20 },
    ];
    costsSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });
    data.custosPorVeiculo.forEach((v) => {
      costsSheet.addRow({ veiculo: v.veiculo, custo: v.custo });
    });
    costsSheet.getColumn("custo").numFmt = 'R$ #,##0.00';

    // Expenses by type sheet
    const expensesSheet = workbook.addWorksheet("Despesas por Categoria");
    expensesSheet.columns = [
      { header: "Categoria", key: "name", width: 22 },
      { header: "Valor (R$)", key: "value", width: 20 },
    ];
    expensesSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });
    data.despesasPorTipo.forEach((e) => {
      expensesSheet.addRow({ name: e.name, value: e.value });
    });
    expensesSheet.getColumn("value").numFmt = 'R$ #,##0.00';

    // Profit per vehicle sheet
    const profitSheet = workbook.addWorksheet("Lucro por Veículo");
    profitSheet.columns = [
      { header: "Veículo", key: "veiculo", width: 18 },
      { header: "Faturamento (R$)", key: "faturamento", width: 20 },
      { header: "Despesas (R$)", key: "despesas", width: 20 },
      { header: "Lucro (R$)", key: "lucro", width: 20 },
      { header: "Margem (%)", key: "margem", width: 14 },
    ];
    profitSheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });
    data.lucroPorVeiculo.forEach((v) => {
      const margem = v.faturamento > 0 
        ? Number(((v.lucro / v.faturamento) * 100).toFixed(1))
        : 0;
      profitSheet.addRow({
        veiculo: v.veiculo,
        faturamento: v.faturamento,
        despesas: v.despesas,
        lucro: v.lucro,
        margem: margem,
      });
    });
    profitSheet.getColumn("faturamento").numFmt = 'R$ #,##0.00';
    profitSheet.getColumn("despesas").numFmt = 'R$ #,##0.00';
    profitSheet.getColumn("lucro").numFmt = 'R$ #,##0.00';
    profitSheet.getColumn("margem").numFmt = '0.0"%"';

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-frota-${data.monthLabel.replace(/\s+/g, "-").toLowerCase()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return { exportToPDF, exportToExcel };
}
