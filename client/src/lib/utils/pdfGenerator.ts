import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extender tipos para jspdf-autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface ReporteData {
  tienda: string;
  periodo: string;
  fechaGeneracion: string;
  ingresoEfectivo: number;
  ingresoBanco: number;
  taxEfectivo: number;
  taxBanco: number;
  gastoEfectivo: number;
  gastoBanco: number;
  ahorroEfectivo: number;
  ahorroBanco: number;
  inversionEfectivo: number;
  inversionBanco: number;
  emergenciaEfectivo: number;
  emergenciaBanco: number;
  disponibleEfectivo: number;
  disponibleBanco: number;
  transacciones: number;
  taxRate: number;
}

export const generarReportePDF = (data: ReporteData, tipo: 'general' | 'tienda') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colores corporativos
  const primaryColor: [number, number, number] = [37, 99, 235]; // Azul
  const successColor: [number, number, number] = [34, 197, 94]; // Verde
  const warningColor: [number, number, number] = [249, 115, 22]; // Naranja
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Fixopolis Solutions', 14, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Gestión Financiera', 14, 30);
  
  // Título del reporte
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const titulo = tipo === 'general' ? 'Reporte General Semanal' : `Reporte Semanal - ${data.tienda}`;
  doc.text(titulo, 14, 55);
  
  // Información del período
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Período: ${data.periodo}`, 14, 63);
  doc.text(`Generado: ${data.fechaGeneracion}`, 14, 70);
  doc.text(`Tasa de Impuesto: ${data.taxRate}%`, 14, 77);
  
  // Resumen Ejecutivo
  doc.setFillColor(240, 249, 255);
  doc.rect(14, 85, pageWidth - 28, 45, 'F');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen Ejecutivo', 20, 95);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const totalIngresos = data.ingresoEfectivo + data.ingresoBanco;
  const totalTaxes = data.taxEfectivo + data.taxBanco;
  const totalGastos = data.gastoEfectivo + data.gastoBanco;
  const totalAhorro = data.ahorroEfectivo + data.ahorroBanco;
  const gananciaNeta = totalIngresos - totalTaxes - totalGastos;
  
  doc.text(`Ingresos Totales: $${totalIngresos.toFixed(2)}`, 20, 105);
  doc.text(`Total Taxes (${data.taxRate}%): $${totalTaxes.toFixed(2)}`, 20, 113);
  doc.text(`Total Gastos: $${totalGastos.toFixed(2)}`, 20, 121);
  
  doc.text(`Ganancia Neta: $${gananciaNeta.toFixed(2)}`, 110, 105);
  doc.text(`Total Ahorro: $${totalAhorro.toFixed(2)}`, 110, 113);
  doc.text(`Transacciones: ${data.transacciones}`, 110, 121);
  
  // Tabla de Ingresos por Método
  doc.autoTable({
    startY: 140,
    head: [['Concepto', 'Efectivo', 'Banco', 'Total']],
    body: [
      ['Ingresos Brutos', `$${data.ingresoEfectivo.toFixed(2)}`, `$${data.ingresoBanco.toFixed(2)}`, `$${totalIngresos.toFixed(2)}`],
      [`Taxes (${data.taxRate}%)`, `$${data.taxEfectivo.toFixed(2)}`, `$${data.taxBanco.toFixed(2)}`, `$${totalTaxes.toFixed(2)}`],
      ['Ingresos Netos', `$${(data.ingresoEfectivo - data.taxEfectivo).toFixed(2)}`, `$${(data.ingresoBanco - data.taxBanco).toFixed(2)}`, `$${(totalIngresos - totalTaxes).toFixed(2)}`],
    ],
    headStyles: { fillColor: primaryColor },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: 14, right: 14 },
  });
  
  // Tabla de Distribución de Fondos
  const currentY = doc.lastAutoTable.finalY + 15;
  
  doc.setTextColor(...successColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Distribución de Fondos Inteligente', 14, currentY);
  
  doc.autoTable({
    startY: currentY + 5,
    head: [['Fondo', 'Efectivo', 'Banco', 'Total']],
    body: [
      ['Ahorro (10%)', `$${data.ahorroEfectivo.toFixed(2)}`, `$${data.ahorroBanco.toFixed(2)}`, `$${totalAhorro.toFixed(2)}`],
      ['Inversión (10%)', `$${data.inversionEfectivo.toFixed(2)}`, `$${data.inversionBanco.toFixed(2)}`, `$${(data.inversionEfectivo + data.inversionBanco).toFixed(2)}`],
      ['Emergencia (5%)', `$${data.emergenciaEfectivo.toFixed(2)}`, `$${data.emergenciaBanco.toFixed(2)}`, `$${(data.emergenciaEfectivo + data.emergenciaBanco).toFixed(2)}`],
      ['Disponible (75%)', `$${data.disponibleEfectivo.toFixed(2)}`, `$${data.disponibleBanco.toFixed(2)}`, `$${(data.disponibleEfectivo + data.disponibleBanco).toFixed(2)}`],
    ],
    headStyles: { fillColor: successColor },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    margin: { left: 14, right: 14 },
  });
  
  // Tabla de Gastos
  const gastosY = doc.lastAutoTable.finalY + 15;
  
  doc.setTextColor(...warningColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Gastos', 14, gastosY);
  
  doc.autoTable({
    startY: gastosY + 5,
    head: [['Método', 'Monto']],
    body: [
      ['Gastos en Efectivo', `$${data.gastoEfectivo.toFixed(2)}`],
      ['Gastos en Banco', `$${data.gastoBanco.toFixed(2)}`],
      ['Total Gastos', `$${totalGastos.toFixed(2)}`],
    ],
    headStyles: { fillColor: warningColor },
    alternateRowStyles: { fillColor: [255, 247, 237] },
    margin: { left: 14, right: 14 },
  });
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('© 2026 Fixopolis Solutions - Sistema de Gestión Financiera', 14, footerY);
  doc.text(`Página 1 de 1`, pageWidth - 30, footerY);
  
  // Descargar PDF
  const fileName = tipo === 'general' 
    ? `Reporte_General_${data.periodo.replace(/\s/g, '_')}.pdf`
    : `Reporte_${data.tienda.replace(/\s/g, '_')}_${data.periodo.replace(/\s/g, '_')}.pdf`;
  
  doc.save(fileName);
};

export const generarReporteTaxesPDF = (
  taxData: {
    tienda: string;
    taxEfectivo: number;
    taxBanco: number;
  }[],
  periodo: string,
  taxRate: number
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const primaryColor: [number, number, number] = [37, 99, 235];
  const taxColor: [number, number, number] = [234, 179, 8];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Fixopolis Solutions', 14, 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte de Impuestos', 14, 30);
  
  // Título
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Reporte de Taxes Semanal (${taxRate}%)`, 14, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Período: ${periodo}`, 14, 63);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 14, 70);
  
  // Tabla de Taxes por Tienda
  const tableData = taxData.map(t => [
    t.tienda,
    `$${t.taxEfectivo.toFixed(2)}`,
    `$${t.taxBanco.toFixed(2)}`,
    `$${(t.taxEfectivo + t.taxBanco).toFixed(2)}`
  ]);
  
  const totalEfectivo = taxData.reduce((sum, t) => sum + t.taxEfectivo, 0);
  const totalBanco = taxData.reduce((sum, t) => sum + t.taxBanco, 0);
  
  tableData.push(['TOTAL', `$${totalEfectivo.toFixed(2)}`, `$${totalBanco.toFixed(2)}`, `$${(totalEfectivo + totalBanco).toFixed(2)}`]);
  
  doc.autoTable({
    startY: 80,
    head: [['Tienda', 'Tax Efectivo', 'Tax Banco', 'Total Taxes']],
    body: tableData,
    headStyles: { fillColor: taxColor },
    footStyles: { fillColor: [254, 249, 195], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [254, 252, 232] },
    margin: { left: 14, right: 14 },
  });
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
  
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text('© 2026 Fixopolis Solutions - Sistema de Gestión Financiera', 14, footerY);
  
  doc.save(`Reporte_Taxes_${periodo.replace(/\s/g, '_')}.pdf`);
};
