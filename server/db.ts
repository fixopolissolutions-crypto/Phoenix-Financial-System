import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
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
  inventoryMovements, InsertInventoryMovement, InventoryMovement,
  storeConfig,
  customers, InsertCustomer, Customer
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
  
  // Filtro por tienda OBLIGATORIO (siempre aplicar)
  const tienda = filters?.tienda || 'admin';
  conditions.push(eq(transactions.tienda, tienda));
  
  if (filters?.tipo) {
    conditions.push(eq(transactions.tipo, filters.tipo));
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
  console.log('=== DB createTransaction ===');
  console.log('Data recibida:', JSON.stringify(data, null, 2));
  
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL not configured');
    throw new Error("Database not available");
  }
  
  console.log('Creating MySQL connection...');

  try {
    // Usar mysql2 directamente para evitar problemas con drizzle
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    
    // Manejar valores opcionales
    const descripcion = data.descripcion || null;
    const categoria = data.categoria || null;
    const proveedor = data.proveedor || null;
    
    console.log('Executing INSERT query...');
    const [result] = await connection.execute(
      `INSERT INTO transactions (
        tipo, monto, metodo, descripcion, categoria, proveedor, tienda, fecha
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.tipo, data.monto, data.metodo, descripcion, categoria, proveedor, data.tienda, data.fecha]
    );
    
    await connection.end();
    
    console.log('INSERT result:', result);
    const insertId = (result as any).insertId;
    const newRecord = { id: Number(insertId), ...data };
    console.log('Returning:', newRecord);
    return newRecord;
  } catch (error) {
    console.error('ERROR en INSERT SQL:', error);
    throw error;
  }
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
  
  // Filtro por tienda OBLIGATORIO (siempre aplicar)
  const tienda = filters?.tienda || 'admin';
  conditions.push(eq(inventoryPhones.tienda, tienda));
  
  if (filters?.estado) {
    conditions.push(eq(inventoryPhones.estado, filters.estado));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return await query.orderBy(desc(inventoryPhones.createdAt));
}

export async function createInventoryPhone(data: InsertInventoryPhone) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO inventory_phones (
        codigo, modelo, marca, imei, carrier, condicion,
        precioCompra, precioVenta, precioVentaReal, ganancia, estado, notas, tienda, fechaCompra, fechaVenta
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.codigo, data.modelo, data.marca || null, data.imei || null,
        data.carrier || null, data.condicion || 'usado_a', data.precioCompra,
        data.precioVenta || null, data.precioVentaReal || null, data.ganancia || null,
        data.estado || 'disponible', data.notas || null,
        data.tienda || 'admin', data.fechaCompra, data.fechaVenta || null
      ]
    );
    await connection.end();
    return { id: Number((result as any).insertId), ...data };
  } catch (error) {
    await connection.end();
    throw error;
  }
}

export async function updateInventoryPhone(id: number, data: Partial<InsertInventoryPhone>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(inventoryPhones).set(data).where(eq(inventoryPhones.id, id));
  return { success: true };
}

export async function sellInventoryPhone(id: number, precioVenta: string, fechaVenta: Date) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Obtener el teléfono
    const [phones] = await connection.execute(
      'SELECT * FROM inventory_phones WHERE id = ?',
      [id]
    );
    
    if (!Array.isArray(phones) || phones.length === 0) {
      throw new Error('Teléfono no encontrado');
    }
    
    const phone = phones[0] as any;
    
    // Calcular ganancia: precioVenta - precioCompra
    const ganancia = Number(precioVenta) - Number(phone.precioCompra);
    
    // Actualizar el teléfono
    await connection.execute(
      `UPDATE inventory_phones 
       SET estado = 'vendido', precioVenta = ?, fechaVenta = ?, ganancia = ?
       WHERE id = ?`,
      [precioVenta, fechaVenta, ganancia, id]
    );
    
    // Registrar ingreso automáticamente
    const descripcion = `Venta de teléfono ${phone.codigo} - ${phone.modelo}`;
    await connection.execute(
      `INSERT INTO transactions (tipo, monto, metodo, descripcion, categoria, tienda, fecha)
       VALUES ('ingreso', ?, 'efectivo', ?, 'venta_telefono', ?, ?)`,
      [ganancia, descripcion, phone.tienda, fechaVenta]
    );
    
    // Registrar movimiento de inventario (comentado temporalmente)
    // await connection.execute(
    //   `INSERT INTO inventory_movements (tipo, categoria, itemId, cantidad, monto, descripcion, fecha, tienda)
    //    VALUES ('venta', 'telefono', ?, 1, ?, ?, ?, ?)`,
    //   [id, precioVenta, descripcion, fechaVenta, phone.tienda]
    // );
    
    await connection.end();
    return { success: true, ganancia };
  } catch (error) {
    await connection.end();
    throw error;
  }
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
  
  // Filtro por tienda OBLIGATORIO (siempre aplicar)
  const tienda = filters?.tienda || 'admin';
  conditions.push(eq(inventoryAccessories.tienda, tienda));
  
  if (filters?.activo !== undefined) {
    conditions.push(eq(inventoryAccessories.activo, filters.activo));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return await query.orderBy(desc(inventoryAccessories.createdAt));
}

export async function createInventoryAccessory(data: InsertInventoryAccessory) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");

  const accessoryData = {
    ...data,
    cantidadActual: data.cantidadInicial,
    cantidadVendida: 0,
  };

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO inventory_accessories (
        codigo, nombre, categoria, precioCompraUnitario, precioVentaUnitario,
        cantidadInicial, cantidadActual, cantidadVendida, stockMinimo,
        tienda, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        accessoryData.codigo, accessoryData.nombre, accessoryData.categoria || null,
        accessoryData.precioCompraUnitario, accessoryData.precioVentaUnitario,
        accessoryData.cantidadInicial, accessoryData.cantidadActual,
        accessoryData.cantidadVendida, accessoryData.stockMinimo,
        accessoryData.tienda, accessoryData.activo ?? 1
      ]
    );
    await connection.end();
    return { id: Number((result as any).insertId), ...accessoryData };
  } catch (error) {
    await connection.end();
    throw error;
  }
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

