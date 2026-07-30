/**
 * Servicio de Notificaciones SMS + WhatsApp (Twilio)
 * 
 * Configuración en Railway (variables de entorno):
 *   TWILIO_ACCOUNT_SID   → Tu Account SID de Twilio
 *   TWILIO_AUTH_TOKEN    → Tu Auth Token de Twilio
 *   TWILIO_PHONE_NUMBER  → Número Twilio para SMS (ej: +12025551234)
 *   TWILIO_WHATSAPP_FROM → Número WhatsApp Twilio (ej: whatsapp:+14155238886)
 * 
 * Si las variables no están configuradas, el sistema funciona en modo simulado
 * (registra los mensajes en el log pero no los envía).
 */

const ESTADO_MENSAJES: Record<string, { sms: string; whatsapp: string }> = {
  pendiente: {
    sms: `Hola {nombre}, hemos recibido tu {dispositivo} en {tienda}. Tu orden es #{codigo}. Te avisaremos cuando esté lista.`,
    whatsapp: `✅ *Orden recibida*\n\nHola {nombre}, hemos recibido tu *{dispositivo}* en {tienda}.\n\n📋 Orden: *#{codigo}*\nEstado: Pendiente de revisión\n\nTe notificaremos cuando haya novedades.`,
  },
  en_proceso: {
    sms: `Hola {nombre}, tu {dispositivo} (#{codigo}) está siendo reparado ahora. Te avisamos cuando esté listo.`,
    whatsapp: `🔧 *En reparación*\n\nHola {nombre}, tu *{dispositivo}* (#{codigo}) está siendo atendido por nuestro técnico.\n\nTe notificamos cuando esté listo. 🛠️`,
  },
  completada: {
    sms: `Hola {nombre}, tu {dispositivo} (#{codigo}) está LISTO. Puedes pasar a recogerlo a {tienda}. ¡Gracias!`,
    whatsapp: `🎉 *¡Tu equipo está listo!*\n\nHola {nombre}, tu *{dispositivo}* (#{codigo}) ha sido reparado exitosamente.\n\n📍 Puedes pasar a recogerlo a *{tienda}*.\n\n¡Gracias por confiar en nosotros! 😊`,
  },
  entregada: {
    sms: `Hola {nombre}, confirmamos la entrega de tu {dispositivo} (#{codigo}). ¡Gracias por preferirnos!`,
    whatsapp: `✅ *Entrega confirmada*\n\nHola {nombre}, confirmamos que recibiste tu *{dispositivo}* (#{codigo}).\n\n¡Gracias por preferirnos! Recuerda que tienes garantía en tu reparación. 🛡️`,
  },
};

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

export interface NotificationData {
  telefono: string;
  nombre: string;
  dispositivo: string;
  codigo: string;
  tienda: string;
  estado: string;
  canal?: 'sms' | 'whatsapp' | 'ambos';
}

export async function sendRepairNotification(data: NotificationData): Promise<{
  sms?: { success: boolean; sid?: string; error?: string; simulated?: boolean };
  whatsapp?: { success: boolean; sid?: string; error?: string; simulated?: boolean };
}> {
  const canal = data.canal ?? 'ambos';
  const estadoKey = data.estado.toLowerCase().replace(' ', '_').replace('é', 'e').replace('ó', 'o');
  const mensajes = ESTADO_MENSAJES[estadoKey];

  if (!mensajes) {
    console.log(`[Notificaciones] Estado "${data.estado}" no tiene mensaje configurado, omitiendo.`);
    return {};
  }

  const vars = {
    nombre: data.nombre,
    dispositivo: data.dispositivo,
    codigo: data.codigo,
    tienda: data.tienda,
  };

  const resultado: ReturnType<typeof sendRepairNotification> extends Promise<infer T> ? T : never = {};

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromSms = process.env.TWILIO_PHONE_NUMBER;
  const fromWa = process.env.TWILIO_WHATSAPP_FROM;
  const twilioEnabled = !!(sid && token && fromSms);

  // Normalizar teléfono: agregar +1 si es número de 10 dígitos sin código de país
  let toPhone = data.telefono.replace(/\D/g, '');
  if (toPhone.length === 10) toPhone = '+1' + toPhone;
  else if (!toPhone.startsWith('+')) toPhone = '+' + toPhone;

  // ── SMS ──────────────────────────────────────────────────────────────────
  if (canal === 'sms' || canal === 'ambos') {
    const body = interpolate(mensajes.sms, vars);
    if (twilioEnabled) {
      try {
        const twilio = require('twilio')(sid, token);
        const msg = await twilio.messages.create({ body, from: fromSms, to: toPhone });
        resultado.sms = { success: true, sid: msg.sid };
        console.log(`[SMS] Enviado a ${toPhone}: ${msg.sid}`);
      } catch (err: any) {
        resultado.sms = { success: false, error: err.message };
        console.error(`[SMS] Error al enviar a ${toPhone}:`, err.message);
      }
    } else {
      resultado.sms = { success: true, simulated: true };
      console.log(`[SMS SIMULADO] → ${toPhone}\n${body}`);
    }
  }

  // ── WhatsApp ─────────────────────────────────────────────────────────────
  if ((canal === 'whatsapp' || canal === 'ambos') && (fromWa || twilioEnabled)) {
    const body = interpolate(mensajes.whatsapp, vars);
    const waFrom = fromWa ?? `whatsapp:${fromSms}`;
    const waTo = `whatsapp:${toPhone}`;
    if (twilioEnabled) {
      try {
        const twilio = require('twilio')(sid, token);
        const msg = await twilio.messages.create({ body, from: waFrom, to: waTo });
        resultado.whatsapp = { success: true, sid: msg.sid };
        console.log(`[WhatsApp] Enviado a ${waTo}: ${msg.sid}`);
      } catch (err: any) {
        resultado.whatsapp = { success: false, error: err.message };
        console.error(`[WhatsApp] Error al enviar a ${waTo}:`, err.message);
      }
    } else {
      resultado.whatsapp = { success: true, simulated: true };
      console.log(`[WhatsApp SIMULADO] → ${waTo}\n${body}`);
    }
  }

  return resultado;
}
