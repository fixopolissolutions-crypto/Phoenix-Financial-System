import type { Repair } from "../drizzle/schema";

interface StoreConfig {
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  estado: string;
  codigoPostal: string;
}

export function generateReceiptHTML(repair: Repair, storeInfo: StoreConfig): string {
  const isPagado = repair.pagado === 1;
  
  // Calcular fecha de garantía (60 días)
  const fechaGarantia = new Date(repair.fechaIngreso);
  fechaGarantia.setDate(fechaGarantia.getDate() + 60);
  
  // Calcular subtotal y taxes
  const subtotal = Number(repair.precioTotal);
  const taxRate = 0.0825; // 8.25% tax rate
  const taxAmount = subtotal * taxRate;
  const totalConTax = subtotal + taxAmount;
  
  // Formatear fecha
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo #${repair.codigo}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1f2937;
      padding: 15mm;
    }
    
    .receipt-container {
      max-width: 180mm;
      margin: 0 auto;
      background: white;
    }
    
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      font-weight: bold;
      color: rgba(34, 197, 94, 0.1);
      z-index: -1;
      pointer-events: none;
    }
    
    .receipt-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .header-left {
      flex: 1;
    }
    
    .logo {
      height: 40px;
      margin-bottom: 5px;
    }
    
    .store-name {
      font-size: 13px;
      font-weight: 600;
      color: #1f2937;
      margin: 3px 0;
    }
    
    .store-subtitle {
      font-size: 11px;
      color: #6b7280;
      margin: 2px 0;
    }
    
    .store-info {
      font-size: 10px;
      color: #6b7280;
      margin: 1px 0;
    }
    
    .header-right {
      text-align: right;
    }
    
    .receipt-title {
      font-size: 22px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 5px;
    }
    
    .receipt-code {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      margin: 2px 0;
    }
    
    .receipt-date {
      font-size: 10px;
      color: #6b7280;
      margin: 2px 0;
    }
    
    .paid-badge {
      display: inline-block;
      background: #22c55e;
      color: white;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
      margin-top: 5px;
    }
    
    .section {
      margin-bottom: 12px;
    }
    
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 3px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    
    .info-item {
      display: flex;
      gap: 5px;
    }
    
    .info-item.full-width {
      grid-column: 1 / -1;
    }
    
    .info-label {
      font-weight: 600;
      color: #4b5563;
      font-size: 10px;
    }
    
    .info-value {
      color: #1f2937;
      font-size: 10px;
    }
    
    .cost-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6px;
    }
    
    .cost-table th {
      background: #f9fafb;
      padding: 6px;
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      border: 1px solid #e5e7eb;
    }
    
    .cost-table th:last-child {
      text-align: right;
    }
    
    .cost-table td {
      padding: 6px;
      font-size: 10px;
      border: 1px solid #e5e7eb;
    }
    
    .cost-table .amount {
      text-align: right;
      font-weight: 600;
    }
    
    .cost-table .total-row {
      background: #f9fafb;
    }
    
    .cost-table .total-row td {
      font-weight: bold;
      font-size: 11px;
    }
    
    .cost-table .total-amount {
      text-align: right;
      color: #16a34a;
      font-size: 13px;
    }
    
    .warranty-section {
      background: #eff6ff;
      border: 2px solid #93c5fd;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 12px;
    }
    
    .warranty-title {
      font-size: 12px;
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 8px;
    }
    
    .warranty-content {
      margin-bottom: 8px;
    }
    
    .warranty-content:last-child {
      margin-bottom: 0;
    }
    
    .warranty-lang {
      font-size: 10px;
      font-weight: 600;
      color: #1e3a8a;
      margin-bottom: 4px;
    }
    
    .warranty-main {
      font-size: 9px;
      color: #1e3a8a;
      margin-bottom: 4px;
      line-height: 1.4;
    }
    
    .warranty-detail {
      font-size: 8px;
      color: #1e40af;
      margin-bottom: 3px;
      line-height: 1.3;
    }
    
    .warranty-note {
      font-size: 8px;
      color: #1e40af;
      font-style: italic;
      margin-top: 4px;
    }
    
    .warranty-valid {
      font-size: 9px;
      color: #1e3a8a;
      font-weight: bold;
      margin-top: 6px;
    }
    
    .notes-box {
      background: #f9fafb;
      padding: 8px;
      border-radius: 3px;
      border: 1px solid #e5e7eb;
      font-size: 10px;
      color: #4b5563;
      line-height: 1.4;
    }
    
    .footer {
      text-align: center;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
    }
    
    .footer-main {
      font-size: 11px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 3px;
    }
    
    .footer-sub {
      font-size: 9px;
      color: #6b7280;
      margin: 2px 0;
    }
    
    .signatures {
      display: flex;
      justify-content: space-around;
      margin-top: 15px;
      gap: 20px;
    }
    
    .signature-box {
      flex: 1;
      text-align: center;
    }
    
    .signature-line {
      border-top: 2px solid #9ca3af;
      margin-bottom: 5px;
      margin-top: 30px;
    }
    
    .signature-label {
      font-size: 10px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    ${isPagado ? '<div class="watermark">PAGADO</div>' : ''}
    
    <!-- Encabezado -->
    <div class="receipt-header">
      <div class="header-left">
        <p class="store-name">${storeInfo.nombre}</p>
        <p class="store-subtitle">Reparación de Teléfonos</p>
        <p class="store-info">${storeInfo.ciudad}, ${storeInfo.estado}</p>
        <p class="store-info">Tel: ${storeInfo.telefono}</p>
      </div>
      <div class="header-right">
        <h1 class="receipt-title">RECIBO</h1>
        <p class="receipt-code">#${repair.codigo}</p>
        <p class="receipt-date">Fecha: ${formatDate(repair.fechaIngreso)}</p>
        ${isPagado ? '<div class="paid-badge">✓ PAGADO</div>' : ''}
      </div>
    </div>

    <!-- Información del Cliente -->
    <div class="section">
      <h2 class="section-title">Información del Cliente</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Cliente:</span>
          <span class="info-value">${repair.cliente || 'No especificado'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Teléfono:</span>
          <span class="info-value">${repair.telefono || 'No especificado'}</span>
        </div>
        <div class="info-item full-width">
          <span class="info-label">Dispositivo:</span>
          <span class="info-value">${repair.dispositivo}</span>
        </div>
      </div>
    </div>

    <!-- Descripción del Servicio -->
    <div class="section">
      <h2 class="section-title">Descripción del Servicio</h2>
      <div class="info-grid">
        <div class="info-item full-width">
          <span class="info-label">Problema Reportado:</span>
          <span class="info-value">${repair.problema}</span>
        </div>
        ${repair.diagnostico ? `
        <div class="info-item full-width">
          <span class="info-label">Diagnóstico:</span>
          <span class="info-value">${repair.diagnostico}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Resumen de Costos -->
    <div class="section">
      <h2 class="section-title">Resumen de Costos</h2>
      <table class="cost-table">
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Monto</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Subtotal (Servicio de Reparación)</td>
            <td class="amount">$${subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Tax (8.25%)</td>
            <td class="amount">$${taxAmount.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td>TOTAL A PAGAR</td>
            <td class="total-amount">$${totalConTax.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Garantía -->
    <div class="warranty-section">
      <h2 class="warranty-title">🛡️ WARRANTY / GARANTÍA</h2>
      
      <div class="warranty-content">
        <p class="warranty-lang">English:</p>
        <p class="warranty-main">
          <strong>60-Day Limited Warranty:</strong> We guarantee our repairs for 60 days from the date of service. This warranty covers defects in workmanship and parts used in the repair.
        </p>
        <p class="warranty-detail">
          <strong>What's Covered:</strong> Malfunctions directly related to the repair performed, defective replacement parts.
        </p>
        <p class="warranty-detail">
          <strong>What's NOT Covered:</strong> Physical damage (drops, liquid damage, cracks), normal wear and tear, unauthorized repairs or modifications, damage caused by misuse or neglect.
        </p>
        <p class="warranty-detail">
          <strong>Warranty Claim:</strong> To make a warranty claim, bring your device and this invoice to our store. We will inspect the device and, if the issue is covered, repair or replace the defective part at no charge.
        </p>
        <p class="warranty-note">This warranty is non-transferable and applies only to the original customer.</p>
      </div>

      <div class="warranty-content">
        <p class="warranty-lang">Español:</p>
        <p class="warranty-main">
          <strong>Garantía Limitada de 60 Días:</strong> Garantizamos nuestras reparaciones por 60 días desde la fecha del servicio. Esta garantía cubre defectos en la mano de obra y las partes utilizadas en la reparación.
        </p>
        <p class="warranty-detail">
          <strong>Qué Está Cubierto:</strong> Fallas directamente relacionadas con la reparación realizada, partes de reemplazo defectuosas.
        </p>
        <p class="warranty-detail">
          <strong>Qué NO Está Cubierto:</strong> Daños físicos (caídas, daño por líquido, grietas), desgaste normal, reparaciones o modificaciones no autorizadas, daños causados por mal uso o negligencia.
        </p>
        <p class="warranty-detail">
          <strong>Reclamación de Garantía:</strong> Para hacer una reclamación de garantía, traiga su dispositivo y esta factura a nuestra tienda. Inspeccionaremos el dispositivo y, si el problema está cubierto, repararemos o reemplazaremos la parte defectuosa sin cargo.
        </p>
        <p class="warranty-note">Esta garantía no es transferible y se aplica solo al cliente original.</p>
        <p class="warranty-valid">
          Válida hasta: ${formatDate(fechaGarantia)}
        </p>
      </div>
    </div>

    ${repair.notas ? `
    <!-- Notas -->
    <div class="section">
      <h2 class="section-title">Notas:</h2>
      <div class="notes-box">
        ${repair.notas}
      </div>
    </div>
    ` : ''}

    <!-- Pie de página -->
    <div class="footer">
      <p class="footer-main">
        Gracias por confiar en ${storeInfo.nombre}
      </p>
      <p class="footer-sub">
        Este documento es un comprobante de servicio
      </p>
      <p class="footer-sub">
        Para consultas o soporte, contáctenos al ${storeInfo.telefono}
      </p>
    </div>

    <!-- Firmas -->
    <div class="signatures">
      <div class="signature-box">
        <div class="signature-line"></div>
        <p class="signature-label">Firma del Cliente</p>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <p class="signature-label">Firma del Técnico</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