export async function sellAccessory(id: number, cantidad: number, fecha: Date, precioVentaUnitario?: string) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Obtener el accesorio
    const [accessories] = await connection.execute(
      'SELECT * FROM inventory_accessories WHERE id = ?',
      [id]
    );
    
    if (!Array.isArray(accessories) || accessories.length === 0) {
      throw new Error('Accesorio no encontrado');
    }
    
    const accessory = accessories[0] as any;
    const currentCantidad = Number(accessory.cantidadActual);
    
    if (currentCantidad < cantidad) {
      throw new Error('Stock insuficiente');
    }
    
    const newCantidad = currentCantidad - cantidad;
    const newVendida = Number(accessory.cantidadVendida) + cantidad;
    
    // Calcular ganancia: (precioVenta - precioCompra) * cantidad
    // Usar el precio de venta proporcionado o el precio sugerido del accesorio
    const precioVenta = precioVentaUnitario ? Number(precioVentaUnitario) : Number(accessory.precioVentaUnitario);
    const gananciaUnitaria = precioVenta - Number(accessory.precioCompraUnitario);
    const gananciaTotal = gananciaUnitaria * cantidad;
    const montoVenta = precioVenta * cantidad;
    
    // Actualizar el accesorio
    await connection.execute(
      `UPDATE inventory_accessories 
       SET cantidadActual = ?, cantidadVendida = ?
       WHERE id = ?`,
      [newCantidad, newVendida, id]
    );
    
    // Registrar ingreso automáticamente
    const descripcion = `Venta de ${cantidad}x ${accessory.nombre} (${accessory.codigo})`;
    await connection.execute(
      `INSERT INTO transactions (tipo, monto, metodo, descripcion, categoria, tienda, fecha)
       VALUES ('ingreso', ?, 'efectivo', ?, 'venta_accesorio', ?, ?)`,
      [gananciaTotal, descripcion, accessory.tienda, fecha]
    );
    
    // Registrar movimiento de inventario (comentado temporalmente)
    // await connection.execute(
    //   `INSERT INTO inventory_movements (tipo, categoria, itemId, cantidad, monto, descripcion, fecha, tienda)
    //    VALUES ('venta', 'accesorio', ?, ?, ?, ?, ?, ?)`,
    //   [id, cantidad, montoVenta, descripcion, fecha, accessory.tienda]
    // );
    
    await connection.end();
    return { success: true, newCantidad, newVendida, ganancia: gananciaTotal };
  } catch (error) {
    await connection.end();
    throw error;
  }
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
  
  // Filtro por tienda OBLIGATORIO (siempre aplicar)
  const tienda = filters?.tienda || 'admin';
  conditions.push(eq(inventoryParts.tienda, tienda));
  
  if (filters?.activo !== undefined) {
    conditions.push(eq(inventoryParts.activo, filters.activo));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  return await query.orderBy(desc(inventoryParts.createdAt));
}

