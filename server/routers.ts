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
        console.log('=== CREATE TRANSACTION ===');
        console.log('Input recibido:', JSON.stringify(input, null, 2));
        console.log('Tipo de monto:', typeof input.monto);
        try {
          const result = await db.createTransaction({
            ...input,
            fecha: input.fecha ? new Date(input.fecha) : new Date(),
          });
          console.log('Transacción creada exitosamente:', result);
          return result;
        } catch (error) {
          console.error('ERROR al crear transacción:', error);
          throw error;
        }
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

  // ==================== INVENTORY PHONES ====================
  inventoryPhones: router({
    list: publicProcedure
      .input(z.object({
        estado: z.enum(['disponible', 'vendido', 'reservado']).optional(),
        tienda: z.enum(['admin', 'sucursal']).optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getInventoryPhones(input);
      }),

    create: publicProcedure
      .input(z.object({
        codigo: z.string(),
        modelo: z.string(),
        marca: z.string(),
        imei: z.string().optional(),
        carrier: z.string().optional(),
        condicion: z.enum(['nuevo', 'usado_a', 'usado_b', 'usado_c', 'para_partes']).default('usado_a'),
        precioCompra: z.string(),
        fechaCompra: z.string(),
        tienda: z.enum(['admin', 'sucursal']).default('admin'),
        notas: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        console.log('=== CREATE INVENTORY PHONE ===');
        console.log('Input recibido:', JSON.stringify(input, null, 2));
        try {
          const result = await db.createInventoryPhone({
            ...input,
            fechaCompra: new Date(input.fechaCompra),
          });
          console.log('Teléfono creado exitosamente:', result);
          return result;
        } catch (error) {
          console.error('ERROR al crear teléfono:', error);
          throw error;
        }
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        modelo: z.string().optional(),
        marca: z.string().optional(),
        imei: z.string().optional(),
        carrier: z.string().optional(),
        condicion: z.enum(['nuevo', 'usado_a', 'usado_b', 'usado_c', 'para_partes']).optional(),
        precioCompra: z.string().optional(),
        notas: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateInventoryPhone(input.id, input);
      }),

    sell: publicProcedure
      .input(z.object({
        id: z.number(),
        precioVenta: z.string(),
        fechaVenta: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.sellInventoryPhone(input.id, input.precioVenta, new Date(input.fechaVenta));
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteInventoryPhone(input.id);
      }),
  }),

  // ==================== INVENTORY ACCESSORIES ====================
  inventoryAccessories: router({
    list: publicProcedure
      .input(z.object({
        tienda: z.enum(['admin', 'sucursal']).optional(),
        activo: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getInventoryAccessories(input);
      }),

    create: publicProcedure
      .input(z.object({
        codigo: z.string(),
        nombre: z.string(),
        categoria: z.string().optional(),
        precioCompraUnitario: z.string(),
        precioVentaUnitario: z.string(),
        cantidadInicial: z.number(),
        stockMinimo: z.number().default(5),
        tienda: z.enum(['admin', 'sucursal']).default('admin'),
      }))
      .mutation(async ({ input }) => {
        return await db.createInventoryAccessory({
          ...input,
          cantidadActual: input.cantidadInicial,
          cantidadVendida: 0,
        });
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        nombre: z.string().optional(),
        categoria: z.string().optional(),
        precioCompraUnitario: z.string().optional(),
        precioVentaUnitario: z.string().optional(),
        stockMinimo: z.number().optional(),
        activo: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateInventoryAccessory(input.id, input);
      }),

    addStock: publicProcedure
      .input(z.object({
        id: z.number(),
        cantidad: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.addAccessoryStock(input.id, input.cantidad);
      }),

    sell: publicProcedure
      .input(z.object({
        id: z.number(),
        cantidad: z.number(),
        fecha: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.sellAccessory(input.id, input.cantidad, new Date(input.fecha));
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteInventoryAccessory(input.id);
      }),
  }),

  // ==================== INVENTORY PARTS ====================
  inventoryParts: router({
    list: publicProcedure
      .input(z.object({
        tienda: z.enum(['admin', 'sucursal']).optional(),
        activo: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getInventoryParts(input);
      }),

    create: publicProcedure
      .input(z.object({
        codigo: z.string(),
        nombre: z.string(),
        categoria: z.string().optional(),
        compatibilidad: z.string().optional(),
        precioCompraUnitario: z.string(),
        cantidadInicial: z.number(),
        stockMinimo: z.number().default(2),
        tienda: z.enum(['admin', 'sucursal']).default('admin'),
      }))
      .mutation(async ({ input }) => {
        return await db.createInventoryPart({
          ...input,
          cantidadActual: input.cantidadInicial,
          cantidadUsada: 0,
        });
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        nombre: z.string().optional(),
        categoria: z.string().optional(),
        compatibilidad: z.string().optional(),
        precioCompraUnitario: z.string().optional(),
        stockMinimo: z.number().optional(),
        activo: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateInventoryPart(input.id, input);
      }),

    addStock: publicProcedure
      .input(z.object({
        id: z.number(),
        cantidad: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.addPartStock(input.id, input.cantidad);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteInventoryPart(input.id);
      }),
  }),

  // ==================== REPAIRS ====================
  repairs: router({
    list: publicProcedure
      .input(z.object({
        estado: z.enum(['pendiente', 'en_proceso', 'completada', 'entregada']).optional(),
        tienda: z.enum(['admin', 'sucursal']).optional(),
        fechaInicio: z.string().optional(),
        fechaFin: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const filters = input ? {
          estado: input.estado,
          tienda: input.tienda,
          fechaInicio: input.fechaInicio ? new Date(input.fechaInicio) : undefined,
          fechaFin: input.fechaFin ? new Date(input.fechaFin) : undefined,
        } : undefined;
        return await db.getRepairs(filters);
      }),

    create: publicProcedure
      .input(z.object({
        codigo: z.string(),
        cliente: z.string().optional(),
        telefono: z.string().optional(),
        dispositivo: z.string(),
        problema: z.string(),
        diagnostico: z.string().optional(),
        precioManoObra: z.string(),
        precioTotal: z.string(),
        fechaIngreso: z.string(),
        tienda: z.enum(['admin', 'sucursal']).default('admin'),
        notas: z.string().optional(),
        partes: z.array(z.object({
          partId: z.number(),
          cantidad: z.number(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        console.log('=== CREATE REPAIR ===');
        console.log('Input recibido:', JSON.stringify(input, null, 2));
        try {
          const result = await db.createRepair({
            ...input,
            fechaIngreso: new Date(input.fechaIngreso),
            ganancia: (Number(input.precioTotal) - Number(input.precioManoObra)).toFixed(2),
          });
          console.log('Reparación creada exitosamente:', result);
          return result;
        } catch (error) {
          console.error('ERROR al crear reparación:', error);
          throw error;
        }
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        cliente: z.string().optional(),
        telefono: z.string().optional(),
        dispositivo: z.string().optional(),
        problema: z.string().optional(),
        diagnostico: z.string().optional(),
        precioManoObra: z.string().optional(),
        precioTotal: z.string().optional(),
        estado: z.enum(['pendiente', 'en_proceso', 'completada', 'entregada']).optional(),
        fechaCompletado: z.string().optional(),
        fechaEntrega: z.string().optional(),
        notas: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const updateData: any = { ...input };
        if (input.fechaCompletado) updateData.fechaCompletado = new Date(input.fechaCompletado);
        if (input.fechaEntrega) updateData.fechaEntrega = new Date(input.fechaEntrega);
        return await db.updateRepair(input.id, updateData);
      }),

    addParts: publicProcedure
      .input(z.object({
        repairId: z.number(),
        partes: z.array(z.object({
          partId: z.number(),
          cantidad: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        return await db.addRepairParts(input.repairId, input.partes);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteRepair(input.id);
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
