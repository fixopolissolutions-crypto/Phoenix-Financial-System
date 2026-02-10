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
          top: 50,
          bottom: 50,
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

      // Marca de agua si está pagado
      if (isPagado) {
        doc.save();
        doc.rotate(45, { origin: [300, 400] });
        doc.fontSize(80)
           .fillColor('#22c55e', 0.1)
           .text('PAID / PAGADO', 150, 350, {
             width: 500,
             align: 'center'
           });
        doc.restore();
      }

      // Encabezado
      doc.fontSize(18)
         .fillColor('#1f2937')
         .text(storeInfo.nombre, { align: 'left' });
      
      doc.fontSize(10)
         .fillColor('#6b7280')
         .text('Phone Repair / Reparacion de Telefonos', { align: 'left' })
         .text(`${storeInfo.ciudad}, ${storeInfo.estado}`, { align: 'left' })
         .text(`Tel: ${storeInfo.telefono}`, { align: 'left' });

      // Título RECIBO (derecha)
      doc.fontSize(24)
         .fillColor('#1f2937')
         .text('RECEIPT / RECIBO', 350, 50, { align: 'right' });
      
      doc.fontSize(12)
         .fillColor('#6b7280')
         .text(`#${repair.codigo}`, 350, 80, { align: 'right' })
         .text(`Date / Fecha: ${formatDate(repair.fechaIngreso)}`, 350, 95, { align: 'right' });

      if (isPagado) {
        doc.fontSize(10)
           .fillColor('#ffffff')
           .rect(400, 115, 100, 20)
           .fill('#22c55e')
           .fillColor('#ffffff')
           .text('PAID / PAGADO', 405, 119);
      }

      doc.moveDown(3);

      // Línea separadora
      doc.moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke('#e5e7eb');

      doc.moveDown();

      // Información del Cliente
      doc.fontSize(12)
         .fillColor('#1f2937')
         .text('Customer Information / Informacion del Cliente', { underline: true });
      
      doc.moveDown(0.5);
      
      doc.fontSize(10)
         .fillColor('#4b5563')
         .text(`Customer / Cliente: `, { continued: true })
         .fillColor('#1f2937')
         .text(repair.cliente || 'Not specified / No especificado');
      
      doc.fillColor('#4b5563')
         .text(`Phone / Telefono: `, { continued: true })
         .fillColor('#1f2937')
         .text(repair.telefono || 'Not specified / No especificado');
      
      doc.fillColor('#4b5563')
         .text(`Device / Dispositivo: `, { continued: true })
         .fillColor('#1f2937')
         .text(repair.dispositivo);

      doc.moveDown();

      // Descripción del Servicio
      doc.fontSize(12)
         .fillColor('#1f2937')
         .text('Service Description / Descripcion del Servicio', { underline: true });
      
      doc.moveDown(0.5);
      
      doc.fontSize(10)
         .fillColor('#4b5563')
         .text(`Reported Problem / Problema Reportado: `, { continued: true })
         .fillColor('#1f2937')
         .text(repair.problema);
      
      if (repair.diagnostico) {
        doc.fillColor('#4b5563')
           .text(`Diagnosis / Diagnostico: `, { continued: true })
           .fillColor('#1f2937')
           .text(repair.diagnostico);
      }

      doc.moveDown();

      // Resumen de Costos
      doc.fontSize(12)
         .fillColor('#1f2937')
         .text('Cost Summary / Resumen de Costos', { underline: true });
      
      doc.moveDown(0.5);

      // Tabla de costos
      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 400;

      // Encabezado de tabla
      doc.rect(col1X, tableTop, 495, 20).fill('#f9fafb');
      doc.fontSize(10)
         .fillColor('#1f2937')
         .text('Concept / Concepto', col1X + 5, tableTop + 5)
         .text('Amount / Monto', col2X + 5, tableTop + 5);

      let currentY = tableTop + 25;

      // Subtotal
      doc.fontSize(10)
         .fillColor('#1f2937')
         .text('Subtotal (Repair Service / Servicio de Reparacion)', col1X + 5, currentY)
         .text(`$${subtotal.toFixed(2)}`, col2X + 5, currentY);
      
      currentY += 20;

      // Tax
      doc.text('Tax / Impuesto (8.25%)', col1X + 5, currentY)
         .text(`$${taxAmount.toFixed(2)}`, col2X + 5, currentY);
      
      currentY += 20;

      // Total
      doc.rect(col1X, currentY - 5, 495, 25).fill('#f9fafb');
      doc.fontSize(11)
         .fillColor('#1f2937')
         .text('TOTAL TO PAY / TOTAL A PAGAR', col1X + 5, currentY)
         .fontSize(13)
         .fillColor('#16a34a')
         .text(`$${totalConTax.toFixed(2)}`, col2X + 5, currentY);

      doc.moveDown(2);

      // Garantía
      const warrantyTop = doc.y;
      doc.rect(50, warrantyTop, 495, 150)
         .fillAndStroke('#eff6ff', '#93c5fd');

      doc.fontSize(12)
         .fillColor('#1e40af')
         .text('WARRANTY / GARANTIA', 60, warrantyTop + 10);

      doc.fontSize(9)
         .fillColor('#1e3a8a')
         .text('English:', 60, warrantyTop + 30)
         .fontSize(8)
         .text('60-Day Limited Warranty: We guarantee our repairs for 60 days from the date of service.', 60, warrantyTop + 45, {
           width: 475,
           align: 'left'
         })
         .text('What\'s Covered: Malfunctions directly related to the repair performed.', 60, warrantyTop + 60, {
           width: 475
         })
         .text('What\'s NOT Covered: Physical damage, normal wear and tear, unauthorized repairs.', 60, warrantyTop + 72, {
           width: 475
         });

      doc.fontSize(9)
         .fillColor('#1e3a8a')
         .text('Espanol:', 60, warrantyTop + 90)
         .fontSize(8)
         .text('Garantia Limitada de 60 Dias: Garantizamos nuestras reparaciones por 60 dias.', 60, warrantyTop + 105, {
           width: 475
         })
         .text('Que Esta Cubierto: Fallas directamente relacionadas con la reparacion realizada.', 60, warrantyTop + 117, {
           width: 475
         })
         .text('Que NO Esta Cubierto: Danos fisicos, desgaste normal, reparaciones no autorizadas.', 60, warrantyTop + 129, {
           width: 475
         });

      doc.fontSize(9)
         .fillColor('#1e3a8a')
         .text(`Valid until / Valida hasta: ${formatDate(fechaGarantia)}`, 60, warrantyTop + 145);

      doc.moveDown(4);

      // Notas
      if (repair.notas) {
        doc.fontSize(12)
           .fillColor('#1f2937')
           .text('Notes / Notas:', { underline: true });
        
        doc.moveDown(0.5);
        
        doc.fontSize(10)
           .fillColor('#4b5563')
           .text(repair.notas, {
             width: 495
           });
        
        doc.moveDown();
      }

      // Pie de página
      doc.moveDown(2);
      
      doc.fontSize(11)
         .fillColor('#1f2937')
         .text(`Thank you for trusting ${storeInfo.nombre}`, { align: 'center' })
         .text(`Gracias por confiar en ${storeInfo.nombre}`, { align: 'center' });
      
      doc.moveDown(0.5);
      
      doc.fontSize(9)
         .fillColor('#6b7280')
         .text('This document is a proof of service / Este documento es un comprobante de servicio', { align: 'center' })
         .text(`For inquiries or support, contact us at / Para consultas o soporte, contactenos al ${storeInfo.telefono}`, { align: 'center' });

      // Firmas
      doc.moveDown(2);
      
      const signatureY = doc.y;
      
      // Firma del cliente
      doc.moveTo(100, signatureY)
         .lineTo(250, signatureY)
         .stroke('#9ca3af');
      
      doc.fontSize(9)
         .fillColor('#6b7280')
         .text('Customer Signature / Firma del Cliente', 100, signatureY + 5, {
           width: 150,
           align: 'center'
         });

      // Firma del técnico
      doc.moveTo(345, signatureY)
         .lineTo(495, signatureY)
         .stroke('#9ca3af');
      
      doc.text('Technician Signature / Firma del Tecnico', 345, signatureY + 5, {
        width: 150,
        align: 'center'
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
