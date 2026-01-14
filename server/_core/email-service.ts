/**
 * Email Service - Envío de reportes semanales por correo
 */

import nodemailer from 'nodemailer';
import * as fs from 'fs';

interface EmailOptions {
  to: string;
  tienda: string;
  weekStart: string;
  weekEnd: string;
  pdfPath: string;
}

/**
 * Crea el transportador de email
 * Usa variables de entorno para configuración
 */
function createTransporter() {
  // Configuración por defecto (Gmail)
  // Para usar otro proveedor, ajustar las variables de entorno
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
  };
  
  if (!config.auth.user || !config.auth.pass) {
    throw new Error('Configuración de email no encontrada. Define SMTP_USER y SMTP_PASSWORD en variables de entorno.');
  }
  
  return nodemailer.createTransporter(config);
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

/**
 * Envía el reporte semanal por email
 */
export async function sendWeeklyReportEmail(options: EmailOptions): Promise<void> {
  try {
    const transporter = createTransporter();
    
    // Verificar que el archivo PDF existe
    if (!fs.existsSync(options.pdfPath)) {
      throw new Error(`Archivo PDF no encontrado: ${options.pdfPath}`);
    }
    
    // Parsear múltiples emails (separados por comas)
    const emailList = options.to
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0)
      .join(', ');
    
    // Configurar el email
    const mailOptions = {
      from: `"Phoenix Financial System" <${process.env.SMTP_USER}>`,
      to: emailList,
      subject: `📊 Reporte Semanal - ${options.tienda} (${options.weekStart} a ${options.weekEnd})`,
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .info-box {
              background: white;
              padding: 20px;
              border-radius: 6px;
              margin: 20px 0;
              border-left: 4px solid #3b82f6;
            }
            .info-box strong {
              color: #1e40af;
            }
            .button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              color: #64748b;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Reporte Semanal Disponible</h1>
          </div>
          
          <div class="content">
            <p>Hola,</p>
            
            <p>El reporte semanal de <strong>${options.tienda}</strong> está listo.</p>
            
            <div class="info-box">
              <strong>Período del reporte:</strong><br>
              ${formatDate(options.weekStart)} - ${formatDate(options.weekEnd)}
            </div>
            
            <p>El reporte completo está adjunto en formato PDF. Incluye:</p>
            
            <ul>
              <li>✅ Resumen de ingresos y gastos</li>
              <li>✅ Cálculo de impuestos</li>
              <li>✅ Ganancia neta de la semana</li>
              <li>✅ Detalles financieros completos</li>
              <li>✅ Análisis de margen de ganancia</li>
            </ul>
            
            <p style="margin-top: 30px;">
              <strong>Nota:</strong> Este reporte se genera automáticamente al final de cada semana laboral.
            </p>
            
            <div class="footer">
              <p>Este es un correo automático generado por Phoenix Financial System</p>
              <p style="margin-top: 5px;">© ${new Date().getFullYear()} Phoenix Financial System</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `Reporte_Semanal_${options.tienda.replace(/\s+/g, '_')}_${options.weekStart}_${options.weekEnd}.pdf`,
          path: options.pdfPath,
          contentType: 'application/pdf',
        },
      ],
    };
    
    // Enviar el email
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`[Email Service] Email enviado exitosamente: ${info.messageId}`);
    console.log(`[Email Service] Destinatarios: ${emailList}`);
    
  } catch (error) {
    console.error('[Email Service] Error al enviar email:', error);
    throw error;
  }
}

/**
 * Verifica la configuración de email
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('[Email Service] Configuración de email verificada correctamente');
    return true;
  } catch (error) {
    console.error('[Email Service] Error en configuración de email:', error);
    return false;
  }
}