export async function createInventoryPart(data: InsertInventoryPart) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");

  const partData = {
    ...data,
    precioCompraUnitario: typeof data.precioCompraUnitario === 'string' ? data.precioCompraUnitario : String(data.precioCompraUnitario),
    cantidadActual: data.cantidadInicial,
    cantidadUsada: 0,
  };

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO inventory_parts (
        codigo, nombre, categoria, compatibilidad, precioCompraUnitario,
        cantidadInicial, cantidadActual, cantidadUsada, stockMinimo,
        tienda, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        partData.codigo, partData.nombre, partData.categoria || null,
        partData.compatibilidad || null, partData.precioCompraUnitario,
        partData.cantidadInicial, partData.cantidadActual,
        partData.cantidadUsada, partData.stockMinimo,
        partData.tienda, partData.activo ?? 1
      ]
    );
    await connection.end();
    return { id: Number((result as any).insertId), ...partData };
  } catch (error) {
    await connection.end();
    throw error;
  }
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
  
  // Filtro por tienda OBLIGATORIO (siempre aplicar)
  const tienda = filters?.tienda || 'admin';
  conditions.push(eq(repairs.tienda, tienda));
  
  if (filters?.estado) {
    conditions.push(eq(repairs.estado, filters.estado));
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
    cliente: data.cliente ?? null,
    telefono: data.telefono ?? null,
    dispositivo: data.dispositivo ?? null,
    problema: data.problema,
    diagnostico: data.diagnostico ?? null,
    precioManoObra: data.precioManoObra,
    precioTotal: data.precioTotal,
    costoPartes: costoPartes.toFixed(2),
    ganancia: ganancia.toFixed(2),
    fechaIngreso: data.fechaIngreso,
    tienda: data.tienda,
    notas: data.notas ?? null,
    tecnico: (data as any).tecnico ?? null,
    garantiaDias: (data as any).garantiaDias ?? 30,
    codigoDesbloqueo: (data as any).codigoDesbloqueo ?? null,
    checklistComponentes: (data as any).checklistComponentes ?? null,
    imagenesDispositivo: (data as any).imagenesDispositivo ?? null,
  };

  // Usar mysql2 directamente
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  
  try {
    const [result] = await connection.execute(
      `INSERT INTO repairs (
        codigo, cliente, telefono, dispositivo, problema, diagnostico,
        precioManoObra, precioTotal, costoPartes, ganancia,
        fechaIngreso, tienda, notas,
        tecnico, garantiaDias, codigoDesbloqueo, checklistComponentes, imagenesDispositivo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        repairData.codigo, repairData.cliente, repairData.telefono,
        repairData.dispositivo, repairData.problema, repairData.diagnostico,
        repairData.precioManoObra, repairData.precioTotal, repairData.costoPartes,
        repairData.ganancia, repairData.fechaIngreso, repairData.tienda,
        repairData.notas, repairData.tecnico, repairData.garantiaDias,
        repairData.codigoDesbloqueo, repairData.checklistComponentes, repairData.imagenesDispositivo
      ]
    );
    const repairId = Number((result as any).insertId);
    await connection.end();

    // Agregar partes si se proporcionan (conexión separada dentro de addRepairParts)
    if (data.partes && data.partes.length > 0) {
      try {
        await addRepairParts(repairId, data.partes);
      } catch (partsError: any) {
        // Las partes fallaron pero la reparación ya existe — registrar el error pero no fallar
        console.error('[createRepair] Error al agregar partes, reparación creada sin partes:', partsError.message);
      }
    }

    return { id: repairId, ...repairData };
  } catch (error) {
    try { await connection.end(); } catch {}
    throw error;
  }
}

export async function updateRepair(id: number, data: Partial<InsertRepair>) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Obtener la reparación actual
    const [repairs] = await connection.execute(
      'SELECT * FROM repairs WHERE id = ?',
      [id]
    );
    
    if (!Array.isArray(repairs) || repairs.length === 0) {
      throw new Error('Reparación no encontrada');
    }
    
    const repair = repairs[0] as any;
    const wasEntregada = repair.estado === 'entregada';
    const willBeEntregada = data.estado === 'entregada';
    
    // Construir el UPDATE dinámicamente
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.cliente !== undefined) {
      updates.push('cliente = ?');
      values.push(data.cliente);
    }
    if (data.telefono !== undefined) {
      updates.push('telefono = ?');
      values.push(data.telefono);
    }
    if (data.dispositivo !== undefined) {
      updates.push('dispositivo = ?');
      values.push(data.dispositivo);
    }
    if (data.problema !== undefined) {
      updates.push('problema = ?');
      values.push(data.problema);
    }
    if (data.diagnostico !== undefined) {
      updates.push('diagnostico = ?');
      values.push(data.diagnostico);
    }
    if (data.precioManoObra !== undefined) {
      updates.push('precioManoObra = ?');
      values.push(data.precioManoObra);
    }
    if (data.precioTotal !== undefined) {
      updates.push('precioTotal = ?');
      values.push(data.precioTotal);
    }
    if (data.estado !== undefined) {
      updates.push('estado = ?');
      values.push(data.estado);
    }
    if (data.fechaCompletado !== undefined) {
      updates.push('fechaCompletado = ?');
      values.push(data.fechaCompletado);
    }
    if (data.fechaEntrega !== undefined) {
      updates.push('fechaEntrega = ?');
      values.push(data.fechaEntrega);
    }
    if (data.notas !== undefined) {
      updates.push('notas = ?');
      values.push(data.notas);
    }
    if ((data as any).tecnico !== undefined) {
      updates.push('tecnico = ?');
      values.push((data as any).tecnico);
    }
    if ((data as any).garantiaDias !== undefined) {
      updates.push('garantiaDias = ?');
      values.push((data as any).garantiaDias);
    }
    if ((data as any).garantiaVence !== undefined) {
      updates.push('garantiaVence = ?');
      values.push((data as any).garantiaVence);
    }
    if ((data as any).pagado !== undefined) {
      updates.push('pagado = ?');
      values.push((data as any).pagado);
    }
    if ((data as any).codigoDesbloqueo !== undefined) {
      updates.push('codigoDesbloqueo = ?');
      values.push((data as any).codigoDesbloqueo);
    }
    if ((data as any).checklistComponentes !== undefined) {
      updates.push('checklistComponentes = ?');
      values.push((data as any).checklistComponentes);
    }
    if ((data as any).imagenesDispositivo !== undefined) {
      updates.push('imagenesDispositivo = ?');
      values.push((data as any).imagenesDispositivo);
    }
    
    if (updates.length > 0) {
      values.push(id);
      await connection.execute(
        `UPDATE repairs SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
    
    // Si se marca como entregada y no estaba entregada antes, registrar ingreso
    if (willBeEntregada && !wasEntregada) {
      const descripcion = `Reparación entregada ${repair.codigo} - ${repair.dispositivo}`;
      const fechaEntrega = data.fechaEntrega || new Date();
      
      // Registrar ingreso automáticamente con la ganancia
      await connection.execute(
        `INSERT INTO transactions (tipo, monto, metodo, descripcion, categoria, tienda, fecha)
         VALUES ('ingreso', ?, 'efectivo', ?, 'reparacion', ?, ?)`,
        [repair.ganancia, descripcion, repair.tienda, fechaEntrega]
      );
    }
    
    await connection.end();
    return { success: true };
  } catch (error) {
    await connection.end();
    throw error;
  }
}

