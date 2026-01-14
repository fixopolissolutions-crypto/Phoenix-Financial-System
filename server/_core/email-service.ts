/**
 * Email Service - Envío de reportes semanales por correo
 */

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
async function createTransporter() {
  const nodemailer = await import('nodemailer');
  
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
  
  return nodemailer.default.createTransporter(config);
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
 * Genera el HTML del email
 */
function generateEmailHTML(options: EmailOptions): string {
  const { tienda, weekStart, weekEnd } = options;
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte Semanal - ${tienda}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 30px;
    }
    .content p {
      color: #333;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 5px 0;
      color: #555;
    }
    .info-box strong {
      color: #333;
    }
    .button {
      display: inline-block;
      background-color: #667eea;
      color: white;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 5px;
      font-weight: 600;
      margin-top: 20px;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Reporte Semanal</h1>
      <p>${tienda}</p>
    </div>
    <div class="content">
      <p>Hola,</p>
      <p>Te enviamos el reporte semanal de <strong>${tienda}</strong> correspondiente al período:</p>
      
      <div class="info-box">
        <p><strong>📅 Inicio:</strong> ${formatDate(weekStart)}</p>
        <p><strong>📅 Fin:</strong> ${formatDate(weekEnd)}</p>
      </div>
      
      <p>El reporte completo en PDF está adjunto a este correo. Incluye:</p>
      <ul>
        <li>Resumen de ingresos y gastos</li>
        <li>Cálculo de impuestos</li>
        <li>Ganancia neta del período</li>
        <li>Análisis de margen de ganancia</li>
      </ul>
      
      <p>Si tienes alguna pregunta sobre el reporte, no dudes en contactarnos.</p>
    </div>
    <div class="footer">
      <p>Este es un correo automático generado por Phoenix Financial System</p>
      <p>© 2026 1+PhoneFix. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Envía el reporte semanal por email
 */
export async function sendWeeklyReportEmail(options: EmailOptions): Promise<void> {
  try {
    console.log(`[Email Service] Preparando envío de reporte para ${options.tienda}...`);
    
    // Verificar que el PDF existe
    if (!fs.existsSync(options.pdfPath)) {
      throw new Error(`PDF no encontrado: ${options.pdfPath}`);
    }
    
    // Crear transportador
    const transporter = await createTransporter();
    
    // Separar múltiples emails si están separados por comas
    const recipients = options.to.split(',').map(email => email.trim()).join(', ');
    
    // Configurar el email
    const mailOptions = {
      from: `"Phoenix Financial System" <${process.env.SMTP_USER}>`,
      to: recipients,
      subject: `📊 Reporte Semanal - ${options.tienda} (${formatDate(options.weekStart)} - ${formatDate(options.weekEnd)})`,
      html: generateEmailHTML(options),
      attachments: [
        {
          filename: `Reporte_${options.tienda.replace(/\s+/g, '_')}_${options.weekStart}_${options.weekEnd}.pdf`,
          path: options.pdfPath,
        },
      ],
    };
    
    // Enviar email
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] ✅ Email enviado exitosamente a ${recipients}`);
    console.log(`[Email Service] Message ID: ${info.messageId}`);
    
  } catch (error: any) {
    console.error(`[Email Service] ❌ Error al enviar email:`, error.message);
    throw error;
  }
}
