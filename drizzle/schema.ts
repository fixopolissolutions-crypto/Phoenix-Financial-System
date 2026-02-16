import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, bigint, uniqueIndex } from "drizzle-orm/mysql-core";

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
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).default("admin"),
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
 * Historial semanal
 */
export const weeklyHistory = mysqlTable("weekly_history", {
  id: int("id").autoincrement().primaryKey(),
  weekStart: varchar("weekStart", { length: 10 }).notNull(), // YYYY-MM-DD
  weekEnd: varchar("weekEnd", { length: 10 }).notNull(), // YYYY-MM-DD
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).default("admin").notNull(),
  totalIngresos: decimal("totalIngresos", { precision: 10, scale: 2 }).default("0").notNull(),
  totalGastos: decimal("totalGastos", { precision: 10, scale: 2 }).default("0").notNull(),
  totalNomina: decimal("totalNomina", { precision: 10, scale: 2 }).default("0").notNull(),
  totalTax: decimal("totalTax", { precision: 10, scale: 2 }).default("0").notNull(),
  gananciaNeta: decimal("gananciaNeta", { precision: 10, scale: 2 }).default("0").notNull(),
  transaccionesCount: int("transaccionesCount").default(0).notNull(),
  pdfPath: varchar("pdfPath", { length: 500 }),
  emailSent: int("emailSent").default(0).notNull(), // 0 = no enviado, 1 = enviado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WeeklyHistory = typeof weeklyHistory.$inferSelect;
export type InsertWeeklyHistory = typeof weeklyHistory.$inferInsert;

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

/**
 * Inventario de Teléfonos
 */
export const inventoryPhones = mysqlTable("inventory_phones", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(), // TEL-001, TEL-002, etc.
  modelo: varchar("modelo", { length: 200 }).notNull(), // iPhone 13 Pro 256GB Gold
  marca: varchar("marca", { length: 100 }), // Apple, Samsung, Google
  imei: varchar("imei", { length: 50 }), // IMEI único del teléfono
  carrier: varchar("carrier", { length: 50 }), // Unlocked, Verizon, AT&T, etc.
  condicion: mysqlEnum("condicion", ["nuevo", "usado_a", "usado_b", "usado_c", "para_partes"]).default("usado_a").notNull(),
  precioCompra: decimal("precioCompra", { precision: 10, scale: 2 }).notNull(), // Inversión
  precioVenta: decimal("precioVenta", { precision: 10, scale: 2 }), // Precio al que se vendió
  precioVentaReal: decimal("precioVentaReal", { precision: 10, scale: 2 }), // Precio real de venta
  ganancia: decimal("ganancia", { precision: 10, scale: 2 }), // Ganancia obtenida
  estado: mysqlEnum("estado", ["disponible", "vendido", "reservado"]).default("disponible").notNull(),
  fechaCompra: timestamp("fechaCompra").notNull(),
  fechaVenta: timestamp("fechaVenta"),
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).default("admin").notNull(),
  notas: text("notas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryPhone = typeof inventoryPhones.$inferSelect;
export type InsertInventoryPhone = typeof inventoryPhones.$inferInsert;

/**
 * Inventario de Accesorios
 */
export const inventoryAccessories = mysqlTable("inventory_accessories", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(), // ACC-001, ACC-002, etc.
  nombre: varchar("nombre", { length: 200 }).notNull(), // Case iPhone 13 Pro Silicone Black
  categoria: varchar("categoria", { length: 100 }), // Cases, Chargers, Cables, etc.
  precioCompraUnitario: decimal("precioCompraUnitario", { precision: 10, scale: 2 }).notNull(),
  precioVentaUnitario: decimal("precioVentaUnitario", { precision: 10, scale: 2 }).notNull(),
  cantidadInicial: int("cantidadInicial").notNull(), // Cantidad al crear el producto
  cantidadActual: int("cantidadActual").notNull(), // Cantidad disponible
  cantidadVendida: int("cantidadVendida").default(0).notNull(), // Total vendido
  stockMinimo: int("stockMinimo").default(5).notNull(), // Alerta de stock bajo
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).default("admin").notNull(),
  activo: int("activo").default(1).notNull(), // 1 = activo, 0 = descontinuado
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InventoryAccessory = typeof inventoryAccessories.$inferSelect;
export type InsertInventoryAccessory = typeof inventoryAccessories.$inferInsert;

/**
 * Inventario de Partes para Reparación
 */
export const inventoryParts = mysqlTable("inventory_parts", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull(), // PART-001, PART-002, etc.
  nombre: varchar("nombre", { length: 200 }).notNull(), // Pantalla iPhone 13 Pro OLED
  categoria: varchar("categoria", { length: 100 }), // Pantallas, Baterías, Cámaras, etc.
  compatibilidad: text("compatibilidad"), // iPhone 13 Pro, iPhone 13 Pro Max
  precioCompraUnitario: decimal("precioCompraUnitario", { precision: 10, scale: 2 }).notNull(),
  cantidadInicial: int("cantidadInicial").notNull(),
  cantidadActual: int("cantidadActual").notNull(),
  cantidadUsada: int("cantidadUsada").default(0).notNull(), // Total usado en reparaciones
  stockMinimo: int("stockMinimo").default(2).notNull(),
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).default("admin").notNull(),
  activo: int("activo").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Índice único compuesto: cada tienda puede tener sus propios códigos de partes
  codigoTiendaIdx: uniqueIndex("codigo_tienda_idx").on(table.codigo, table.tienda),
}));