export async function addRepairParts(
  repairId: number, 
  partes: { partId?: number; cantidad: number; nombre?: string; costoUnitario?: string }[]
) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");
  
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    let costoPartesTotal = 0;
    
    for (const parte of partes) {
      let costoUnitario: string;
      let partId: number | null = parte.partId || null;
      
      if (parte.partId) {
        // Parte del inventario
        const [parts] = await connection.execute(
          'SELECT * FROM inventory_parts WHERE id = ?',
          [parte.partId]
        );
        
        if (!Array.isArray(parts) || parts.length === 0) {
          throw new Error(`Parte con ID ${parte.partId} no encontrada`);
        }
        
        const part = parts[0] as any;
        costoUnitario = part.precioCompraUnitario;
        
        // Descontar del inventario
        const newCantidad = Number(part.cantidadActual) - parte.cantidad;
        const newUsada = Number(part.cantidadUsada) + parte.cantidad;
        
        if (newCantidad < 0) {
          throw new Error(`Stock insuficiente para ${part.nombre}`);
        }
        
        await connection.execute(
          'UPDATE inventory_parts SET cantidadActual = ?, cantidadUsada = ? WHERE id = ?',
          [newCantidad, newUsada, parte.partId]
        );
      } else {
        // Parte manual (no en inventario)
        if (!parte.costoUnitario) {
          throw new Error('costoUnitario es requerido para partes manuales');
        }
        costoUnitario = parte.costoUnitario;
      }
      
      const costoTotal = (Number(costoUnitario) * parte.cantidad).toFixed(2);
      costoPartesTotal += Number(costoTotal);
      
      // Insertar en repair_parts
      const esExterna = partId === null ? 1 : 0;
      const nombreExterno = esExterna ? (parte.nombre || 'Parte externa') : null;
      
      await connection.execute(
        `INSERT INTO repair_parts (repairId, partId, esExterna, nombreExterno, cantidad, costoUnitario, costoTotal)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [repairId, partId, esExterna, nombreExterno, parte.cantidad, costoUnitario, costoTotal]
      );
    }
    
    // Obtener el precio total y mano de obra de la reparación
    const [repairs] = await connection.execute(
      'SELECT precioTotal, precioManoObra FROM repairs WHERE id = ?',
      [repairId]
    );
    
    if (Array.isArray(repairs) && repairs.length > 0) {
      const repair = repairs[0] as any;
      const ganancia = Number(repair.precioTotal) - costoPartesTotal;
      
      // Actualizar costoPartes y ganancia de la reparación
      await connection.execute(
        'UPDATE repairs SET costoPartes = ?, ganancia = ? WHERE id = ?',
        [costoPartesTotal.toFixed(2), ganancia.toFixed(2), repairId]
      );
    }
    
    await connection.end();
    return { success: true, costoPartes: costoPartesTotal };
  } catch (error) {
    await connection.end();
    throw error;
  }
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

export async function getRepairById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(repairs).where(eq(repairs.id, id)).limit(1);
  return result[0] || null;
}

// Force redeploy Wed Jan 14 21:16:08 EST 2026
// Forced rebuild at 2026-01-21_13:16:40

// ==================== STORE CONFIG ====================
export async function getStoreConfig(tienda: 'admin' | 'sucursal') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(storeConfig).where(eq(storeConfig.tienda, tienda));
  return result[0] || null;
}

export async function updateStoreConfig(data: {
  tienda: 'admin' | 'sucursal';
  nombre: string;
  telefono?: string;
  direccion?: string;
  email?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(storeConfig)
    .set({
      nombre: data.nombre,
      telefono: data.telefono || null,
      direccion: data.direccion || null,
      email: data.email || null,
      ciudad: data.ciudad || null,
      estado: data.estado || null,
      codigoPostal: data.codigoPostal || null,
    })
    .where(eq(storeConfig.tienda, data.tienda));
  
  return await getStoreConfig(data.tienda);
}

// Inicializar configuración de tiendas con datos por defecto
export async function initializeStoreConfig() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot initialize store config: database not available");
    return;
  }
  
  try {
    // Verificar si ya existen configuraciones
    const adminConfig = await getStoreConfig('admin');
    const sucursalConfig = await getStoreConfig('sucursal');
    
    // Insertar configuración para admin si no existe
    if (!adminConfig) {
      await db.insert(storeConfig).values({
        tienda: 'admin',
        nombre: 'Fixopolis Solutions - Admin',
        telefono: '(512) XXX-XXXX',
        email: 'admin@1plusfixopolis.com',
        direccion: '123 Main Street',
        ciudad: 'Austin',
        estado: 'TX',
        codigoPostal: '78701',
      });
      console.log("[Database] Initialized store config for admin");
    }
    
    // Insertar configuración para sucursal si no existe
    if (!sucursalConfig) {
      await db.insert(storeConfig).values({
        tienda: 'sucursal',
        nombre: 'Fixopolis Solutions - Sucursal',
        telefono: '(512) YYY-YYYY',
        email: 'sucursal@1plusfixopolis.com',
        direccion: '456 Oak Avenue',
        ciudad: 'Austin',
        estado: 'TX',
        codigoPostal: '78702',
      });
      console.log("[Database] Initialized store config for sucursal");
    }
  } catch (error) {
    console.error("[Database] Failed to initialize store config:", error);
  }
}

// Migración: Actualizar constraint de unicidad en inventory_parts
export async function migrateInventoryPartsUniqueConstraint() {
  if (!process.env.DATABASE_URL) {
    console.warn("[Migration] Cannot run migration: DATABASE_URL not available");
    return;
  }

  const mysql = await import("mysql2/promise");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Verificar si el índice antiguo existe
    const [indexes] = await connection.execute(
      `SHOW INDEX FROM inventory_parts WHERE Key_name = 'codigo'`
    );
    
    if ((indexes as any[]).length > 0) {
      console.log("[Migration] Removing old unique constraint on 'codigo'...");
      await connection.execute(`ALTER TABLE inventory_parts DROP INDEX codigo`);
      console.log("[Migration] Old constraint removed successfully");
    }
    
    // Verificar si el nuevo índice ya existe
    const [newIndexes] = await connection.execute(
      `SHOW INDEX FROM inventory_parts WHERE Key_name = 'codigo_tienda_idx'`
    );
    
    if ((newIndexes as any[]).length === 0) {
      console.log("[Migration] Creating new unique constraint on 'codigo' + 'tienda'...");
      await connection.execute(
        `ALTER TABLE inventory_parts ADD UNIQUE INDEX codigo_tienda_idx (codigo, tienda)`
      );
      console.log("[Migration] New constraint created successfully");
    } else {
      console.log("[Migration] New constraint already exists, skipping");
    }
    
    await connection.end();
    console.log("[Migration] Inventory parts migration completed successfully");
  } catch (error) {
    await connection.end();
    console.error("[Migration] Failed to migrate inventory_parts:", error);
  }
}


// ==================== SERVIDOR REQUESTS (UnlockerFast) ====================

export async function getServidorRequests(tienda: 'admin' | 'sucursal') {
  const db = await getDb();
  if (!db) return [];
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [rows] = await connection.execute(
      `SELECT * FROM servidor_requests WHERE tienda = ? ORDER BY createdAt DESC LIMIT 200`,
      [tienda]
    );
    return rows as any[];
  } finally {
    await connection.end();
  }
}

export async function createServidorRequest(data: {
  tienda: 'admin' | 'sucursal';
  servicio: string;
  imei: string;
  notas?: string;
  orderId?: string;
  estado?: string;
  respuesta?: string;
  costo?: number;
}) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [result] = await connection.execute(
      `INSERT INTO servidor_requests (tienda, servicio, imei, notas, orderId, estado, respuesta, costo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.tienda,
        data.servicio,
        data.imei,
        data.notas || null,
        data.orderId || null,
        data.estado || 'pending',
        data.respuesta || null,
        data.costo || null,
      ]
    );
    const insertResult = result as any;
    return { id: insertResult.insertId, ...data };
  } finally {
    await connection.end();
  }
}

