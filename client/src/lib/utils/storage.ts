import type { Transaction, Config, Provider, Employee, DailyData, WeeklyReport, PagoNomina } from '../types';

interface HistoricalDay {
  fecha: string;
  ingresos: number;
  gastos: number;
  tienda: 'admin' | 'sucursal';
}

interface Credentials {
  adminPassword: string;
  sucursalPassword: string;
}

const STORAGE_KEYS = {
  ADMIN_DATA: 'fixopolis_admin_data',
  SUCURSAL_DATA: 'fixopolis_sucursal_data',
  CONFIG: 'fixopolis_config',
  PROVIDERS: 'fixopolis_providers',
  EMPLOYEES: 'fixopolis_employees',
  REPORTS: 'fixopolis_reports',
  LAST_RESET: 'fixopolis_last_reset',
  LAST_WEEKLY_RESET: 'fixopolis_last_weekly_reset',
  CURRENT_USER: 'fixopolis_current_user',
  HISTORICAL_DATA: 'fixopolis_historical',
  CREDENTIALS: 'fixopolis_credentials',
  WEEKLY_DATA_ADMIN: 'fixopolis_weekly_admin',
  WEEKLY_DATA_SUCURSAL: 'fixopolis_weekly_sucursal',
} as const;

export const storage = {
  // Daily Data
  getDailyData(tienda: 'admin' | 'sucursal'): DailyData {
    const key = tienda === 'admin' ? STORAGE_KEYS.ADMIN_DATA : STORAGE_KEYS.SUCURSAL_DATA;
    const data = localStorage.getItem(key);
    if (!data) {
      return { ingresos: [], gastos: [], nomina: [], fecha: new Date().toISOString().split('T')[0] };
    }
    const parsed = JSON.parse(data);
    // Ensure nomina array exists for backward compatibility
    if (!parsed.nomina) {
      parsed.nomina = [];
    }
    return parsed;
  },

  saveDailyData(tienda: 'admin' | 'sucursal', data: DailyData) {
    const key = tienda === 'admin' ? STORAGE_KEYS.ADMIN_DATA : STORAGE_KEYS.SUCURSAL_DATA;
    localStorage.setItem(key, JSON.stringify(data));
  },

  addTransaction(tienda: 'admin' | 'sucursal', transaction: Transaction) {
    const data = this.getDailyData(tienda);
    if (transaction.tipo === 'ingreso') {
      data.ingresos.push(transaction);
    } else {
      data.gastos.push(transaction);
    }
    this.saveDailyData(tienda, data);
    
    // Also add to weekly accumulated data
    this.addToWeeklyData(tienda, transaction);
  },

  addNomina(pago: PagoNomina, tienda: 'admin' | 'sucursal') {
    const data = this.getDailyData(tienda);
    data.nomina.push(pago);
    this.saveDailyData(tienda, data);
  },

  updateTransaction(tienda: 'admin' | 'sucursal', transaction: Transaction) {
    const data = this.getDailyData(tienda);
    if (transaction.tipo === 'ingreso') {
      const index = data.ingresos.findIndex(i => i.id === transaction.id);
      if (index !== -1) {
        data.ingresos[index] = transaction;
      }
    } else {
      const index = data.gastos.findIndex(g => g.id === transaction.id);
      if (index !== -1) {
        data.gastos[index] = transaction;
      }
    }
    this.saveDailyData(tienda, data);
    
    // Also update in weekly data
    const weeklyData = this.getWeeklyData(tienda);
    if (transaction.tipo === 'ingreso') {
      const index = weeklyData.ingresos.findIndex(i => i.id === transaction.id);
      if (index !== -1) {
        weeklyData.ingresos[index] = transaction;
      }
    } else {
      const index = weeklyData.gastos.findIndex(g => g.id === transaction.id);
      if (index !== -1) {
        weeklyData.gastos[index] = transaction;
      }
    }
    this.saveWeeklyData(tienda, weeklyData);
  },

  deleteTransaction(tienda: 'admin' | 'sucursal', transactionId: string) {
    const data = this.getDailyData(tienda);
    data.ingresos = data.ingresos.filter(i => i.id !== transactionId);
    data.gastos = data.gastos.filter(g => g.id !== transactionId);
    this.saveDailyData(tienda, data);
    
    // Also delete from weekly data
    const weeklyData = this.getWeeklyData(tienda);
    weeklyData.ingresos = weeklyData.ingresos.filter(i => i.id !== transactionId);
    weeklyData.gastos = weeklyData.gastos.filter(g => g.id !== transactionId);
    this.saveWeeklyData(tienda, weeklyData);
  },

  // Weekly Accumulated Data (for Dashboard General)
  getWeeklyData(tienda: 'admin' | 'sucursal'): DailyData {
    const key = tienda === 'admin' ? STORAGE_KEYS.WEEKLY_DATA_ADMIN : STORAGE_KEYS.WEEKLY_DATA_SUCURSAL;
    const data = localStorage.getItem(key);
    if (!data) {
      return { ingresos: [], gastos: [], nomina: [], fecha: new Date().toISOString().split('T')[0] };
    }
    return JSON.parse(data);
  },

  saveWeeklyData(tienda: 'admin' | 'sucursal', data: DailyData) {
    const key = tienda === 'admin' ? STORAGE_KEYS.WEEKLY_DATA_ADMIN : STORAGE_KEYS.WEEKLY_DATA_SUCURSAL;
    localStorage.setItem(key, JSON.stringify(data));
  },

  addToWeeklyData(tienda: 'admin' | 'sucursal', transaction: Transaction) {
    const data = this.getWeeklyData(tienda);
    if (transaction.tipo === 'ingreso') {
      data.ingresos.push(transaction);
    } else {
      data.gastos.push(transaction);
    }
    this.saveWeeklyData(tienda, data);
  },

  // Historical Data (for charts)
  getHistoricalData(tienda: 'admin' | 'sucursal'): HistoricalDay[] {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORICAL_DATA);
    if (!data) return [];
    const allData: HistoricalDay[] = JSON.parse(data);
    return allData.filter(d => d.tienda === tienda);
  },

  saveHistoricalDay(tienda: 'admin' | 'sucursal', dayData: { fecha: string; ingresos: number; gastos: number }) {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORICAL_DATA);
    const allData: HistoricalDay[] = data ? JSON.parse(data) : [];
    
    // Remove existing entry for this day and tienda
    const filtered = allData.filter(d => !(d.fecha === dayData.fecha && d.tienda === tienda));
    filtered.push({ ...dayData, tienda });
    
    // Keep only last 30 days
    const sorted = filtered.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-60);
    localStorage.setItem(STORAGE_KEYS.HISTORICAL_DATA, JSON.stringify(sorted));
  },

  // Config
  getConfig(): Config {
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!data) {
      return {
        porcentajeAhorro: 10,
        porcentajeInversion: 10,
        porcentajeEmergencia: 5,
        porcentajeDisponible: 75,
        cajaChicaAdmin: 500,
        cajaChicaSucursal: 300,
        diaInicioSemana: 1, // Lunes
        diaFinSemana: 0, // Domingo
        zonaHoraria: 'America/Chicago',
        taxRate: 8.25, // Porcentaje de impuestos
      };
    }
    return JSON.parse(data);
  },

  saveConfig(config: Config) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  },

  // Credentials
  getCredentials(): Credentials {
    const data = localStorage.getItem(STORAGE_KEYS.CREDENTIALS);
    if (!data) {
      return {
        adminPassword: '1234',
        sucursalPassword: '0000',
      };
    }
    return JSON.parse(data);
  },

  saveCredentials(credentials: Credentials) {
    localStorage.setItem(STORAGE_KEYS.CREDENTIALS, JSON.stringify(credentials));
  },

  updatePassword(role: 'admin' | 'sucursal', newPassword: string) {
    const credentials = this.getCredentials();
    if (role === 'admin') {
      credentials.adminPassword = newPassword;
    } else {
      credentials.sucursalPassword = newPassword;
    }
    this.saveCredentials(credentials);
  },

  // Providers
  getProviders(): Provider[] {
    const data = localStorage.getItem(STORAGE_KEYS.PROVIDERS);
    return data ? JSON.parse(data) : [];
  },

  saveProviders(providers: Provider[]) {
    localStorage.setItem(STORAGE_KEYS.PROVIDERS, JSON.stringify(providers));
  },

  addProvider(provider: Provider) {
    const providers = this.getProviders();
    providers.push(provider);
    this.saveProviders(providers);
  },

  removeProvider(id: string) {
    const providers = this.getProviders().filter(p => p.id !== id);
    this.saveProviders(providers);
  },

  // Employees
  getEmpleados(): Employee[] {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : [];
  },

  saveEmpleados(employees: Employee[]) {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  },

  addEmpleado(employee: Employee) {
    const employees = this.getEmpleados();
    employees.push(employee);
    this.saveEmpleados(employees);
  },

  removeEmpleado(id: string) {
    const employees = this.getEmpleados().filter(e => e.id !== id);
    this.saveEmpleados(employees);
  },

  // Reports
  getReports(): WeeklyReport[] {
    const data = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return data ? JSON.parse(data) : [];
  },

  saveReport(report: WeeklyReport) {
    const reports = this.getReports();
    reports.push(report);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  },

  // User
  getCurrentUser(): { role: 'admin' | 'sucursal'; name: string } | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser(user: { role: 'admin' | 'sucursal'; name: string }) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // Reset Daily
  checkAndResetDaily() {
    const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
    const today = new Date().toISOString().split('T')[0];
    
    if (lastReset !== today) {
      // Save current data to historical before reset
      const adminData = this.getDailyData('admin');
      const sucursalData = this.getDailyData('sucursal');
      
      if (lastReset) {
        const adminIngresos = adminData.ingresos.reduce((sum, i) => sum + i.monto, 0);
        const adminGastos = adminData.gastos.reduce((sum, g) => sum + g.monto, 0);
        const sucursalIngresos = sucursalData.ingresos.reduce((sum, i) => sum + i.monto, 0);
        const sucursalGastos = sucursalData.gastos.reduce((sum, g) => sum + g.monto, 0);
        
        if (adminIngresos > 0 || adminGastos > 0) {
          this.saveHistoricalDay('admin', { fecha: lastReset, ingresos: adminIngresos, gastos: adminGastos });
        }
        if (sucursalIngresos > 0 || sucursalGastos > 0) {
          this.saveHistoricalDay('sucursal', { fecha: lastReset, ingresos: sucursalIngresos, gastos: sucursalGastos });
        }
      }
      
      // Reset daily data
      this.saveDailyData('admin', { ingresos: [], gastos: [], nomina: [], fecha: today });
      this.saveDailyData('sucursal', { ingresos: [], gastos: [], nomina: [], fecha: today });
      localStorage.setItem(STORAGE_KEYS.LAST_RESET, today);
    }
  },

  // Reset Weekly (for Dashboard General)
  checkAndResetWeekly() {
    const config = this.getConfig();
    const lastWeeklyReset = localStorage.getItem(STORAGE_KEYS.LAST_WEEKLY_RESET);
    const today = new Date();
    const currentDay = today.getDay();
    
    // Check if today is the end of week day
    if (currentDay === config.diaFinSemana) {
      const todayStr = today.toISOString().split('T')[0];
      
      if (lastWeeklyReset !== todayStr) {
        // Reset weekly accumulated data
        this.saveWeeklyData('admin', { ingresos: [], gastos: [], nomina: [], fecha: todayStr });
        this.saveWeeklyData('sucursal', { ingresos: [], gastos: [], nomina: [], fecha: todayStr });
        localStorage.setItem(STORAGE_KEYS.LAST_WEEKLY_RESET, todayStr);
      }
    }
  },
};

// Re-export types for convenience
export type { Employee as Empleado, PagoNomina } from '../types';
