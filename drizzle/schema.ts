import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Transacciones - Ingresos y Gastos
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  tipo: mysqlEnum("tipo", ["ingreso", "gasto"]).notNull(),
  monto: decimal("monto", { precision: 10, scale: 2 }).notNull(),
  metodo: mysqlEnum("metodo", ["efectivo", "banco"]).notNull(),
  descripcion: text("descripcion"),
  categoria: varchar("categoria", { length: 100 }),
  proveedor: varchar("proveedor", { length: 200 }),
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).default("admin").notNull(),
  fecha: timestamp("fecha").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Proveedores
 */
export const providers = mysqlTable("providers", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  telefono: varchar("telefono", { length: 50 }),
  email: varchar("email", { length: 320 }),
  direccion: text("direccion"),
  notas: text("notas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Provider = typeof providers.$inferSelect;
export type InsertProvider = typeof providers.$inferInsert;

/**
 * Empleados
 */
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 200 }).notNull(),
  puesto: varchar("puesto", { length: 100 }),
  salario: decimal("salario", { precision: 10, scale: 2 }),
  telefono: varchar("telefono", { length: 50 }),
  email: varchar("email", { length: 320 }),
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).default("admin").notNull(),
  activo: int("activo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

/**
 * Pagos de Nómina
 */
export const payroll = mysqlTable("payroll", {
  id: int("id").autoincrement().primaryKey(),
  employeeId: int("employeeId").notNull(),
  monto: decimal("monto", { precision: 10, scale: 2 }).notNull(),
  metodo: mysqlEnum("metodo", ["efectivo", "banco"]).notNull(),
  descripcion: text("descripcion"),
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).default("admin").notNull(),
  fecha: timestamp("fecha").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payroll = typeof payroll.$inferSelect;
export type InsertPayroll = typeof payroll.$inferInsert;

/**
 * Configuración del sistema
 */
export const config = mysqlTable("config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Config = typeof config.$inferSelect;
export type InsertConfig = typeof config.$inferInsert;

/**
 * Datos históricos diarios
 */
export const dailyHistory = mysqlTable("daily_history", {
  id: int("id").autoincrement().primaryKey(),
  fecha: varchar("fecha", { length: 10 }).notNull(), // YYYY-MM-DD
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).default("admin").notNull(),
  totalIngresos: decimal("totalIngresos", { precision: 10, scale: 2 }).default("0").notNull(),
  totalGastos: decimal("totalGastos", { precision: 10, scale: 2 }).default("0").notNull(),
  totalNomina: decimal("totalNomina", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyHistory = typeof dailyHistory.$inferSelect;
export type InsertDailyHistory = typeof dailyHistory.$inferInsert;

/**
 * Credenciales de acceso (para usuarios locales admin/sucursal)
 */
export const credentials = mysqlTable("credentials", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).default("admin").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Credential = typeof credentials.$inferSelect;
export type InsertCredential = typeof credentials.$inferInsert;