export async function updateServidorRequest(id: number, data: {
  estado?: string;
  respuesta?: string;
  orderId?: string;
  costo?: number;
}) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    await connection.execute(
      `UPDATE servidor_requests SET estado = COALESCE(?, estado), respuesta = COALESCE(?, respuesta), orderId = COALESCE(?, orderId), costo = COALESCE(?, costo) WHERE id = ?`,
      [data.estado || null, data.respuesta || null, data.orderId || null, data.costo || null, id]
    );
    return { success: true };
  } finally {
    await connection.end();
  }
}

export async function deleteServidorRequest(id: number) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    await connection.execute(`DELETE FROM servidor_requests WHERE id = ?`, [id]);
    return { success: true };
  } finally {
    await connection.end();
  }
}

// ============================================================
// POS TRANSACTIONS
// ============================================================

export interface PosItem {
  id: string;
  tipo: 'reparacion' | 'accesorio' | 'parte' | 'servicio';
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

export async function getPosTransactions(tienda: string, limit = 50) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [rows] = await connection.execute(
      `SELECT * FROM pos_transactions WHERE tienda = ? ORDER BY createdAt DESC LIMIT ${parseInt(String(limit), 10)}`,
      [tienda]
    ) as any[];
    return rows.map((r: any) => ({
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
      subtotal: parseFloat(r.subtotal),
      taxRate: parseFloat(r.taxRate),
      taxAmount: parseFloat(r.taxAmount),
      total: parseFloat(r.total),
      montoEfectivo: r.montoEfectivo ? parseFloat(r.montoEfectivo) : undefined,
      montoTarjeta: r.montoTarjeta ? parseFloat(r.montoTarjeta) : undefined,
      cambio: r.cambio ? parseFloat(r.cambio) : 0,
    }));
  } finally {
    await connection.end();
  }
}

