/**
 * Scheduler Service - Tareas programadas
 * - Reset diario a medianoche (00:00)
 * - Generación de reporte semanal (Domingos a las 23:55)
 */

import * as db from '../db';

let dailyResetInterval: NodeJS.Timeout | null = null;
let weeklyReportInterval: NodeJS.Timeout | null = null;
let lastResetDate: string | null = null;

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
 * Calcula el tiempo hasta el próximo domingo a las 23:55
 */
function getMillisecondsUntilWeeklyReport(): number {
  const now = new Date();
  const nextSunday = new Date(now);
  
  // Calcular días hasta el próximo domingo (0 = domingo)
  const daysUntilSunday = (7 - now.getDay()) % 7;
  
  if (daysUntilSunday === 0 && now.getHours() < 23) {
    // Si es domingo y aún no son las 23:55, programar para hoy
    nextSunday.setHours(23, 55, 0, 0);
  } else {
    // Programar para el próximo domingo
    nextSunday.setDate(now.getDate() + (daysUntilSunday || 7));
    nextSunday.setHours(23, 55, 0, 0);
  }
  
  return nextSunday.getTime() - now.getTime();
}

/**
 * Guarda el historial diario antes del reset
 */
async function saveDailyHistory() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Obtener todas las transacciones del día
    const transactions = await db.getTransactions({
      fechaInicio: new Date(today),
      fechaFin: new Date(today + 'T23:59:59'),
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
      
      // Guardar en historial
      await db.saveDailyHistory({
        fecha: today,
        tienda,
        totalIngresos: ingresos.toString(),
        totalGastos: gastos.toString(),
        totalNomina: nomina.toString(),
      });
      
      console.log(`[Scheduler] Historial diario guardado para ${tienda}: Ingresos=$${ingresos}, Gastos=$${gastos}`);
    }
  } catch (error) {
    console.error('[Scheduler] Error al guardar historial diario:', error);
  }
}

/**
 * Reset diario a medianoche
 * Guarda el historial del día y prepara el sistema para el nuevo día
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
 * Genera reporte semanal
 */
async function generateWeeklyReport() {
  console.log('[Scheduler] Generando reporte semanal...');
  
  try {
    // Obtener datos de los últimos 7 días
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const transactions = await db.getTransactions({
      fechaInicio: startDate,
      fechaFin: endDate,
    });
    
    // Calcular totales
    const totalIngresos = transactions
      .filter(t => t.tipo === 'ingreso')
      .reduce((sum, t) => sum + parseFloat(t.monto as any), 0);
    
    const totalGastos = transactions
      .filter(t => t.tipo === 'gasto')
      .reduce((sum, t) => sum + parseFloat(t.monto as any), 0);
    
    const ganancia = totalIngresos - totalGastos;
    
    console.log('[Scheduler] Reporte semanal generado:');
    console.log(`  - Ingresos: $${totalIngresos.toFixed(2)}`);
    console.log(`  - Gastos: $${totalGastos.toFixed(2)}`);
    console.log(`  - Ganancia: $${ganancia.toFixed(2)}`);
    console.log(`  - Transacciones: ${transactions.length}`);
    
    // TODO: Enviar reporte por email o guardarlo en un archivo
    
  } catch (error) {
    console.error('[Scheduler] Error al generar reporte semanal:', error);
  }
  
  // Programar el próximo reporte
  scheduleWeeklyReport();
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
 * Programa el reporte semanal
 */
function scheduleWeeklyReport() {
  // Cancelar intervalo anterior si existe
  if (weeklyReportInterval) {
    clearTimeout(weeklyReportInterval);
  }
  
  const msUntilReport = getMillisecondsUntilWeeklyReport();
  const days = Math.floor(msUntilReport / (1000 * 60 * 60 * 24));
  const hours = Math.floor((msUntilReport % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  console.log(`[Scheduler] Próximo reporte semanal en ${days}d ${hours}h`);
  
  weeklyReportInterval = setTimeout(() => {
    generateWeeklyReport();
  }, msUntilReport);
}

/**
 * Inicia el scheduler
 */
export function startScheduler() {
  console.log('[Scheduler] Iniciando servicio de tareas programadas...');
  
  // Programar reset diario
  scheduleDailyReset();
  
  // Programar reporte semanal
  scheduleWeeklyReport();
  
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
  
  if (weeklyReportInterval) {
    clearTimeout(weeklyReportInterval);
    weeklyReportInterval = null;
  }
  
  console.log('[Scheduler] Servicio detenido');
}
