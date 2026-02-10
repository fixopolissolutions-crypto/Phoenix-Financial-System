import { Button } from '@/components/ui/button';
import React from 'react';
import { Printer } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface FacturaReparacionProps {
  repair: any;
}

export function FacturaReparacion({ repair }: FacturaReparacionProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false);
  const generatePDFMutation = trpc.repairs.generatePDF.useMutation();

  const handlePrint = async () => {
    try {
      setIsGeneratingPDF(true);
      const result = await generatePDFMutation.mutateAsync({ repairId: repair.id });
      
      // Convertir base64 a blob
      const byteCharacters = atob(result.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor intenta de nuevo.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Obtener información de la tienda
  const { data: storeInfo } = trpc.storeConfig.get.useQuery({
    tienda: repair.tienda || 'admin',
  });

  // Calcular fecha de vencimiento de garantía (60 días)
  const fechaGarantia = new Date(repair.fechaIngreso);
  fechaGarantia.setDate(fechaGarantia.getDate() + 60);

  const isPagado = repair.pagado === 1;

  // Calcular subtotal y taxes
  const subtotal = Number(repair.precioTotal);
  const taxRate = 0.0825; // 8.25% tax rate
  const taxAmount = subtotal * taxRate;
  const totalConTax = subtotal + taxAmount;

  return (
    <>
      <div className="receipt-container">
        {/* Botón de descargar PDF (no se imprime) */}
        <div className="flex justify-end mb-4 no-print">
          <Button 
            onClick={handlePrint} 
            disabled={isGeneratingPDF}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {isGeneratingPDF ? 'Generando PDF...' : 'Descargar Recibo PDF'}
          </Button>
        </div>

        {/* Contenido del recibo */}
        <div className="receipt-content">
          {/* Sello de agua PAGADO (solo si está pagado) */}
          {isPagado && (
            <div className="watermark">
              <div className="watermark-text">PAGADO</div>
            </div>
          )}

          {/* Contenido principal */}
          <div className="receipt-body">
            {/* Encabezado */}
            <div className="receipt-header">
              <div className="header-left">
                <img 
                  src="/logo-1plusphonefix.png" 
                  alt="1+PhoneFix" 
                  className="logo"
                />
                <p className="store-name">{storeInfo?.nombre || '1+PhoneFix'}</p>
                <p className="store-subtitle">Reparación de Teléfonos</p>
                <p className="store-info">{storeInfo?.ciudad || 'Austin'}, {storeInfo?.estado || 'TX'}</p>
                <p className="store-info">Tel: {storeInfo?.telefono || '(512) XXX-XXXX'}</p>
              </div>
              <div className="header-right">
                <h1 className="receipt-title">RECIBO</h1>
                <p className="receipt-code">#{repair.codigo}</p>
                <p className="receipt-date">
                  Fecha: {new Date(repair.fechaIngreso).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
                {isPagado && (
                  <div className="paid-badge">
                    ✓ PAGADO
                  </div>
                )}
              </div>
            </div>

            {/* Información del Cliente */}
            <div className="section">
              <h2 className="section-title">Información del Cliente</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Cliente:</span>
                  <span className="info-value">{repair.cliente || 'No especificado'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Teléfono:</span>
                  <span className="info-value">{repair.telefono || 'No especificado'}</span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">Dispositivo:</span>
                  <span className="info-value">{repair.dispositivo}</span>
                </div>
              </div>
            </div>

            {/* Descripción del Servicio */}
            <div className="section">
              <h2 className="section-title">Descripción del Servicio</h2>
              <div className="service-description">
                <p className="service-label">Problema Reportado:</p>
                <p className="service-text">{repair.problema}</p>
              </div>
              {repair.diagnostico && (
                <div className="service-description">
                  <p className="service-label">Diagnóstico:</p>
                  <p className="service-text">{repair.diagnostico}</p>
                </div>
              )}
            </div>

            {/* Resumen de Costos */}
            <div className="section">
              <h2 className="section-title">Resumen de Costos</h2>
              <table className="cost-table">
                <thead>
                  <tr>
                    <th>Concepto</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Subtotal (Servicio de Reparación)</td>
                    <td className="amount">${subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Tax (8.25%)</td>
                    <td className="amount">${taxAmount.toFixed(2)}</td>
                  </tr>
                  <tr className="total-row">
                    <td>TOTAL A PAGAR</td>
                    <td className="total-amount">${totalConTax.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Garantía */}
            <div className="warranty-section">
              <h2 className="warranty-title">🛡️ WARRANTY / GARANTÍA</h2>
              
              <div className="warranty-content">
                <p className="warranty-lang">English:</p>
                <p className="warranty-main">
                  <strong>60-Day Limited Warranty:</strong> We guarantee our repairs for 60 days from the date of service. This warranty covers defects in workmanship and parts used in the repair.
                </p>
                <p className="warranty-detail">
                  <strong>What's Covered:</strong> Malfunctions directly related to the repair performed, defective replacement parts.
                </p>
                <p className="warranty-detail">
                  <strong>What's NOT Covered:</strong> Physical damage (drops, liquid damage, cracks), normal wear and tear, unauthorized repairs or modifications, damage caused by misuse or neglect.
                </p>
                <p className="warranty-detail">
                  <strong>Warranty Claim:</strong> To make a warranty claim, bring your device and this invoice to our store. We will inspect the device and, if the issue is covered, repair or replace the defective part at no charge.
                </p>
                <p className="warranty-note">This warranty is non-transferable and applies only to the original customer.</p>
              </div>

              <div className="warranty-content">
                <p className="warranty-lang">Español:</p>
                <p className="warranty-main">
                  <strong>Garantía Limitada de 60 Días:</strong> Garantizamos nuestras reparaciones por 60 días desde la fecha del servicio. Esta garantía cubre defectos en la mano de obra y las partes utilizadas en la reparación.
                </p>
                <p className="warranty-detail">
                  <strong>Qué Está Cubierto:</strong> Fallas directamente relacionadas con la reparación realizada, partes de reemplazo defectuosas.
                </p>
                <p className="warranty-detail">
                  <strong>Qué NO Está Cubierto:</strong> Daños físicos (caídas, daño por líquido, grietas), desgaste normal, reparaciones o modificaciones no autorizadas, daños causados por mal uso o negligencia.
                </p>
                <p className="warranty-detail">
                  <strong>Reclamación de Garantía:</strong> Para hacer una reclamación de garantía, traiga su dispositivo y esta factura a nuestra tienda. Inspeccionaremos el dispositivo y, si el problema está cubierto, repararemos o reemplazaremos la parte defectuosa sin cargo.
                </p>
                <p className="warranty-note">Esta garantía no es transferible y se aplica solo al cliente original.</p>
                <p className="warranty-valid">
                  Válida hasta: {fechaGarantia.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Notas */}
            {repair.notas && (
              <div className="section">
                <h2 className="section-title">Notas:</h2>
                <div className="notes-box">
                  {repair.notas}
                </div>
              </div>
            )}

            {/* Pie de página */}
            <div className="footer">
              <p className="footer-main">
                Gracias por confiar en {storeInfo?.nombre || '1+PhoneFix'}
              </p>
              <p className="footer-sub">
                Este documento es un comprobante de servicio
              </p>
              <p className="footer-sub">
                Para consultas o soporte, contáctenos al {storeInfo?.telefono || '(512) XXX-XXXX'}
              </p>
            </div>

            {/* Firmas */}
            <div className="signatures">
              <div className="signature-box">
                <div className="signature-line"></div>
                <p className="signature-label">Firma del Cliente</p>
              </div>
              <div className="signature-box">
                <div className="signature-line"></div>
                <p className="signature-label">Firma del Técnico</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos */}
      <style>{`
        .receipt-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }

        .receipt-content {
          background: white;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          position: relative;
          padding: 40px;
        }

        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          opacity: 0.1;
          pointer-events: none;
          z-index: 1;
        }

        .watermark-text {
          font-size: 120px;
          font-weight: bold;
          color: #22c55e;
        }

        .receipt-body {
          position: relative;
          z-index: 2;
        }

        .receipt-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }

        .header-left .logo {
          height: 60px;
          margin-bottom: 10px;
        }

        .store-name {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 5px 0;
        }

        .store-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 2px 0;
        }

        .store-info {
          font-size: 13px;
          color: #6b7280;
          margin: 2px 0;
        }

        .header-right {
          text-align: right;
        }

        .receipt-title {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
          margin: 0 0 8px 0;
        }

        .receipt-code {
          font-size: 18px;
          font-weight: 600;
          color: #4b5563;
          margin: 5px 0;
        }

        .receipt-date {
          font-size: 13px;
          color: #6b7280;
          margin: 8px 0;
        }

        .paid-badge {
          display: inline-block;
          background: #dcfce7;
          color: #166534;
          padding: 6px 12px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 13px;
          margin-top: 8px;
        }

        .section {
          margin-bottom: 25px;
        }

        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-item.full-width {
          grid-column: 1 / -1;
        }

        .info-label {
          font-size: 13px;
          color: #6b7280;
        }

        .info-value {
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
        }

        .service-description {
          margin-bottom: 15px;
        }

        .service-label {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .service-text {
          font-size: 14px;
          color: #1f2937;
          line-height: 1.5;
        }

        .cost-table {
          width: 100%;
          border-collapse: collapse;
        }

        .cost-table th {
          background: #f3f4f6;
          padding: 10px;
          text-align: left;
          font-size: 13px;
          font-weight: 600;
          color: #4b5563;
          border: 1px solid #e5e7eb;
        }

        .cost-table th:last-child {
          text-align: right;
        }

        .cost-table td {
          padding: 10px;
          font-size: 14px;
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
          font-size: 15px;
        }

        .cost-table .total-amount {
          text-align: right;
          color: #16a34a;
          font-size: 18px;
        }

        .warranty-section {
          background: #eff6ff;
          border: 2px solid #93c5fd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 25px;
        }

        .warranty-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 15px;
        }

        .warranty-content {
          margin-bottom: 15px;
        }

        .warranty-content:last-child {
          margin-bottom: 0;
        }

        .warranty-lang {
          font-size: 15px;
          font-weight: 600;
          color: #1e3a8a;
          margin-bottom: 8px;
        }

        .warranty-main {
          font-size: 13px;
          color: #1e3a8a;
          margin-bottom: 8px;
          line-height: 1.5;
        }

        .warranty-detail {
          font-size: 11px;
          color: #1e40af;
          margin-bottom: 5px;
          line-height: 1.4;
        }

        .warranty-note {
          font-size: 11px;
          color: #1e40af;
          font-style: italic;
          margin-top: 8px;
        }

        .warranty-valid {
          font-size: 13px;
          color: #1e3a8a;
          font-weight: bold;
          margin-top: 10px;
        }

        .notes-box {
          background: #f9fafb;
          padding: 15px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
          font-size: 13px;
          color: #4b5563;
          line-height: 1.5;
        }

        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }

        .footer-main {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 5px;
        }

        .footer-sub {
          font-size: 12px;
          color: #9ca3af;
          margin: 3px 0;
        }

        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
          gap: 40px;
        }

        .signature-box {
          flex: 1;
        }

        .signature-line {
          border-top: 2px solid #9ca3af;
          margin-bottom: 8px;
        }

        .signature-label {
          text-align: center;
          font-size: 13px;
          color: #6b7280;
        }

        /* Estilos de impresión */
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }

          .receipt-container {
            max-width: 100%;
            padding: 0;
            margin: 0;
          }

          .receipt-content {
            box-shadow: none;
            padding: 15mm;
          }

          .no-print {
            display: none !important;
          }

          @page {
            size: A4;
            margin: 10mm;
          }

          /* Reducir tamaños de fuente para impresión */
          .receipt-title {
            font-size: 24px !important;
          }

          .section-title {
            font-size: 14px !important;
            margin-bottom: 10px !important;
          }

          .warranty-title {
            font-size: 14px !important;
            margin-bottom: 10px !important;
          }

          .warranty-main {
            font-size: 10px !important;
            margin-bottom: 5px !important;
          }

          .warranty-detail {
            font-size: 9px !important;
            margin-bottom: 3px !important;
          }

          .warranty-note {
            font-size: 9px !important;
            margin-top: 5px !important;
          }

          .warranty-section {
            padding: 12px !important;
            margin-bottom: 15px !important;
          }

          .warranty-content {
            margin-bottom: 10px !important;
          }

          .section {
            margin-bottom: 15px !important;
          }

          .footer {
            margin-top: 15px !important;
          }

          .signatures {
            margin-top: 20px !important;
          }

          /* Evitar saltos de página innecesarios */
          .receipt-header {
            page-break-after: avoid;
          }

          .cost-table {
            page-break-inside: avoid;
          }

          .signatures {
            page-break-before: avoid;
          }
        }

        @media screen and (max-width: 768px) {
          .receipt-container {
            padding: 10px;
          }

          .receipt-content {
            padding: 20px;
          }

          .receipt-header {
            flex-direction: column;
            gap: 20px;
          }

          .header-right {
            text-align: left;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .signatures {
            flex-direction: column;
            gap: 30px;
          }
        }
      `}</style>
    </>
  );
}