export async function getPosTransactionById(id: number) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const [rows] = await connection.execute(
      `SELECT * FROM pos_transactions WHERE id = ?`,
      [id]
    ) as any[];
    if (!rows.length) return null;
    const r = rows[0];
    return {
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
      subtotal: parseFloat(r.subtotal),
      taxRate: parseFloat(r.taxRate),
      taxAmount: parseFloat(r.taxAmount),
      total: parseFloat(r.total),
      montoEfectivo: r.montoEfectivo ? parseFloat(r.montoEfectivo) : undefined,
      montoTarjeta: r.montoTarjeta ? parseFloat(r.montoTarjeta) : undefined,
      cambio: r.cambio ? parseFloat(r.cambio) : 0,
    };
  } finally {
    await connection.end();
  }
}

export async function generatePosCode(tienda: string): Promise<string> {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const prefix = tienda === 'admin' ? 'POS' : 'PSC';
    const [rows] = await connection.execute(
      `SELECT codigo FROM pos_transactions WHERE tienda = ? AND codigo LIKE ? ORDER BY id DESC LIMIT 1`,
      [tienda, `${prefix}-%`]
    ) as any[];
    if (!rows.length) return `${prefix}-001`;
    const last = rows[0].codigo as string;
    const num = parseInt(last.split('-')[1] || '0', 10);
    return `${prefix}-${String(num + 1).padStart(3, '0')}`;
  } finally {
    await connection.end();
  }
}

