// Types for Fixopolis Solutions Financial System

export type UserRole = 'admin' | 'sucursal';

export type PaymentMethod = 'efectivo' | 'banco';

export type TransactionType = 'ingreso' | 'gasto';

export interface Transaction {
  id: string;
  tipo: TransactionType;
  monto: number;
  metodo: PaymentMethod;
  categoria?: string;
  descripcion: string;
  fecha: string;
  tienda: UserRole;
  proveedor?: string;
  empleado?: string;
}

export interface DailyData {
  ingresos: Transaction[];
  gastos: Transaction[];
  nomina: PagoNomina[];
  fecha: string;
}

export interface Config {
  porcentajeAhorro: number;
  porcentajeInversion: number;
  porcentajeEmergencia: number;
  porcentajeDisponible: number;
  cajaChicaAdmin: number;
  cajaChicaSucursal: number;
  diaInicioSemana: number;
  diaFinSemana: number;
  zonaHoraria: string;
  taxRate: number; // Porcentaje de impuestos (default 8.25%)
}

export interface Provider {
  id: string;
  nombre: string;
  telefono: string;
}

export interface Employee {
  id: string;
  nombre: string;
  telefono: string;
  puesto: string;
  activo: boolean;
}

export interface PagoNomina {
  id: string;
  empleadoId: string;
  empleadoNombre: string;
  monto: number;
  metodo: PaymentMethod;
  descripcion: string;
  fecha: string;
  tienda: UserRole;
}

export interface TaxData {
  totalEfectivo: number;
  totalBanco: number;
  taxEfectivo: number;
  taxBanco: number;
  netoEfectivo: number;
  netoBanco: number;
}

export interface WeeklyReport {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  tienda: UserRole | 'general';
  ingresoTotal: number;
  gastoTotal: number;
  gananciaNeta: number;
  transacciones: number;
  // Nuevos campos para taxes y desglose
  ingresoEfectivo: number;
  ingresoBanco: number;
  taxEfectivo: number;
  taxBanco: number;
  netoEfectivo: number;
  netoBanco: number;
  ahorroEfectivo: number;
  ahorroBanco: number;
  inversionEfectivo: number;
  inversionBanco: number;
  emergenciaEfectivo: number;
  emergenciaBanco: number;
  disponibleEfectivo: number;
  disponibleBanco: number;
}
