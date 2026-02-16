# Diagnóstico Detallado - Problema de Reparaciones

## Fecha: 15 de febrero de 2026

## Problema Reportado
Las reparaciones no se pueden ingresar en el sistema a pesar de las correcciones realizadas en el cálculo de ganancia.

## Hallazgos del Análisis

### 1. Estado de la Aplicación en Railway
- **URL**: https://phoenix-financial-system-production.up.railway.app/
- **Estado**: 404 Not Found - Aplicación no desplegada
- **Causa probable**: Fallo en el build o en el inicio del servidor

### 2. Análisis del Esquema de Base de Datos

#### Tabla `repairs` (líneas 247-268 de schema.ts)
```typescript
export const repairs = mysqlTable("repairs", {
  id: int("id").autoincrement().primaryKey(),
  codigo: varchar("codigo", { length: 50 }).notNull().unique(),
  cliente: varchar("cliente", { length: 200 }),
  telefono: varchar("telefono", { length: 50 }),
  dispositivo: varchar("dispositivo", { length: 200 }).notNull(),
  problema: text("problema").notNull(),
  diagnostico: text("diagnostico"),
  precioManoObra: decimal("precioManoObra", { precision: 10, scale: 2 }).notNull(),
  precioTotal: decimal("precioTotal", { precision: 10, scale: 2 }).notNull(),
  costoPartes: decimal("costoPartes", { precision: 10, scale: 2 }).default("0").notNull(),
  ganancia: decimal("ganancia", { precision: 10, scale: 2 }).notNull(),
  estado: mysqlEnum("estado", ["pendiente", "en_proceso", "completada", "entregada"]).default("pendiente").notNull(),
  fechaIngreso: timestamp("fechaIngreso").notNull(),
  fechaCompletado: timestamp("fechaCompletado"),
  fechaEntrega: timestamp("fechaEntrega"),
  tienda: mysqlEnum("tienda", ["admin", "sucursal"]).default("admin").notNull(),
  pagado: int("pagado").default(0).notNull(),
  notas: text("notas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

### 3. Análisis del Router tRPC (routers.ts líneas 629-662)

#### Input del endpoint `repairs.create`:
```typescript
.input(z.object({
  codigo: z.string(),
  cliente: z.string().optional(),
  telefono: z.string().optional(),
  dispositivo: z.string(),
  problema: z.string(),
  diagnostico: z.string().optional(),
  precioManoObra: z.string(),  // ⚠️ STRING en tRPC
  precioTotal: z.string(),      // ⚠️ STRING en tRPC
  fechaIngreso: z.string(),
  notas: z.string().optional(),
  partes: z.array(z.object({
    partId: z.number(),
    cantidad: z.number(),
  })).optional(),
}))
```

### 4. Análisis de la Función `createRepair` (db.ts líneas 968-1018)

#### Problema Identificado #1: Uso de mysql2 directamente
La función usa `mysql2` directamente en lugar de Drizzle ORM:
```typescript
const connection = await mysql.createConnection(process.env.DATABASE_URL!);

const [result] = await connection.execute(
  `INSERT INTO repairs (
    codigo, cliente, telefono, dispositivo, problema, diagnostico,
    precioManoObra, precioTotal, costoPartes, ganancia,
    fechaIngreso, tienda, notas
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [...]
);
```

#### Problema Identificado #2: Tipos de Datos
- **tRPC recibe**: `precioManoObra` y `precioTotal` como **strings**
- **Base de datos espera**: `decimal(10,2)` 
- **Conversión**: Se hace con `Number()` pero se inserta como string en el SQL

### 5. Posibles Causas del Error

1. **Error de tipo de datos**: Los precios se reciben como strings pero pueden no estar convirtiéndose correctamente
2. **Error en la inserción SQL**: La consulta SQL manual puede tener problemas de sintaxis o tipos
3. **Error de conexión**: La conexión a la base de datos puede fallar
4. **Error en el cálculo de ganancia**: Aunque se corrigió la fórmula, puede haber problemas con valores null o undefined
5. **Error en el manejo de partes**: Si se proporcionan partes, el bucle puede fallar

### 6. Recomendaciones de Corrección

#### Opción A: Migrar a Drizzle ORM (Recomendado)
Reemplazar la consulta SQL manual con Drizzle ORM para mayor type-safety:
```typescript
const [newRepair] = await db.insert(repairs).values(repairData);
```

#### Opción B: Mejorar el Manejo de Tipos
Asegurar que todos los valores numéricos se conviertan correctamente:
```typescript
precioManoObra: Number(data.precioManoObra).toFixed(2),
precioTotal: Number(data.precioTotal).toFixed(2),
```

#### Opción C: Agregar Mejor Manejo de Errores
Capturar y loggear errores específicos para identificar el problema exacto.

## Próximos Pasos

1. **Revisar logs de Railway** para ver el error específico
2. **Probar localmente** la creación de reparaciones con datos de prueba
3. **Implementar corrección** basada en el error identificado
4. **Desplegar y verificar** en Railway

## Archivos a Revisar/Modificar

- `/home/ubuntu/server/db.ts` (función `createRepair`)
- `/home/ubuntu/server/routers.ts` (router de repairs)
- `/home/ubuntu/client/src/pages/*` (formularios de reparaciones)
