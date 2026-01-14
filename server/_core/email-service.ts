/**
 * Email Service - Envío de reportes semanales por correo usando Resend
 */

import { Resend } from 'resend';
import * as fs from 'fs';

interface EmailOptions {
  to: string;
  tienda: string;
  weekStart: string;
  weekEnd: string;
  htmlPath: string; // Ruta al archivo HTML del reporte
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
 * Genera el HTML del email con el reporte embebido
 */
function generateEmailHTML(options: EmailOptions): string {
  const { tienda, weekStart, weekEnd, htmlPath } = options;
  
  // Leer el HTML del reporte
  let reportContent = '';
  if (fs.existsSync(htmlPath)) {
    reportContent = fs.readFileSync(htmlPath, 'utf-8');
  }
  
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
    .email-container {
      max-width: 800px;
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
    .intro {
      padding: 30px;
      background-color: #fff;
    }
    .intro p {
      color: #333;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 15px;
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
    .report-content {
      padding: 0 30px 30px 30px;
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
  <div class="email-container">
    <div class="header">
      <h1>📊 Reporte Semanal</h1>
      <p>${tienda}</p>
    </div>
    <div class="intro">
      <p>Hola,</p>
      <p>Te enviamos el reporte semanal de <strong>${tienda}</strong> correspondiente al período:</p>
      
      <div class="info-box">
        <p><strong>📅 Inicio:</strong> ${formatDate(weekStart)}</p>
        <p><strong>📅 Fin:</strong> ${formatDate(weekEnd)}</p>
      </div>
    </div>
    <div class="report-content">
      ${reportContent}
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
 * Envía el reporte semanal por email usando Resend
 */
export async function sendWeeklyReportEmail(options: EmailOptions): Promise<void> {
  try {
    console.log(`[Email Service] Preparando envío de reporte para ${options.tienda}...`);
    
    // Verificar que el HTML existe
    if (!fs.existsSync(options.htmlPath)) {
      throw new Error(`HTML no encontrado: ${options.htmlPath}`);
    }
    
    // Verificar que la API key está configurada
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY no está configurada en las variables de entorno');
    }
    
    // Crear cliente de Resend
    const resend = new Resend(apiKey);
    
    // Separar múltiples emails si están separados por comas
    const recipients = options.to.split(',').map(email => email.trim());
    
    // Generar HTML del email
    const emailHTML = generateEmailHTML(options);
    
    // Enviar email a cada destinatario
    for (const recipient of recipients) {
      const { data, error } = await resend.emails.send({
        from: 'Phoenix Financial <onboarding@resend.dev>',
        to: recipient,
        subject: `📊 Reporte Semanal - ${options.tienda} (${formatDate(options.weekStart)} - ${formatDate(options.weekEnd)})`,
        html: emailHTML,
      });
      
      if (error) {
        console.error(`[Email Service] ❌ Error al enviar a ${recipient}:`, error);
        throw error;
      }
      
      console.log(`[Email Service] ✅ Email enviado exitosamente a ${recipient}`);
      console.log(`[Email Service] Email ID: ${data?.id}`);
    }
    
  } catch (error: any) {
    console.error(`[Email Service] ❌ Error al enviar email:`, error.message);
    throw error;
  }
}
