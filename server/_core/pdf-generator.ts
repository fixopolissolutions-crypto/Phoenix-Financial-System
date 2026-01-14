/**
 * PDF Generator - Genera reportes semanales en PDF
 */

import * as fs from 'fs';
import * as path from 'path';

interface WeeklyReportData {
  tienda: 'admin' | 'sucursal';
  tiendaNombre: string;
  weekStart: string;
  weekEnd: string;
  totalIngresos: number;
  totalGastos: number;
  totalNomina: number;
  totalTax: number;
  gananciaNeta: number;
  transaccionesCount: number;
  taxRate: number;
}

/**
 * Genera un reporte semanal en PDF usando HTML
 */
export async function generateWeeklyPDFReport(data: WeeklyReportData): Promise<string> {
  try {
    // Crear directorio de reportes si no existe
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Nombre del archivo
    const filename = `reporte_semanal_${data.tienda}_${data.weekStart}_${data.weekEnd}.pdf`;
    const filepath = path.join(reportsDir, filename);
    
    // Generar HTML del reporte
    const html = generateReportHTML(data);
    
    // Convertir HTML a PDF usando weasyprint (instalado en el sistema)
    const htmlPath = filepath.replace('.pdf', '.html');
    fs.writeFileSync(htmlPath, html, 'utf-8');
    
    // Usar weasyprint para convertir HTML a PDF
    const { execSync } = require('child_process');
    try {
      execSync(`weasyprint ${htmlPath} ${filepath}`, { stdio: 'pipe' });
      console.log(`[PDF Generator] PDF generado exitosamente: ${filepath}`);
      
      // Eliminar HTML temporal
      fs.unlinkSync(htmlPath);
    } catch (error) {
      console.error('[PDF Generator] Error al generar PDF con weasyprint:', error);
      // Si falla weasyprint, mantener el HTML como respaldo
      console.log(`[PDF Generator] HTML guardado como respaldo: ${htmlPath}`);
      return htmlPath;
    }
    
    return filepath;
  } catch (error) {
    console.error('[PDF Generator] Error al generar reporte PDF:', error);
    throw error;
  }
}

/**
 * Genera el HTML del reporte
 */
function generateReportHTML(data: WeeklyReportData): string {
  const ingresoNeto = data.totalIngresos - data.totalTax;
  const porcentajeGanancia = data.totalIngresos > 0 
    ? ((data.gananciaNeta / data.totalIngresos) * 100).toFixed(2)
    : '0.00';
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Semanal - ${data.tiendaNombre}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      padding: 40px;
      background: #f5f5f5;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #3b82f6;
    }
    
    .header h1 {
      color: #1e40af;
      font-size: 28px;
      margin-bottom: 10px;
    }
    
    .header h2 {
      color: #64748b;
      font-size: 20px;
      font-weight: normal;
      margin-bottom: 15px;
    }
    
    .period {
      background: #eff6ff;
      padding: 15px;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 30px;
    }
    
    .period strong {
      color: #1e40af;
      font-size: 16px;
    }
    
    .summary {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-radius: 8px;
      color: white;
    }
    
    .summary-card.green {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    
    .summary-card.red {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }
    
    .summary-card.orange {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }
    
    .summary-card.blue {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
    
    .summary-card h3 {
      font-size: 14px;
      font-weight: normal;
      margin-bottom: 10px;
      opacity: 0.9;
    }
    
    .summary-card .amount {
      font-size: 32px;
      font-weight: bold;
    }
    
    .details {
      margin-top: 30px;
    }
    
    .details h3 {
      color: #1e40af;
      font-size: 18px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .detail-item {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #3b82f6;
    }
    
    .detail-item .label {
      color: #64748b;
      font-size: 14px;
      margin-bottom: 5px;
    }
    
    .detail-item .value {
      color: #1e293b;
      font-size: 20px;
      font-weight: bold;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #64748b;
      font-size: 12px;
    }
    
    .highlight {
      background: #fef3c7;
      padding: 20px;
      border-radius: 6px;
      border-left: 4px solid #f59e0b;
      margin-top: 20px;
    }
    
    .highlight strong {
      color: #92400e;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Reporte Semanal</h1>
      <h2>${data.tiendaNombre}</h2>
    </div>
    
    <div class="period">
      <strong>Período: ${formatDate(data.weekStart)} - ${formatDate(data.weekEnd)}</strong>
    </div>
    
    <div class="summary">
      <div class="summary-card green">
        <h3>Ingresos Totales</h3>
        <div class="amount">$${data.totalIngresos.toFixed(2)}</div>
      </div>
      
      <div class="summary-card red">
        <h3>Gastos Totales</h3>
        <div class="amount">$${data.totalGastos.toFixed(2)}</div>
      </div>
      
      <div class="summary-card orange">
        <h3>Taxes (${data.taxRate}%)</h3>
        <div class="amount">$${data.totalTax.toFixed(2)}</div>
      </div>
      
      <div class="summary-card blue">
        <h3>Ganancia Neta</h3>
        <div class="amount">$${data.gananciaNeta.toFixed(2)}</div>
      </div>
    </div>
    
    <div class="details">
      <h3>Detalles Financieros</h3>
      
      <div class="details-grid">
        <div class="detail-item">
          <div class="label">Ingreso Bruto</div>
          <div class="value">$${data.totalIngresos.toFixed(2)}</div>
        </div>
        
        <div class="detail-item">
          <div class="label">Impuestos Deducidos</div>
          <div class="value">-$${data.totalTax.toFixed(2)}</div>
        </div>
        
        <div class="detail-item">
          <div class="label">Ingreso Neto</div>
          <div class="value">$${ingresoNeto.toFixed(2)}</div>
        </div>
        
        <div class="detail-item">
          <div class="label">Gastos Operativos</div>
          <div class="value">-$${data.totalGastos.toFixed(2)}</div>
        </div>
        
        <div class="detail-item">
          <div class="label">Nómina</div>
          <div class="value">-$${data.totalNomina.toFixed(2)}</div>
        </div>
        
        <div class="detail-item">
          <div class="label">Transacciones</div>
          <div class="value">${data.transaccionesCount}</div>
        </div>
      </div>
    </div>
    
    <div class="highlight">
      <strong>Margen de Ganancia: ${porcentajeGanancia}%</strong>
      <p style="margin-top: 10px; color: #78350f;">
        ${data.gananciaNeta >= 0 
          ? '✅ La semana fue rentable. Continúa con el buen trabajo.'
          : '⚠️ La semana tuvo pérdidas. Revisa los gastos y estrategias de ventas.'}
      </p>
    </div>
    
    <div class="footer">
      <p>Reporte generado automáticamente el ${new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
      <p style="margin-top: 5px;">Phoenix Financial System - ${data.tiendaNombre}</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Formatea una fecha YYYY-MM-DD a formato legible
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
