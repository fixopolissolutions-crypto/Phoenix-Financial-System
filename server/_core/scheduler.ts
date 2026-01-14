/**
 * Scheduler Service - Tareas programadas
 * - Reset diario a medianoche (00:00)
 * - Reset semanal configurable (según config de semana laboral)
 * - Generación de reportes semanales en PDF
 * - Envío automático de reportes por email
 */

import * as db from '../db';
import { generateWeeklyPDFReport } from './pdf-generator';
import { sendWeeklyReportEmail } from './email-service';

let dailyResetInterval: NodeJS.Timeout | null = null;
let weeklyResetInterval: NodeJS.Timeout | null = null;
let lastResetDate: string | null = null;
let lastWeeklyResetDate: string | null = null;

/**
 * Calcula el tiempo hasta la próxima medianoche
 */
function getMillisecondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Siguiente medianoche
  return midnight.getTime() - now.getTime();
}

/**
 * Obtiene la configuración actual
 */
async function getConfig() {
  try {
    const configData = await db.getAllConfig();
    return {
      diaInicioSemana: parseInt(configData.diaInicioSemana || '1'), // Lunes por defecto
      diaFinSemana: parseInt(configData.diaFinSemana || '0'), // Domingo por defecto
      taxRate: parseFloat(configData.taxRate || '8.25'),
      email: configData.reportEmail || '',
    };
  } catch (error) {
    console.error('[Scheduler] Error al obtener configuración:', error);
    return {
      diaInicioSemana: 1, // Lunes
      diaFinSemana: 0, // Domingo
      taxRate: 8.25,
      email: '',
    };
  }
}

/**
 * Calcula el tiempo hasta el fin de la semana laboral (23:55 del día configurado)
 */
async function getMillisecondsUntilWeekEnd(): Promise<number> {
  const config = await getConfig();
  const now = new Date();
  const endOfWeek = new Date(now);
  
  // Calcular días hasta el día de fin de semana
  let daysUntilEnd = (config.diaFinSemana - now.getDay() + 7) % 7;
  
  if (daysUntilEnd === 0 && now.getHours() >= 23 && now.getMinutes() >= 55) {
    // Si ya pasó la hora de reset hoy, programar para la próxima semana
    daysUntilEnd = 7;
  }
  
  endOfWeek.setDate(now.getDate() + daysUntilEnd);
  endOfWeek.setHours(23, 55, 0, 0);
  
  return endOfWeek.getTime() - now.getTime();
}

/**
 * Calcula las fechas de inicio y fin de la semana laboral actual
 */
async function getCurrentWeekDates(): Promise<{ start: string; end: string }> {
  const config = await getConfig();
  const now = new Date();
  
  // Calcular inicio de semana
  const daysSinceStart = (now.getDay() - config.diaInicioSemana + 7) % 7;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysSinceStart);
  weekStart.setHours(0, 0, 0, 0);
  
  // Calcular fin de semana
  const daysUntilEnd = (config.diaFinSemana - config.diaInicioSemana + 7) % 7;
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + daysUntilEnd);
  weekEnd.setHours(23, 59, 59, 999);
  
  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0],
  };
}

/**
 * Guarda el historial diario antes del reset
 */
async function saveDailyHistory() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Obtener todas las transacciones del día anterior
    const transactions = await db.getTransactions({
      fechaInicio: new Date(yesterdayStr),
      fechaFin: new Date(yesterdayStr + 'T23:59:59'),
    });
    
    // Calcular totales por tienda
    const tiendas: ('admin' | 'sucursal')[] = ['admin', 'sucursal'];
    
    for (const tienda of tiendas) {
      const tiendaTransactions = transactions.filter(t => t.tienda === tienda);
      
      const ingresos = tiendaTransactions
        .filter(t => t.tipo === 'ingreso')
        .reduce((sum, t) => sum + parseFloat(t.monto as any), 0);
      
      const gastos = tiendaTransactions
        .filter(t => t.tipo === 'gasto')
        .reduce((sum, t) => sum + parseFloat(t.monto as any), 0);
      
      const nomina = 0; // TODO: Implementar cuando se agregue módulo de nómina
      
      // Guardar en historial solo si hubo actividad
      if (ingresos > 0 || gastos > 0) {
        await db.saveDailyHistory({
          fecha: yesterdayStr,
          tienda,
          totalIngresos: ingresos.toString(),
          totalGastos: gastos.toString(),
          totalNomina: nomina.toString(),
        });
        
        console.log(`[Scheduler] Historial diario guardado para ${tienda} (${yesterdayStr}): Ingresos=$${ingresos}, Gastos=$${gastos}`);
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error al guardar historial diario:', error);
  }
}