export async function createPosTransaction(data: {
  items: any[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'mixto';
  montoEfectivo?: number;
  montoTarjeta?: number;
  cambio?: number;
  clienteNombre?: string;
  clienteEmail?: string;
  clienteTelefono?: string;
  notas?: string;
  tienda: string;
  cajero?: string;
}) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const codigo = await generatePosCode(data.tienda);
    await connection.execute(
      `INSERT INTO pos_transactions (codigo, items, subtotal, taxRate, taxAmount, total, metodoPago, montoEfectivo, montoTarjeta, cambio, clienteNombre, clienteEmail, clienteTelefono, notas, estado, tienda, cajero)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completada', ?, ?)`,
      [
        codigo,
        JSON.stringify(data.items),
        data.subtotal,
        data.taxRate,
        data.taxAmount,
        data.total,
        data.metodoPago,
        data.montoEfectivo ?? null,
        data.montoTarjeta ?? null,
        data.cambio ?? 0,
        data.clienteNombre ?? null,
        data.clienteEmail ?? null,
        data.clienteTelefono ?? null,
        data.notas ?? null,
        data.tienda,
        data.cajero ?? null,
      ]
    );
    const [rows] = await connection.execute(
      `SELECT * FROM pos_transactions WHERE codigo = ?`,
      [codigo]
    ) as any[];
    const r = rows[0];
    return {
      ...r,
      items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
      subtotal: parseFloat(r.subtotal),
      taxRate: parseFloat(r.taxRate),
      taxAmount: parseFloat(r.taxAmount),
      total: parseFloat(r.total),
      montoEfectivo: r.montoEfectivo ? parseFloat(r.montoEfectivo) : undefined,
      montoTarjeta: r.montoTarjeta ? parseFloat(r.montoTarjeta) : undefined,
      cambio: r.cambio ? parseFloat(r.cambio) : 0,
    };
  } finally {
    await connection.end();
  }
}

export async function searchPosTransactions(params: {
  tienda: string;
  search?: string;
  metodoPago?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  try {
    const conditions: string[] = ['tienda = ?'];
    const values: any[] = [params.tienda];

    if (params.search) {
      conditions.push('(clienteNombre LIKE ? OR clienteEmail LIKE ? OR clienteTelefono LIKE ? OR codigo LIKE ?)');
      const s = `%${params.search}%`;
      values.push(s, s, s, s);
    }
    if (params.metodoPago && params.metodoPago !== 'todos') {
      conditions.push('metodoPago = ?');
      values.push(params.metodoPago);
    }
    if (params.dateFrom) {
      conditions.push('DATE(createdAt) >= ?');
      values.push(params.dateFrom);
    }
    if (params.dateTo) {
      conditions.push('DATE(createdAt) <= ?');
      values.push(params.dateTo);
    }

    const where = conditions.join(' AND ');
    const limit = parseInt(String(params.limit ?? 100), 10);
    const offset = parseInt(String(params.offset ?? 0), 10);

    const [rows] = await connection.execute(
      `SELECT * FROM pos_transactions WHERE ${where} ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}`,
      values
    ) as any[];

    const [countRows] = await connection.execute(
      `SELECT COUNT(*) as total FROM pos_transactions WHERE ${where}`,
      values
    ) as any[];

    return {
      transactions: rows.map((r: any) => ({
        ...r,
        items: typeof r.items === 'string' ? JSON.parse(r.items) : r.items,
        subtotal: parseFloat(r.subtotal),
        taxRate: parseFloat(r.taxRate),
        taxAmount: parseFloat(r.taxAmount),
        total: parseFloat(r.total),
        montoEfectivo: r.montoEfectivo ? parseFloat(r.montoEfectivo) : undefined,
        montoTarjeta: r.montoTarjeta ? parseFloat(r.montoTarjeta) : undefined,
        cambio: r.cambio ? parseFloat(r.cambio) : 0,
      })),
      total: countRows[0].total as number,
    };
  } finally {
    await connection.end();
  }
}

// ─── Customers (CRM) ──────────────────────────────────────────────────────────

export async function getCustomers(filters: { tienda?: string; busqueda?: string } = {}) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    let where = '1=1';
    const values: any[] = [];
    if (filters.tienda) { where += ' AND tienda = ?'; values.push(filters.tienda); }
    if (filters.busqueda) {
      where += ' AND (nombre LIKE ? OR telefono LIKE ? OR email LIKE ? OR empresa LIKE ?)';
      const q = `%${filters.busqueda}%`;
      values.push(q, q, q, q);
    }
    const [rows] = await connection.execute(
      `SELECT * FROM customers WHERE ${where} ORDER BY nombre ASC`,
      values
    ) as any[];
    return rows as Customer[];
  } finally {
    await connection.end();
  }
}

