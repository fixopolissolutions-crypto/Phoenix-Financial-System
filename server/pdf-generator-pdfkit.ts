import PDFDocument from 'pdfkit';
import type { Repair } from "../drizzle/schema";
import * as fs from 'fs';
import * as path from 'path';

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

      // Marca de agua si está pagado (en gris claro)
      if (isPagado) {
        doc.save();
        doc.rotate(45, { origin: [300, 400] });
        doc.fontSize(70)
           .fillColor('#000000', 0.05)
           .text('PAID / PAGADO', 150, 350, {
             width: 500,
             align: 'center'
           });
        doc.restore();
      }

      // ==================== ENCABEZADO ====================
      
      // Línea superior negra
      doc.rect(0, 0, 595, 3)
         .fill('#000000');

      // Logo de 1+PhoneFix
      try {
        const logoPath = path.join(__dirname, '../client/public/1plusphonefix-logo.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 25, { width: 100 });
        }
      } catch (error) {
        console.log('Logo no encontrado, usando texto');
      }

      // Información de la tienda (izquierda)
      doc.fontSize(12)
         .fillColor('#000000')
         .text(storeInfo.nombre, 50, 50);
      
      doc.fontSize(8)
         .fillColor('#333333')
         .text('Phone Repair / Reparacion de Telefonos', 50, 65)
         .text(`${storeInfo.ciudad}, ${storeInfo.estado} | ${storeInfo.telefono}`, 50, 75);

      // Título RECEIPT (derecha)
      doc.fontSize(18)
         .fillColor('#000000')
         .text('RECEIPT / RECIBO', 350, 35, { align: 'right' });
      
      doc.fontSize(9)
         .fillColor('#666666')
         .text(`#${repair.codigo}`, 350, 55, { align: 'right' })
         .text(`${formatDate(repair.fechaIngreso)}`, 350, 66, { align: 'right' });

      // Badge de estado pagado (solo borde negro)
      if (isPagado) {
        doc.rect(470, 35, 75, 16)
           .lineWidth(1.5)
           .strokeColor('#000000')
           .stroke();
        
        doc.fontSize(8)
           .fillColor('#000000')
           .text('PAID / PAGADO', 475, 39, { width: 65, align: 'center' });
      }

      doc.moveDown(2);

      // Línea separadora
      doc.moveTo(50, 90)
         .lineTo(545, 90)
         .lineWidth(1)
         .strokeColor('#000000')
         .stroke();

      doc.y = 100;

      // ==================== INFORMACIÓN DEL CLIENTE ====================
      
      // Sección con borde
      const clientTop = doc.y;
      doc.rect(50, clientTop, 495, 50)
         .lineWidth(0.5)
         .strokeColor('#000000')
         .stroke();

      doc.fontSize(10)
         .fillColor('#000000')
         .text('CUSTOMER INFO / INFO DEL CLIENTE', 60, clientTop + 8);
      
      doc.fontSize(8.5)
         .fillColor('#333333')
         .text('Name / Nombre:', 60, clientTop + 23)
         .fillColor('#000000')
         .text(repair.cliente || 'N/A', 140, clientTop + 23);
      
      doc.fillColor('#333333')
         .text('Phone / Tel:', 60, clientTop + 35)
         .fillColor('#000000')
         .text(repair.telefono || 'N/A', 140, clientTop + 35);
      
      doc.fillColor('#333333')
         .text('Device / Dispositivo:', 300, clientTop + 23)
         .fillColor('#000000')
         .text(repair.dispositivo, 400, clientTop + 23);

      doc.y = clientTop + 55;

      // ==================== SERVICIO ====================
      
      doc.fontSize(10)
         .fillColor('#000000')
         .text('SERVICE / SERVICIO', 50);
      
      doc.moveDown(0.3);
      
      doc.fontSize(8.5)
         .fillColor('#333333')
         .text('Problem / Problema: ', { continued: true })
         .fillColor('#000000')
         .text(repair.problema);
      
      if (repair.diagnostico) {
        doc.fillColor('#333333')
           .text('Diagnosis / Diagnostico: ', { continued: true })
           .fillColor('#000000')
           .text(repair.diagnostico);
      }

      doc.moveDown(0.8);

      // ==================== COSTOS ====================
      
      doc.fontSize(10)
         .fillColor('#000000')
         .text('COST BREAKDOWN / DESGLOSE DE COSTOS', 50);
      
      doc.moveDown(0.3);

      const tableTop = doc.y;
      const col1X = 50;
      const col2X = 450;

      // Encabezado con fondo gris claro
      doc.rect(col1X, tableTop, 495, 18)
         .fill('#f0f0f0');
      
      doc.fontSize(8.5)
         .fillColor('#000000')
         .text('Description / Descripcion', col1X + 8, tableTop + 5)
         .text('Amount / Monto', col2X, tableTop + 5);

      let currentY = tableTop + 23;

      // Línea
      doc.moveTo(col1X, currentY - 3)
         .lineTo(col1X + 495, currentY - 3)
         .lineWidth(0.5)
         .strokeColor('#cccccc')
         .stroke();

      // Subtotal
      doc.fontSize(8.5)
         .fillColor('#000000')
         .text('Repair Service / Servicio de Reparacion', col1X + 8, currentY)
         .text(`$${subtotal.toFixed(2)}`, col2X, currentY);
      
      currentY += 15;

      // Tax
      doc.fillColor('#333333')
         .text('Tax / Impuesto (8.25%)', col1X + 8, currentY)
         .text(`$${taxAmount.toFixed(2)}`, col2X, currentY);
      
      currentY += 18;

      // Total con fondo negro y texto blanco
      doc.rect(col1X, currentY - 3, 495, 20)
         .fill('#000000');
      
      doc.fontSize(10)
         .fillColor('#ffffff')
         .text('TOTAL TO PAY / TOTAL A PAGAR', col1X + 8, currentY)
         .fontSize(11)
         .fillColor('#ffffff')
         .text(`$${totalConTax.toFixed(2)}`, col2X, currentY);

      doc.y = currentY + 25;

      // ==================== GARANTÍA COMPACTA ====================
      
      const warrantyTop = doc.y;
      doc.rect(50, warrantyTop, 495, 85)
         .lineWidth(1)
         .strokeColor('#000000')
         .stroke();

      doc.fontSize(9)
         .fillColor('#000000')
         .text('WARRANTY / GARANTIA (60 Days / Dias)', 60, warrantyTop + 8);

      doc.fontSize(7.5)
         .fillColor('#000000')
         .text('English: ', 60, warrantyTop + 22, { continued: true })
         .text('We guarantee repairs for 60 days. Covers malfunctions related to the repair. Does NOT cover physical damage or unauthorized repairs.', {
           width: 475
         });

      doc.fontSize(7.5)
         .fillColor('#000000')
         .text('Espanol: ', 60, warrantyTop + 45, { continued: true })
         .text('Garantizamos reparaciones por 60 dias. Cubre fallas relacionadas con la reparacion. NO cubre danos fisicos o reparaciones no autorizadas.', {
           width: 475
         });

      doc.fontSize(7.5)
         .fillColor('#000000')
         .text(`Valid until / Valida hasta: ${formatDate(fechaGarantia)}`, 60, warrantyTop + 68);

      doc.y = warrantyTop + 90;

      // ==================== NOTAS ====================
      
      if (repair.notas) {
        doc.fontSize(9)
           .fillColor('#000000')
           .text('NOTES / NOTAS', 50);
        
        doc.moveDown(0.3);
        
        doc.fontSize(8)
           .fillColor('#333333')
           .text(repair.notas, {
             width: 495
           });
        
        doc.moveDown(0.5);
      }

      // ==================== PIE DE PÁGINA ====================
      
      doc.moveDown(0.8);
      
      // Mensaje de agradecimiento
      doc.fontSize(9)
         .fillColor('#000000')
         .text(`Thank you for trusting ${storeInfo.nombre}`, { align: 'center' })
         .text(`Gracias por confiar en ${storeInfo.nombre}`, { align: 'center' });
      
      doc.moveDown(0.3);
      
      doc.fontSize(7.5)
         .fillColor('#666666')
         .text('This document is proof of service / Este documento es comprobante de servicio', { align: 'center' })
         .text(`Contact / Contacto: ${storeInfo.telefono} | ${storeInfo.email}`, { align: 'center' });

      // ==================== FIRMAS ====================
      
      doc.moveDown(1.2);
      
      const signatureY = doc.y;
      
      // Firma del cliente
      doc.moveTo(80, signatureY)
         .lineTo(250, signatureY)
         .lineWidth(0.5)
         .strokeColor('#000000')
         .stroke();
      
      doc.fontSize(7.5)
         .fillColor('#666666')
         .text('Customer Signature / Firma del Cliente', 80, signatureY + 5, {
           width: 170,
           align: 'center'
         });

      // Firma del técnico
      doc.moveTo(345, signatureY)
         .lineTo(515, signatureY)
         .lineWidth(0.5)
         .strokeColor('#000000')
         .stroke();
      
      doc.text('Technician Signature / Firma del Tecnico', 345, signatureY + 5, {
        width: 170,
        align: 'center'
      });

      // Línea inferior negra
      doc.rect(0, 792, 595, 3)
         .fill('#000000');

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