/**
 * Guarda el historial semanal y genera reportes
 */
async function saveWeeklyHistory() {
  try {
    const weekDates = await getCurrentWeekDates();
    const config = await getConfig();
    
    console.log(`[Scheduler] Guardando historial semanal: ${weekDates.start} a ${weekDates.end}`);
    
    // Obtener todas las transacciones de la semana
    const transactions = await db.getTransactions({
      fechaInicio: new Date(weekDates.start),
      fechaFin: new Date(weekDates.end + 'T23:59:59'),
    });
    
    // Procesar por tienda
    const tiendas: ('admin' | 'sucursal')[] = ['admin', 'sucursal'];
    const tiendaNombres = {
      admin: '1+PhoneFix Principal',
      sucursal: '1+PhoneFix Downtown',
    };
    
    for (const tienda of tiendas) {
      const tiendaTransactions = transactions.filter(t => t.tienda === tienda);
      
      // Calcular totales
      const ingresos = tiendaTransactions
        .filter(t => t.tipo === 'ingreso')
        .reduce((sum, t) => sum + parseFloat(t.monto as any), 0);
      
      const gastos = tiendaTransactions
        .filter(t => t.tipo === 'gasto')
        .reduce((sum, t) => sum + parseFloat(t.monto as any), 0);
      
      const nomina = 0; // TODO: Implementar cuando se agregue módulo de nómina
      
      // Calcular tax
      const totalTax = ingresos * (config.taxRate / 100);
      const ingresoNeto = ingresos - totalTax;
      const gananciaNeta = ingresoNeto - gastos - nomina;
      
      // Generar PDF del reporte
      const pdfPath = await generateWeeklyPDFReport({
        tienda,
        tiendaNombre: tiendaNombres[tienda],
        weekStart: weekDates.start,
        weekEnd: weekDates.end,
        totalIngresos: ingresos,
        totalGastos: gastos,
        totalNomina: nomina,
        totalTax,
        gananciaNeta,
        transaccionesCount: tiendaTransactions.length,
        taxRate: config.taxRate,
      });
      
      console.log(`[Scheduler] PDF generado para ${tienda}: ${pdfPath}`);
      
      // Guardar en historial
      await db.saveWeeklyHistory({
        weekStart: weekDates.start,
        weekEnd: weekDates.end,
        tienda,
        totalIngresos: ingresos.toString(),
        totalGastos: gastos.toString(),
        totalNomina: nomina.toString(),
        totalTax: totalTax.toString(),
        gananciaNeta: gananciaNeta.toString(),
        transaccionesCount: tiendaTransactions.length,
        pdfPath,
        emailSent: 0,
      });
      
      // Enviar por email si está configurado
      if (config.email) {
        try {
          await sendWeeklyReportEmail({
            to: config.email,
            tienda: tiendaNombres[tienda],
            weekStart: weekDates.start,
            weekEnd: weekDates.end,
            pdfPath,
          });
          
          // Marcar como enviado
          await db.updateWeeklyHistoryEmailStatus(pdfPath, 1);
          
          console.log(`[Scheduler] Email enviado para ${tienda} a ${config.email}`);
        } catch (emailError) {
          console.error(`[Scheduler] Error al enviar email para ${tienda}:`, emailError);
        }
      }
      
      console.log(`[Scheduler] Historial semanal guardado para ${tienda}: Ingresos=$${ingresos}, Gastos=$${gastos}, Ganancia=$${gananciaNeta}`);
    }
  } catch (error) {
    console.error('[Scheduler] Error al guardar historial semanal:', error);
  }
}