export type InventoryPart = typeof inventoryParts.$inferSelect;
export type InsertInventoryPart = typeof inventoryParts.$inferInsert;

/**
 * Reparaciones
 */
export const repairs = mysqlTable("repairs", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(), // REP-001, REP-002, etc.
  cliente: varchar("cliente", { length: 200 }), // Nombre del cliente (opcional)
  telefono: varchar("telefono", { length: 50 }),
  dispositivo: varchar("dispositivo", { length: 200 }).notNull(), // iPhone 13 Pro
  problema: text("problema").notNull(), // Descripción del problema
  diagnostico: text("diagnostico"), // Diagnóstico técnico
  precioManoObra: decimal("precioManoObra", { precision: 10, scale: 2 }).notNull(), // Costo de la reparación
  precioTotal: decimal("precioTotal", { precision: 10, scale: 2 }).notNull(), // Precio total cobrado al cliente
  costoPartes: decimal("costoPartes", { precision: 10, scale: 2 }).default("0").notNull(), // Costo de partes usadas
  ganancia: decimal("ganancia", { precision: 10, scale: 2 }).notNull(), // precioTotal - costoPartes
  estado: mysqlEnum("estado", ["pendiente", "en_proceso", "completada", "entregada"]).default("pendiente").notNull(),
  fechaIngreso: timestamp("fechaIngreso").notNull(),
  fechaCompletado: timestamp("fechaCompletado"),
  fechaEntrega: timestamp("fechaEntrega"),
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).default("admin").notNull(),
  pagado: int("pagado").default(0).notNull(), // 0 = no pagado, 1 = pagado
  notas: text("notas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Repair = typeof repairs.$inferSelect;
export type InsertRepair = typeof repairs.$inferInsert;

/**
 * Partes usadas en Reparaciones (relación muchos a muchos)
 */
export const repairParts = mysqlTable("repair_parts", {
  id: int("id").autoincrement().primaryKey(),
  repairId: int("repairId").notNull(), // FK a repairs
  partId: int("partId"), // FK a inventory_parts (null si es parte externa)
  esExterna: int("esExterna").default(0).notNull(), // 0 = del inventario, 1 = externa
  nombreExterno: varchar("nombreExterno", { length: 200 }), // Nombre si es parte externa
  cantidad: int("cantidad").notNull(), // Cantidad de partes usadas
  costoUnitario: decimal("costoUnitario", { precision: 10, scale: 2 }).notNull(), // Costo al momento de usar
  costoTotal: decimal("costoTotal", { precision: 10, scale: 2 }).notNull(), // cantidad * costoUnitario
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RepairPart = typeof repairParts.$inferSelect;
export type InsertRepairPart = typeof repairParts.$inferInsert;

/**
 * Movimientos de Inventario (historial de compras, ventas, uso)
 */
export const inventoryMovements = mysqlTable("inventory_movements", {
  id: int("id").autoincrement().primaryKey(),
  tipo: mysqlEnum("tipo", ["compra", "venta", "uso", "ajuste"]).notNull(),
  categoria: mysqlEnum("categoria", ["telefono", "accesorio", "parte"]).notNull(),
  itemId: int("itemId").notNull(), // ID del item (phone, accessory o part)
  cantidad: int("cantidad").notNull(), // Cantidad movida
  monto: decimal("monto", { precision: 10, scale: 2 }).notNull(), // Monto del movimiento
  descripcion: text("descripcion"),
  relacionId: int("relacionId"), // ID de la transacción relacionada (venta, reparación, etc.)
  relacionTipo: varchar("relacionTipo", { length: 50 }), // "repair", "sale", etc.
  fecha: timestamp("fecha").notNull(),
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).default("admin").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = typeof inventoryMovements.$inferInsert;

/**
 * Configuración de Tiendas
 */
export const storeConfig = mysqlTable("store_config", {
  id: int("id").autoincrement().primaryKey(),
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).notNull().unique(),
  nombre: varchar("nombre", { length: 200 }).notNull(), // Nombre del negocio
  telefono: varchar("telefono", { length: 50 }), // Número de teléfono
  direccion: text("direccion"), // Dirección física
  email: varchar("email", { length: 320 }), // Email de contacto
  ciudad: varchar("ciudad", { length: 100 }), // Ciudad
  estado: varchar("estado", { length: 100 }), // Estado/Provincia
  codigoPostal: varchar("codigoPostal", { length: 20 }), // Código postal
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StoreConfig = typeof storeConfig.$inferSelect;
