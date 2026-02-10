import PDFDocument from 'pdfkit';
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

export function generateReceiptPDF(repair: any, storeInfo: StoreConfig): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 40,
          bottom: 40,
          left: 50,
          right: 50
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const isPagado = repair.pagado === 1;
      
      // Calcular fecha de garantía (60 días)
      const fechaGarantia = new Date(repair.fechaIngreso);
      fechaGarantia.setDate(fechaGarantia.getDate() + 60);
      
      // Calcular subtotal y taxes
      const subtotal = Number(repair.precioTotal);
      const taxRate = 0.0825;
      const taxAmount = subtotal * taxRate;
      const totalConTax = subtotal + taxAmount;
      
      // Formatear fecha
      const formatDate = (date: Date | string) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric'
        });
      };

      // Marca de agua si está pagado
      if (isPagado) {
        doc.save();
        doc.rotate(45, { origin: [300, 400] });
        doc.fontSize(70)
           .fillColor('#22c55e', 0.08)
           .text('PAID / PAGADO', 150, 350, {
             width: 500,
             align: 'center'
           });
        doc.restore();
      }

      // ==================== ENCABEZADO MODERNO ====================
      
      // Barra superior con color de marca
      doc.rect(0, 0, 595, 8)
         .fill('#3b82f6');

      // Logo/Icono (círculo con inicial)
      doc.circle(70, 50, 20)
         .fill('#3b82f6');
      
      doc.fontSize(16)
         .fillColor('#ffffff')
         .text(storeInfo.nombre.charAt(0), 63, 42);

      // Información de la tienda (izquierda)
      doc.fontSize(14)
         .fillColor('#1f2937')
         .text(storeInfo.nombre, 100, 35);
      
      doc.fontSize(8)
         .fillColor('#6b7280')
         .text('Phone Repair / Reparacion de Telefonos', 100, 52)
         .text(`${storeInfo.ciudad}, ${storeInfo.estado} | ${storeInfo.telefono}`, 100, 62);

      // Título RECEIPT (derecha) - más pequeño
      doc.fontSize(16)
         .fillColor('#1f2937')
         .text('RECEIPT / RECIBO', 350, 35, { align: 'right' });
      
      doc.fontSize(9)
         .fillColor('#6b7280')
         .text(`#${repair.codigo}`, 350, 53, { align: 'right' })
         .text(`${formatDate(repair.fechaIngreso)}`, 350, 64, { align: 'right' });

      // Badge de estado pagado
      if (isPagado) {
        doc.fontSize(8)
           .fillColor('#ffffff')
           .rect(470, 35, 75, 16)
           .fill('#22c55e')
           .fillColor('#ffffff')
           .text('PAID / PAGADO', 475, 39, { width: 65, align: 'center' });
      }

      doc.moveDown(2);

      // Línea separadora elegante
      doc.moveTo(50, 85)
         .lineTo(545, 85)
         .lineWidth(0.5)
         .strokeColor('#e5e7eb')
         .stroke();

      doc.y = 95;

      // ==================== INFORMACIÓN DEL CLIENTE ====================
      
      // Sección con fondo sutil
      const clientTop = doc.y;
      doc.rect(50, clientTop, 495, 50)
         .fill('#f9fafb');

      doc.fontSize(10)
         .fillColor('#3b82f6')
         .text('CUSTOMER INFO / INFO DEL CLIENTE', 60, clientTop + 8);
      
      doc.fontSize(8.5)
         .fillColor('#4b5563')
         .text('Name / Nombre:', 60, clientTop + 23)
         .fillColor('#1f2937')
         .text(repair.cliente || 'N/A', 140, clientTop + 23);
      
      doc.fillColor('#4b5563')
         .text('Phone / Tel:', 60, clientTop + 35)
         .fillColor('#1f2937')
         .text(repair.telefono || 'N/A', 140, clientTop + 35);
      
      doc.fillColor('#4b5563')
         .text('Device / Dispositivo:', 300, clientTop + 23)
         .fillColor('#1f2937')
         .text(repair.dispositivo, 400, clientTop + 23);

      doc.y = clientTop + 55;

      // ==================== SERVICIO ====================
      
      doc.fontSize(10)
         .fillColor('#3b82f6')
         .text('SERVICE / SERVICIO', 50);
      
      doc.moveDown(0.3);
      
      doc.fontSize(8.5)
         .fillColor('#4b5563')
         .text('Problem / Problema: ', { continued: true })
         .fillColor('#1f2937')
         .text(repair.problema);
      
      if (repair.diagnostico) {
        doc.fillColor('#4b5563')
           .text('Diagnosis / Diagnostico: ', { continued: true })
           .fillColor('#1f2937')
           .text(repair.diagnostico);
      }

      doc.moveDown(0.8);

      // ==================== COSTOS ====================
      
      doc.fontSize(10)
         .fillColor('#3b82f6')
         .text('COST BREAKDOWN / DESGLOSE DE COSTOS', 50);
      
      doc.moveDown(0.3);

      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 450;

      // Encabezado
      doc.rect(col1X, tableTop, 495, 18).fill('#f9fafb');
      doc.fontSize(8.5)
         .fillColor('#4b5563')
         .text('Description / Descripcion', col1X + 8, tableTop + 5)
         .text('Amount / Monto', col2X, tableTop + 5);

      let currentY = tableTop + 23;

      // Subtotal
      doc.fontSize(8.5)
         .fillColor('#1f2937')
         .text('Repair Service / Servicio de Reparacion', col1X + 8, currentY)
         .text(`$${subtotal.toFixed(2)}`, col2X, currentY);
      
      currentY += 15;

      // Tax
      doc.fillColor('#6b7280')
         .text('Tax / Impuesto (8.25%)', col1X + 8, currentY)
         .text(`$${taxAmount.toFixed(2)}`, col2X, currentY);
      
      currentY += 18;

      // Total con fondo
      doc.rect(col1X, currentY - 3, 495, 20).fill('#3b82f6');
      doc.fontSize(10)
         .fillColor('#ffffff')
         .text('TOTAL TO PAY / TOTAL A PAGAR', col1X + 8, currentY)
         .fontSize(11)
         .fillColor('#ffffff')
         .text(`$${totalConTax.toFixed(2)}`, col2X, currentY);

      doc.y = currentY + 25;

      // ==================== GARANTÍA COMPACTA ====================
      
      const warrantyTop = doc.y;
      doc.rect(50, warrantyTop, 495, 95)
         .fillAndStroke('#eff6ff', '#93c5fd');

      doc.fontSize(9)
         .fillColor('#1e40af')
         .text('WARRANTY / GARANTIA (60 Days / Dias)', 60, warrantyTop + 8);

      doc.fontSize(7.5)
         .fillColor('#1e3a8a')
         .text('English: ', 60, warrantyTop + 22, { continued: true })
         .text('We guarantee repairs for 60 days. Covers malfunctions related to the repair. Does NOT cover physical damage or unauthorized repairs.', {
           width: 475
         });

      doc.fontSize(7.5)
         .fillColor('#1e3a8a')
         .text('Espanol: ', 60, warrantyTop + 50, { continued: true })
         .text('Garantizamos reparaciones por 60 dias. Cubre fallas relacionadas con la reparacion. NO cubre danos fisicos o reparaciones no autorizadas.', {
           width: 475
         });

      doc.fontSize(7.5)
         .fillColor('#1e3a8a')
         .text(`Valid until / Valida hasta: ${formatDate(fechaGarantia)}`, 60, warrantyTop + 78);

      doc.y = warrantyTop + 100;

      // ==================== NOTAS ====================
      
      if (repair.notas) {
        doc.fontSize(9)
           .fillColor('#3b82f6')
           .text('NOTES / NOTAS', 50);
        
        doc.moveDown(0.3);
        
        doc.fontSize(8)
           .fillColor('#4b5563')
           .text(repair.notas, {
             width: 495
           });
        
        doc.moveDown(0.5);
      }

      // ==================== PIE DE PÁGINA ====================
      
      doc.moveDown(0.8);
      
      // Mensaje de agradecimiento
      doc.fontSize(9)
         .fillColor('#1f2937')
         .text(`Thank you for trusting ${storeInfo.nombre}`, { align: 'center' })
         .text(`Gracias por confiar en ${storeInfo.nombre}`, { align: 'center' });
      
      doc.moveDown(0.3);
      
      doc.fontSize(7.5)
         .fillColor('#6b7280')
         .text('This document is proof of service / Este documento es comprobante de servicio', { align: 'center' })
         .text(`Contact / Contacto: ${storeInfo.telefono} | ${storeInfo.email}`, { align: 'center' });

      // ==================== FIRMAS ====================
      
      doc.moveDown(1.2);
      
      const signatureY = doc.y;
      
      // Firma del cliente
      doc.moveTo(80, signatureY)
         .lineTo(250, signatureY)
         .lineWidth(0.5)
         .strokeColor('#9ca3af')
         .stroke();
      
      doc.fontSize(7.5)
         .fillColor('#6b7280')
         .text('Customer Signature / Firma del Cliente', 80, signatureY + 5, {
           width: 170,
           align: 'center'
         });

      // Firma del técnico
      doc.moveTo(345, signatureY)
         .lineTo(515, signatureY)
         .lineWidth(0.5)
         .strokeColor('#9ca3af')
         .stroke();
      
      doc.text('Technician Signature / Firma del Tecnico', 345, signatureY + 5, {
        width: 170,
        align: 'center'
      });

      // Barra inferior con color de marca
      doc.rect(0, 792, 595, 5)
         .fill('#3b82f6');

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