/**
 * Reset diario a medianoche
 */
async function performDailyReset() {
  const today = new Date().toISOString().split('T')[0];
  
  // Evitar múltiples resets en el mismo día
  if (lastResetDate === today) {
    console.log('[Scheduler] Reset diario ya ejecutado hoy');
    return;
  }
  
  console.log('[Scheduler] Ejecutando reset diario...');
  
  try {
    // Guardar historial del día anterior
    await saveDailyHistory();
    
    lastResetDate = today;
    console.log('[Scheduler] Reset diario completado exitosamente');
  } catch (error) {
    console.error('[Scheduler] Error en reset diario:', error);
  }
  
  // Programar el próximo reset
  scheduleDailyReset();
}

/**
 * Reset semanal al final de la semana laboral
 */
async function performWeeklyReset() {
  const weekDates = await getCurrentWeekDates();
  const weekKey = `${weekDates.start}_${weekDates.end}`;
  
  // Evitar múltiples resets en la misma semana
  if (lastWeeklyResetDate === weekKey) {
    console.log('[Scheduler] Reset semanal ya ejecutado esta semana');
    return;
  }
  
  console.log('[Scheduler] Ejecutando reset semanal...');
  
  try {
    // Guardar historial semanal y generar reportes
    await saveWeeklyHistory();
    
    lastWeeklyResetDate = weekKey;
    console.log('[Scheduler] Reset semanal completado exitosamente');
  } catch (error) {
    console.error('[Scheduler] Error en reset semanal:', error);
  }
  
  // Programar el próximo reset
  scheduleWeeklyReset();
}

/**
 * Programa el reset diario
 */
function scheduleDailyReset() {
  // Cancelar intervalo anterior si existe
  if (dailyResetInterval) {
    clearTimeout(dailyResetInterval);
  }
  
  const msUntilMidnight = getMillisecondsUntilMidnight();
  const hours = Math.floor(msUntilMidnight / (1000 * 60 * 60));
  const minutes = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
  
  console.log(`[Scheduler] Próximo reset diario en ${hours}h ${minutes}m`);
  
  dailyResetInterval = setTimeout(() => {
    performDailyReset();
  }, msUntilMidnight);
}

/**
 * Programa el reset semanal
 */
async function scheduleWeeklyReset() {
  // Cancelar intervalo anterior si existe
  if (weeklyResetInterval) {
    clearTimeout(weeklyResetInterval);
  }
  
  const msUntilWeekEnd = await getMillisecondsUntilWeekEnd();
  const days = Math.floor(msUntilWeekEnd / (1000 * 60 * 60 * 24));
  const hours = Math.floor((msUntilWeekEnd % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  console.log(`[Scheduler] Próximo reset semanal en ${days}d ${hours}h`);
  
  weeklyResetInterval = setTimeout(() => {
    performWeeklyReset();
  }, msUntilWeekEnd);
}

/**
 * Inicia el scheduler
 */
export async function startScheduler() {
  console.log('[Scheduler] Iniciando servicio de tareas programadas...');
  
  // Programar reset diario
  scheduleDailyReset();
  
  // Programar reset semanal
  await scheduleWeeklyReset();
  
  console.log('[Scheduler] Servicio iniciado correctamente');
}

/**
 * Detiene el scheduler
 */
export function stopScheduler() {
  if (dailyResetInterval) {
    clearTimeout(dailyResetInterval);
    dailyResetInterval = null;
  }
  
  if (weeklyResetInterval) {
    clearTimeout(weeklyResetInterval);
    weeklyResetInterval = null;
  }
  
  console.log('[Scheduler] Servicio detenido');
}
