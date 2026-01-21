import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  transactions, InsertTransaction, Transaction,
  providers, InsertProvider, Provider,
  employees, InsertEmployee, Employee,
  payroll, InsertPayroll, Payroll,
  config, InsertConfig,
  dailyHistory, InsertDailyHistory,
  weeklyHistory, InsertWeeklyHistory,
  credentials, InsertCredential,
  inventoryPhones, InsertInventoryPhone, InventoryPhone,
  inventoryAccessories, InsertInventoryAccessory, InventoryAccessory,
  inventoryParts, InsertInventoryPart, InventoryPart,
  repairs, InsertRepair, Repair,
  repairParts, InsertRepairPart, RepairPart,
  inventoryMovements, InsertInventoryMovement, InventoryMovement
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ==================== TRANSACTIONS ====================

export async function getTransactions(filters?: {
  tipo?: 'ingreso' | 'gasto';
  tienda?: 'admin' | 'sucursal';
  fechaInicio?: Date;
  fechaFin?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(transactions);
  
  const conditions = [];
  if (filters?.tipo) {
    conditions.push(eq(transactions.tipo, filters.tipo));
  }
  if (filters?.tienda) {
    conditions.push(eq(transactions.tienda, filters.tienda));
  }
  
  // Usar DATE() de MySQL para comparar solo la fecha, sin la hora
  if (filters?.fechaInicio) {
    const fechaInicioStr = filters.fechaInicio.toISOString().split('T')[0];
    conditions.push(sql`DATE(${transactions.fecha}) >= ${fechaInicioStr}`);
  }
  if (filters?.fechaFin) {
    const fechaFinStr = filters.fechaFin.toISOString().split('T')[0];
    conditions.push(sql`DATE(${transactions.fecha}) <= ${fechaFinStr}`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return await query.orderBy(desc(transactions.fecha));
}

export async function getTransactionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTransaction(data: InsertTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Usar SQL raw para evitar problemas con comillas en Drizzle
  const result = await db.execute(
    sql`INSERT INTO transactions (
      tipo, monto, metodo, descripcion, categoria, proveedor, tienda, fecha
    ) VALUES (
      ${data.tipo}, ${data.monto}, ${data.metodo}, ${data.descripcion},
      ${data.categoria}, ${data.proveedor}, ${data.tienda}, ${data.fecha}
    )`
  );
  return { id: Number(result[0].insertId), ...data };
}

export async function updateTransaction(id: number, data: Partial<InsertTransaction>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(transactions).set(data).where(eq(transactions.id, id));
  return await getTransactionById(id);
}

export async function deleteTransaction(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(transactions).where(eq(transactions.id, id));
  return { success: true };
}

export async function getDailySummary(tienda: 'admin' | 'sucursal', fecha: string) {
  const db = await getDb();
  if (!db) return { ingresos: 0, gastos: 0 };

  const startOfDay = new Date(fecha);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(fecha);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await db.select({
    tipo: transactions.tipo,
    total: sql<string>`SUM(${transactions.monto})`
  })
  .from(transactions)
  .where(and(
    eq(transactions.tienda, tienda),
    gte(transactions.fecha, startOfDay),
    lte(transactions.fecha, endOfDay)
  ))
  .groupBy(transactions.tipo);

  const summary = { ingresos: 0, gastos: 0 };
  result.forEach(r => {
    if (r.tipo === 'ingreso') summary.ingresos = parseFloat(r.total || '0');
    if (r.tipo === 'gasto') summary.gastos = parseFloat(r.total || '0');
  });

  return summary;
}

// ==================== PROVIDERS ====================

export async function getProviders() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(providers).orderBy(providers.nombre);
}

export async function getProviderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(providers).where(eq(providers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createProvider(data: InsertProvider) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Usar SQL raw para evitar problemas con comillas en Drizzle
  const result = await db.execute(
    sql`INSERT INTO providers (
      nombre, telefono, email, direccion, notas
    ) VALUES (
      ${data.nombre}, ${data.telefono}, ${data.email},
      ${data.direccion}, ${data.notas}
    )`
  );
  return { id: Number(result[0].insertId), ...data };
}

export async function updateProvider(id: number, data: Partial<InsertProvider>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(providers).set(data).where(eq(providers.id, id));
  return await getProviderById(id);
}

export async function deleteProvider(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(providers).where(eq(providers.id, id));
  return { success: true };
}

// ==================== EMPLOYEES ====================

export async function getEmployees(tienda?: 'admin' | 'sucursal') {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(employees);
  if (tienda) {
    query = query.where(eq(employees.tienda, tienda)) as typeof query;
  }

  return await query.orderBy(employees.nombre);
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEmployee(data: InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Usar SQL raw para evitar problemas con comillas en Drizzle
  const result = await db.execute(
    sql`INSERT INTO employees (
      nombre, puesto, salario, telefono, email, tienda, activo
    ) VALUES (
      ${data.nombre}, ${data.puesto}, ${data.salario},
      ${data.telefono}, ${data.email}, ${data.tienda}, ${data.activo}
    )`
  );
  return { id: Number(result[0].insertId), ...data };
}

export async function updateEmployee(id: number, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(employees).set(data).where(eq(employees.id, id));
  return await getEmployeeById(id);
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(employees).where(eq(employees.id, id));
  return { success: true };
}

// ==================== PAYROLL ====================

export async function getPayrollRecords(filters?: {
  employeeId?: number;
  tienda?: 'admin' | 'sucursal';
  fechaInicio?: Date;
  fechaFin?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(payroll);
  
  const conditions = [];
  if (filters?.employeeId) {
    conditions.push(eq(payroll.employeeId, filters.employeeId));
  }
  if (filters?.tienda) {
    conditions.push(eq(payroll.tienda, filters.tienda));
  }
  if (filters?.fechaInicio) {
    conditions.push(gte(payroll.fecha, filters.fechaInicio));
  }
  if (filters?.fechaFin) {
    conditions.push(lte(payroll.fecha, filters.fechaFin));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return await query.orderBy(desc(payroll.fecha));
}

export async function createPayrollRecord(data: InsertPayroll) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Usar SQL raw para evitar problemas con comillas en Drizzle
  const result = await db.execute(
    sql`INSERT INTO payroll (
      employeeId, monto, metodo, descripcion, tienda, fecha
    ) VALUES (
      ${data.employeeId}, ${data.monto}, ${data.metodo},
      ${data.descripcion}, ${data.tienda}, ${data.fecha}
    )`
  );
  return { id: Number(result[0].insertId), ...data };
}

export async function deletePayrollRecord(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(payroll).where(eq(payroll.id, id));
  return { success: true };
}

// ==================== CONFIG ====================

export async function getConfig(key: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(config).where(eq(config.key, key)).limit(1);
  return result.length > 0 ? result[0].value : undefined;
}

export async function setConfig(key: string, value: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(config).values({ key, value }).onDuplicateKeyUpdate({
    set: { value }
  });
  return { success: true };
}

export async function getAllConfig() {
  const db = await getDb();
  if (!db) return {};

  const result = await db.select().from(config);
  const configObj: Record<string, string> = {};
  result.forEach(r => {
    if (r.value) configObj[r.key] = r.value;
  });
  return configObj;
}

// ==================== CREDENTIALS ====================

export async function getCredential(username: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(credentials).where(eq(credentials.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertCredential(data: InsertCredential) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(credentials).values(data).onDuplicateKeyUpdate({
    set: { password: data.password, tienda: data.tienda }
  });
  return { success: true };
}

// ==================== DAILY HISTORY ====================

export async function getDailyHistoryRecords(tienda?: 'admin' | 'sucursal', limit?: number) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(dailyHistory);
  if (tienda) {
    query = query.where(eq(dailyHistory.tienda, tienda)) as typeof query;
  }

  query = query.orderBy(desc(dailyHistory.fecha)) as typeof query;
  if (limit) {
    query = query.limit(limit) as typeof query;
  }

  return await query;
}

export async function saveDailyHistory(data: InsertDailyHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Usar SQL raw para evitar problemas con comillas en Drizzle
  const result = await db.execute(
    sql`INSERT INTO daily_history (
      fecha, tienda, totalIngresos, totalGastos, totalNomina
    ) VALUES (
      ${data.fecha}, ${data.tienda}, ${data.totalIngresos},
      ${data.totalGastos}, ${data.totalNomina}
    )`
  );
  return { id: Number(result[0].insertId), ...data };
}

/**
 * Weekly History functions
 */
export async function getWeeklyHistory(params?: { tienda?: 'admin' | 'sucursal'; limit?: number }) {
  const { tienda, limit } = params || {};
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(weeklyHistory);
  if (tienda) {
    query = query.where(eq(weeklyHistory.tienda, tienda)) as typeof query;
  }

  query = query.orderBy(desc(weeklyHistory.weekStart)) as typeof query;
  if (limit) {
    query = query.limit(limit) as typeof query;
  }

  return await query;
}

export async function saveWeeklyHistory(data: InsertWeeklyHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Usar SQL raw para evitar problemas con comillas en Drizzle
  const result = await db.execute(
    sql`INSERT INTO weekly_history (
      weekStart, weekEnd, tienda, totalIngresos, totalGastos,
      totalNomina, totalTax, gananciaNeta, transaccionesCount,
      pdfPath, emailSent
    ) VALUES (
      ${data.weekStart}, ${data.weekEnd}, ${data.tienda},
      ${data.totalIngresos}, ${data.totalGastos}, ${data.totalNomina},
      ${data.totalTax}, ${data.gananciaNeta}, ${data.transaccionesCount},
      ${data.pdfPath}, ${data.emailSent}
    )`
  );
  return { id: Number(result[0].insertId), ...data };
}

export async function updateWeeklyHistoryEmailStatus(pdfPath: string, emailSent: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(weeklyHistory)
    .set({ emailSent })
    .where(eq(weeklyHistory.pdfPath, pdfPath));
}

export async function updateCredentialPassword(username: string, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(credentials)
    .set({ password: newPassword })
    .where(eq(credentials.username, username));
  
  return { success: true };
}

// ==================== INVENTORY PHONES ====================

export async function getInventoryPhones(filters?: { estado?: 'disponible' | 'vendido' | 'reservado'; tienda?: 'admin' | 'sucursal' }) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(inventoryPhones);
  
  const conditions = [];
  if (filters?.estado) {
    conditions.push(eq(inventoryPhones.estado, filters.estado));
  }
  if (filters?.tienda) {
    conditions.push(eq(inventoryPhones.tienda, filters.tienda));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return await query.orderBy(desc(inventoryPhones.createdAt));
}

export async function createInventoryPhone(data: InsertInventoryPhone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Usar SQL raw para evitar problemas con comillas en Drizzle
  const result = await db.execute(
    sql`INSERT INTO inventory_phones (
      codigo, modelo, marca, imei, carrier, condicion,
      precioCompra, precioVenta, estado, notas, tienda, fechaCompra, fechaVenta
    ) VALUES (
      ${data.codigo}, ${data.modelo}, ${data.marca}, ${data.imei || null},
      ${data.carrier || null}, ${data.condicion || 'usado'}, ${data.precioCompra},
      ${data.precioVenta || null}, ${data.estado || 'disponible'}, ${data.notas || null}, 
      ${data.tienda || 'admin'}, ${data.fechaCompra}, ${data.fechaVenta || null}
    )`
  );
  return { id: Number((result[0] as any).insertId), ...data };
}

export async function updateInventoryPhone(id: number, data: Partial<InsertInventoryPhone>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(inventoryPhones).set(data).where(eq(inventoryPhones.id, id));
  return { success: true };
}

export async function sellInventoryPhone(id: number, precioVenta: string, fechaVenta: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(inventoryPhones)
    .set({ 
      estado: 'vendido', 
      precioVenta, 
      fechaVenta 
    })
    .where(eq(inventoryPhones.id, id));
  
  return { success: true };
}

export async function deleteInventoryPhone(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(inventoryPhones).where(eq(inventoryPhones.id, id));
  return { success: true };
}

// ==================== INVENTORY ACCESSORIES ====================

export async function getInventoryAccessories(filters?: { tienda?: 'admin' | 'sucursal'; activo?: number }) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(inventoryAccessories);
  
  const conditions = [];
  if (filters?.tienda) {
    conditions.push(eq(inventoryAccessories.tienda, filters.tienda));
  }
  if (filters?.activo !== undefined) {
    conditions.push(eq(inventoryAccessories.activo, filters.activo));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return await query.orderBy(desc(inventoryAccessories.createdAt));
}

export async function createInventoryAccessory(data: InsertInventoryAccessory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const accessoryData = {
    ...data,
    cantidadActual: data.cantidadInicial,
    cantidadVendida: 0,
  };

  // Usar SQL raw para evitar problemas con comillas en Drizzle
  const result = await db.execute(
    sql`INSERT INTO inventory_accessories (
      codigo, nombre, categoria, precioCompraUnitario, precioVentaUnitario,
      cantidadInicial, cantidadActual, cantidadVendida, stockMinimo,
      tienda, activo
    ) VALUES (
      ${accessoryData.codigo}, ${accessoryData.nombre}, ${accessoryData.categoria},
      ${accessoryData.precioCompraUnitario}, ${accessoryData.precioVentaUnitario},
      ${accessoryData.cantidadInicial}, ${accessoryData.cantidadActual},
      ${accessoryData.cantidadVendida}, ${accessoryData.stockMinimo},
      ${accessoryData.tienda}, ${accessoryData.activo}
    )`
  );
  return { id: Number(result[0].insertId), ...accessoryData };
}

export async function updateInventoryAccessory(id: number, data: Partial<InsertInventoryAccessory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(inventoryAccessories).set(data).where(eq(inventoryAccessories.id, id));
  return { success: true };
}

export async function addAccessoryStock(id: number, cantidad: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const accessory = await db.select().from(inventoryAccessories).where(eq(inventoryAccessories.id, id)).limit(1);
  if (accessory.length === 0) throw new Error("Accessory not found");

  const newCantidad = Number(accessory[0].cantidadActual) + cantidad;
  await db.update(inventoryAccessories)
    .set({ cantidadActual: newCantidad })
    .where(eq(inventoryAccessories.id, id));
  
  return { success: true, newCantidad };
}

export async function sellAccessory(id: number, cantidad: number, fecha: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const accessory = await db.select().from(inventoryAccessories).where(eq(inventoryAccessories.id, id)).limit(1);
  if (accessory.length === 0) throw new Error("Accessory not found");

  const currentCantidad = Number(accessory[0].cantidadActual);
  if (currentCantidad < cantidad) throw new Error("Insufficient stock");

  const newCantidad = currentCantidad - cantidad;
  const newVendida = Number(accessory[0].cantidadVendida) + cantidad;

  await db.update(inventoryAccessories)
    .set({ 
      cantidadActual: newCantidad,
      cantidadVendida: newVendida 
    })
    .where(eq(inventoryAccessories.id, id));
  
  return { success: true, newCantidad, newVendida };
}

export async function deleteInventoryAccessory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(inventoryAccessories).where(eq(inventoryAccessories.id, id));
  return { success: true };
}

// ==================== INVENTORY PARTS ====================

export async function getInventoryParts(filters?: { tienda?: 'admin' | 'sucursal'; activo?: number }) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(inventoryParts);
  
  const conditions = [];
  if (filters?.tienda) {
    conditions.push(eq(inventoryParts.tienda, filters.tienda));
  }
  if (filters?.activo !== undefined) {
    conditions.push(eq(inventoryParts.activo, filters.activo));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return await query.orderBy(desc(inventoryParts.createdAt));
}

export async function createInventoryPart(data: InsertInventoryPart) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const partData = {
    ...data,
    precioCompraUnitario: typeof data.precioCompraUnitario === 'string' ? data.precioCompraUnitario : String(data.precioCompraUnitario),
    cantidadActual: data.cantidadInicial,
    cantidadUsada: 0,
  };

  // Usar SQL raw para evitar problemas con comillas en Drizzle
  const result = await db.execute(
    sql`INSERT INTO inventory_parts (
      codigo, nombre, categoria, compatibilidad, precioCompraUnitario,
      cantidadInicial, cantidadActual, cantidadUsada, stockMinimo,
      tienda, activo
    ) VALUES (
      ${partData.codigo}, ${partData.nombre}, ${partData.categoria},
      ${partData.compatibilidad}, ${partData.precioCompraUnitario},
      ${partData.cantidadInicial}, ${partData.cantidadActual},
      ${partData.cantidadUsada}, ${partData.stockMinimo},
      ${partData.tienda}, ${partData.activo}
    )`
  );
  return { id: Number(result[0].insertId), ...partData };
}

export async function updateInventoryPart(id: number, data: Partial<InsertInventoryPart>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(inventoryParts).set(data).where(eq(inventoryParts.id, id));
  return { success: true };
}

export async function addPartStock(id: number, cantidad: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const part = await db.select().from(inventoryParts).where(eq(inventoryParts.id, id)).limit(1);
  if (part.length === 0) throw new Error("Part not found");

  const newCantidad = Number(part[0].cantidadActual) + cantidad;
  await db.update(inventoryParts)
    .set({ cantidadActual: newCantidad })
    .where(eq(inventoryParts.id, id));
  
  return { success: true, newCantidad };
}

export async function usePart(id: number, cantidad: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const part = await db.select().from(inventoryParts).where(eq(inventoryParts.id, id)).limit(1);
  if (part.length === 0) throw new Error("Part not found");

  const currentCantidad = Number(part[0].cantidadActual);
  if (currentCantidad < cantidad) throw new Error("Insufficient stock");

  const newCantidad = currentCantidad - cantidad;
  const newUsada = Number(part[0].cantidadUsada) + cantidad;

  await db.update(inventoryParts)
    .set({ 
      cantidadActual: newCantidad,
      cantidadUsada: newUsada 
    })
    .where(eq(inventoryParts.id, id));
  
  return { success: true, newCantidad, newUsada };
}

export async function deleteInventoryPart(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(inventoryParts).where(eq(inventoryParts.id, id));
  return { success: true };
}

// ==================== REPAIRS ====================

export async function getRepairs(filters?: { 
  estado?: 'pendiente' | 'en_proceso' | 'completada' | 'entregada'; 
  tienda?: 'admin' | 'sucursal';
  fechaInicio?: Date;
  fechaFin?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(repairs);
  
  const conditions = [];
  if (filters?.estado) {
    conditions.push(eq(repairs.estado, filters.estado));
  }
  if (filters?.tienda) {
    conditions.push(eq(repairs.tienda, filters.tienda));
  }
  if (filters?.fechaInicio) {
    conditions.push(gte(repairs.fechaIngreso, filters.fechaInicio));
  }
  if (filters?.fechaFin) {
    conditions.push(lte(repairs.fechaIngreso, filters.fechaFin));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return await query.orderBy(desc(repairs.createdAt));
}

export async function createRepair(data: InsertRepair & { partes?: { partId: number; cantidad: number }[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calcular costo de partes si se proporcionan
  let costoPartes = 0;
  if (data.partes && data.partes.length > 0) {
    for (const parte of data.partes) {
      const part = await db.select().from(inventoryParts).where(eq(inventoryParts.id, parte.partId)).limit(1);
      if (part.length > 0) {
        costoPartes += Number(part[0].precioCompraUnitario) * parte.cantidad;
      }
    }
  }

  const ganancia = Number(data.precioTotal) - costoPartes;

  const repairData = {
    codigo: data.codigo,
    cliente: data.cliente,
    telefono: data.telefono,
    dispositivo: data.dispositivo,
    problema: data.problema,
    diagnostico: data.diagnostico,
    precioManoObra: data.precioManoObra,
    precioTotal: data.precioTotal,
    costoPartes: costoPartes.toFixed(2),
    ganancia: ganancia.toFixed(2),
    fechaIngreso: data.fechaIngreso,
    tienda: data.tienda,
    notas: data.notas,
  };

  // Usar SQL raw para evitar problemas con comillas en Drizzle
  const result = await db.execute(
    sql`INSERT INTO repairs (
      codigo, cliente, telefono, dispositivo, problema, diagnostico,
      precioManoObra, precioTotal, costoPartes, ganancia,
      fechaIngreso, tienda, notas
    ) VALUES (
      ${repairData.codigo}, ${repairData.cliente}, ${repairData.telefono},
      ${repairData.dispositivo}, ${repairData.problema}, ${repairData.diagnostico},
      ${repairData.precioManoObra}, ${repairData.precioTotal}, ${repairData.costoPartes},
      ${repairData.ganancia}, ${repairData.fechaIngreso}, ${repairData.tienda},
      ${repairData.notas}
    )`
  );
  const repairId = Number(result[0].insertId);

  // Agregar partes si se proporcionan
  if (data.partes && data.partes.length > 0) {
    await addRepairParts(repairId, data.partes);
  }

  return { id: repairId, ...repairData };
}

export async function updateRepair(id: number, data: Partial<InsertRepair>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(repairs).set(data).where(eq(repairs.id, id));
  return { success: true };
}

export async function addRepairParts(repairId: number, partes: { partId: number; cantidad: number }[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const parte of partes) {
    // Obtener el precio de la parte
    const part = await db.select().from(inventoryParts).where(eq(inventoryParts.id, parte.partId)).limit(1);
    if (part.length === 0) continue;

    const costoUnitario = part[0].precioCompraUnitario;
    const costoTotal = (Number(costoUnitario) * parte.cantidad).toFixed(2);

    // Insertar en repair_parts usando SQL raw
    await db.execute(
      sql`INSERT INTO repair_parts (
        repairId, partId, cantidad, costoUnitario, costoTotal
      ) VALUES (
        ${repairId}, ${parte.partId}, ${parte.cantidad},
        ${costoUnitario}, ${costoTotal}
      )`
    );

    // Usar la parte del inventario
    await usePart(parte.partId, parte.cantidad);
  }

  // Actualizar el costo de partes y ganancia de la reparación
  const partesUsadas = await db.select().from(repairParts).where(eq(repairParts.repairId, repairId));
  const costoPartes = partesUsadas.reduce((sum, p) => sum + Number(p.costoTotal), 0);

  const repair = await db.select().from(repairs).where(eq(repairs.id, repairId)).limit(1);
  if (repair.length > 0) {
    const ganancia = Number(repair[0].precioTotal) - costoPartes;
    await db.update(repairs)
      .set({ 
        costoPartes: costoPartes.toFixed(2),
        ganancia: ganancia.toFixed(2) 
      })
      .where(eq(repairs.id, repairId));
  }

  return { success: true };
}

export async function deleteRepair(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Eliminar primero las partes asociadas
  await db.delete(repairParts).where(eq(repairParts.repairId, id));
  
  // Eliminar la reparación
  await db.delete(repairs).where(eq(repairs.id, id));
  return { success: true };
}
// Force redeploy Wed Jan 14 21:16:08 EST 2026
// Forced rebuild at 2026-01-21_13:16:40
