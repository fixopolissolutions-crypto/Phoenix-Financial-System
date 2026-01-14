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
  credentials, InsertCredential
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
  if (filters?.fechaInicio) {
    conditions.push(gte(transactions.fecha, filters.fechaInicio));
  }
  if (filters?.fechaFin) {
    conditions.push(lte(transactions.fecha, filters.fechaFin));
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

  const result = await db.insert(transactions).values(data);
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

  const result = await db.insert(providers).values(data);
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

  const result = await db.insert(employees).values(data);
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

  const result = await db.insert(payroll).values(data);
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

  const result = await db.insert(dailyHistory).values(data);
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

  const result = await db.insert(weeklyHistory).values(data);
  return { id: Number(result[0].insertId), ...data };
}

export async function updateWeeklyHistoryEmailStatus(pdfPath: string, emailSent: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(weeklyHistory)
    .set({ emailSent })
    .where(eq(weeklyHistory.pdfPath, pdfPath));
}
