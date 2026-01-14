import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    // Login local para admin/sucursal
    loginLocal: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input }) => {
        const credential = await db.getCredential(input.username);
        if (!credential || credential.password !== input.password) {
          return { success: false, error: 'Credenciales inválidas' };
        }
        return { 
          success: true, 
          user: { 
            username: credential.username, 
            tienda: credential.tienda,
            role: credential.tienda === 'admin' ? 'admin' : 'user'
          } 
        };
      }),
  }),

  // ==================== TRANSACTIONS ====================
  transactions: router({
    list: publicProcedure
      .input(z.object({
        tipo: z.enum(['ingreso', 'gasto']).optional(),
        tienda: z.enum(['admin', 'sucursal']).optional(),
        fechaInicio: z.string().optional(),
        fechaFin: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const filters = input ? {
          tipo: input.tipo,
          tienda: input.tienda,
          fechaInicio: input.fechaInicio ? new Date(input.fechaInicio) : undefined,
          fechaFin: input.fechaFin ? new Date(input.fechaFin) : undefined,
        } : undefined;
        return await db.getTransactions(filters);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getTransactionById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        tipo: z.enum(['ingreso', 'gasto']),
        monto: z.string(),
        metodo: z.enum(['efectivo', 'banco']),
        descripcion: z.string().optional(),
        categoria: z.string().optional(),
        proveedor: z.string().optional(),
        tienda: z.enum(['admin', 'sucursal']).default('admin'),
        fecha: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createTransaction({
          ...input,
          fecha: input.fecha ? new Date(input.fecha) : new Date(),
        });
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        monto: z.string().optional(),
        metodo: z.enum(['efectivo', 'banco']).optional(),
        descripcion: z.string().optional(),
        categoria: z.string().optional(),
        proveedor: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateTransaction(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteTransaction(input.id);
      }),

    dailySummary: publicProcedure
      .input(z.object({
        tienda: z.enum(['admin', 'sucursal']),
        fecha: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getDailySummary(input.tienda, input.fecha);
      }),
  }),

  // ==================== PROVIDERS ====================
  providers: router({
    list: publicProcedure.query(async () => {
      return await db.getProviders();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getProviderById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        nombre: z.string(),
        telefono: z.string().optional(),
        email: z.string().optional(),
        direccion: z.string().optional(),
        notas: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createProvider(input);
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        nombre: z.string().optional(),
        telefono: z.string().optional(),
        email: z.string().optional(),
        direccion: z.string().optional(),
        notas: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateProvider(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteProvider(input.id);
      }),
  }),

  // ==================== EMPLOYEES ====================
  employees: router({
    list: publicProcedure
      .input(z.object({
        tienda: z.enum(['admin', 'sucursal']).optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getEmployees(input?.tienda);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmployeeById(input.id);
      }),

    create: publicProcedure
      .input(z.object({
        nombre: z.string(),
        puesto: z.string().optional(),
        salario: z.string().optional(),
        telefono: z.string().optional(),
        email: z.string().optional(),
        tienda: z.enum(['admin', 'sucursal']).default('admin'),
      }))
      .mutation(async ({ input }) => {
        return await db.createEmployee(input);
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        nombre: z.string().optional(),
        puesto: z.string().optional(),
        salario: z.string().optional(),
        telefono: z.string().optional(),
        email: z.string().optional(),
        activo: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateEmployee(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteEmployee(input.id);
      }),
  }),

  // ==================== PAYROLL ====================
  payroll: router({
    list: publicProcedure
      .input(z.object({
        employeeId: z.number().optional(),
        tienda: z.enum(['admin', 'sucursal']).optional(),
        fechaInicio: z.string().optional(),
        fechaFin: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const filters = input ? {
          employeeId: input.employeeId,
          tienda: input.tienda,
          fechaInicio: input.fechaInicio ? new Date(input.fechaInicio) : undefined,
          fechaFin: input.fechaFin ? new Date(input.fechaFin) : undefined,
        } : undefined;
        return await db.getPayrollRecords(filters);
      }),

    create: publicProcedure
      .input(z.object({
        employeeId: z.number(),
        monto: z.string(),
        metodo: z.enum(['efectivo', 'banco']),
        descripcion: z.string().optional(),
        tienda: z.enum(['admin', 'sucursal']).default('admin'),
        fecha: z.string().optional(),
        empleadoNombre: z.string(),
      }))
      .mutation(async ({ input }) => {
        // Crear el registro de nómina
        const payrollRecord = await db.createPayrollRecord({
          employeeId: input.employeeId,
          monto: input.monto,
          metodo: input.metodo,
          descripcion: input.descripcion,
          tienda: input.tienda,
          fecha: input.fecha ? new Date(input.fecha) : new Date(),
        });

        // Crear automáticamente un gasto con categoría "Nómina"
        await db.createTransaction({
          tipo: 'gasto',
          monto: input.monto,
          metodo: input.metodo,
          descripcion: `Pago de nómina - ${input.empleadoNombre}`,
          categoria: 'Nómina',
          tienda: input.tienda,
          fecha: input.fecha ? new Date(input.fecha) : new Date(),
        });

        return payrollRecord;
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deletePayrollRecord(input.id);
      }),
  }),

  // ==================== CONFIG ====================
  config: router({
    get: publicProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return await db.getConfig(input.key);
      }),

    set: publicProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.setConfig(input.key, input.value);
      }),

    getAll: publicProcedure.query(async () => {
      return await db.getAllConfig();
    }),
  }),

  // ==================== CREDENTIALS ====================
  credentials: router({
    upsert: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
        tienda: z.enum(['admin', 'sucursal']).default('admin'),
      }))
      .mutation(async ({ input }) => {
        return await db.upsertCredential(input);
      }),
  }),

  // ==================== LOCAL USERS ====================
  localUsers: router({
    changePassword: publicProcedure
      .input(z.object({
        username: z.string(),
        newPassword: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateCredentialPassword(input.username, input.newPassword);
      }),
  }),

  // ==================== DAILY HISTORY ====================
  history: router({
    list: publicProcedure
      .input(z.object({
        tienda: z.enum(['admin', 'sucursal']).optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getDailyHistoryRecords(input?.tienda, input?.limit);
      }),

    save: publicProcedure
      .input(z.object({
        fecha: z.string(),
        tienda: z.enum(['admin', 'sucursal']),
        totalIngresos: z.string(),
        totalGastos: z.string(),
        totalNomina: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.saveDailyHistory({
          ...input,
          totalNomina: input.totalNomina || '0',
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;