export async function createCustomer(data: {
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  empresa?: string;
  esEmpresa?: number;
  descuento?: number;
  fuenteAdquisicion?: string;
  notas?: string;
  tienda: string;
}) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const [result] = await connection.execute(
      `INSERT INTO customers (nombre, telefono, email, direccion, empresa, esEmpresa, descuento, fuenteAdquisicion, notas, tienda)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nombre, data.telefono ?? null, data.email ?? null, data.direccion ?? null,
        data.empresa ?? null, data.esEmpresa ?? 0, data.descuento ?? 0,
        data.fuenteAdquisicion ?? null, data.notas ?? null, data.tienda
      ]
    ) as any[];
    return { id: Number(result.insertId), ...data };
  } finally {
    await connection.end();
  }
}

export async function updateCustomer(id: number, data: Partial<InsertCustomer>) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const updates: string[] = [];
    const values: any[] = [];
    const fields = ['nombre', 'telefono', 'email', 'direccion', 'empresa', 'esEmpresa', 'descuento', 'fuenteAdquisicion', 'notas'] as const;
    for (const field of fields) {
      if ((data as any)[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push((data as any)[field]);
      }
    }
    if (updates.length > 0) {
      values.push(id);
      await connection.execute(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`, values);
    }
    return { success: true };
  } finally {
    await connection.end();
  }
}

export async function deleteCustomer(id: number) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await connection.execute('DELETE FROM customers WHERE id = ?', [id]);
    return { success: true };
  } finally {
    await connection.end();
  }
}

export async function getCustomerStats(customerId: number) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    // Buscar reparaciones del cliente por teléfono o nombre
    const [customer] = await connection.execute('SELECT * FROM customers WHERE id = ?', [customerId]) as any[];
    if (!Array.isArray(customer) || customer.length === 0) return { reparaciones: 0, totalGastado: 0 };
    const c = customer[0] as any;
    const [repRows] = await connection.execute(
      `SELECT COUNT(*) as total, COALESCE(SUM(precioTotal), 0) as totalGastado FROM repairs WHERE telefono = ? OR cliente = ?`,
      [c.telefono, c.nombre]
    ) as any[];
    return {
      reparaciones: Number(repRows[0].total),
      totalGastado: parseFloat(repRows[0].totalGastado),
    };
  } finally {
    await connection.end();
  }
}

// ─── Técnicos ────────────────────────────────────────────────────────────────

export async function listTechnicians(tienda?: string) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const [rows] = await connection.execute(
      `SELECT * FROM technicians ORDER BY activo DESC, nombre ASC`
    ) as any[];
    return rows as any[];
  } finally {
    await connection.end();
  }
}

export async function createTechnician(data: { nombre: string; especialidad?: string; telefono?: string; tienda?: string }) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const [result] = await connection.execute(
      `INSERT INTO technicians (nombre, especialidad, telefono, tienda) VALUES (?, ?, ?, ?)`,
      [data.nombre, data.especialidad || null, data.telefono || null, data.tienda || 'ADM']
    ) as any[];
    return { id: (result as any).insertId, ...data };
  } finally {
    await connection.end();
  }
}

export async function updateTechnician(id: number, data: { nombre?: string; especialidad?: string; telefono?: string; activo?: number }) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const fields: string[] = [];
    const values: any[] = [];
    if (data.nombre !== undefined) { fields.push('nombre = ?'); values.push(data.nombre); }
    if (data.especialidad !== undefined) { fields.push('especialidad = ?'); values.push(data.especialidad); }
    if (data.telefono !== undefined) { fields.push('telefono = ?'); values.push(data.telefono); }
    if (data.activo !== undefined) { fields.push('activo = ?'); values.push(data.activo); }
    if (fields.length === 0) return { id };
    values.push(id);
    await connection.execute(`UPDATE technicians SET ${fields.join(', ')} WHERE id = ?`, values);
    return { id, ...data };
  } finally {
    await connection.end();
  }
}

export async function deleteTechnician(id: number) {
  if (!process.env.DATABASE_URL) throw new Error("Database not available");
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    await connection.execute(`DELETE FROM technicians WHERE id = ?`, [id]);
    return { success: true };
  } finally {
    await connection.end();
  }
}
