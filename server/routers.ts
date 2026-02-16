import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from './db';
import * as unlockerfast from './unlockerfast';

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie('local_session', { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    // Login local para admin/sucursal
    loginLocal: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const credential = await db.getCredential(input.username);
        if (!credential || credential.password !== input.password) {
          return { success: false, error: 'Credenciales inválidas' };
        }
        
        // Crear sesión local con cookie
        const sessionData = {
          username: credential.username,
          tienda: credential.tienda,
          role: credential.tienda === 'admin' ? 'admin' : 'user',
          loginMethod: 'local'
        };
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie('local_session', JSON.stringify(sessionData), {
          ...cookieOptions,
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
        });
        
        return { 
          success: true, 
          user: sessionData
        };
      }),
  }),

  // ==================== USER ====================
  user: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
        categoria: z.string().nullish().transform(val => val || ''),
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
        categoria: z.string().nullish().transform(val => val || ''),
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
      }).optional())
      .query(async ({ input, ctx }) => {
        // Filtrar automáticamente por la tienda del usuario logueado
        const filters = {
          ...input,
          tienda: ctx.user?.tienda || 'admin',
        };
        return await db.getInventoryPhones(filters);
      }),

    // Endpoint para que admin pueda ver inventario de sucursal
    listByTienda: publicProcedure
      .input(z.object({
        tienda: z.enum(['admin', 'sucursal']),
        estado: z.enum(['disponible', 'vendido', 'reservado']).optional(),
      }))
      .query(async ({ input, ctx }) => {
        // Solo admin puede ver inventario de otras tiendas
        if (ctx.user?.tienda !== 'admin') {
          throw new Error('No tienes permisos para ver inventario de otras tiendas');
        }
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
        notas: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Usar automáticamente la tienda del usuario logueado
        const tienda = ctx.user?.tienda || 'admin';
        console.log('=== CREATE INVENTORY PHONE ===');
        console.log('Input recibido:', JSON.stringify(input, null, 2));
        try {
          const result = await db.createInventoryPhone({
            ...input,
            tienda,
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
        activo: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const filters = {
          ...input,
          tienda: ctx.user?.tienda || 'admin',
        };
        return await db.getInventoryAccessories(filters);
      }),

    // Endpoint para que admin pueda ver inventario de sucursal
    listByTienda: publicProcedure
      .input(z.object({
        tienda: z.enum(['admin', 'sucursal']),
        activo: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        // Solo admin puede ver inventario de otras tiendas
        if (ctx.user?.tienda !== 'admin') {
          throw new Error('No tienes permisos para ver inventario de otras tiendas');
        }
        return await db.getInventoryAccessories(input);
      }),

    create: publicProcedure
      .input(z.object({
        codigo: z.string(),
        nombre: z.string(),
        categoria: z.string().nullish().transform(val => val || ''),
        precioCompraUnitario: z.string(),
        precioVentaUnitario: z.string(),
        cantidadInicial: z.number(),
        stockMinimo: z.number().default(5),
      }))
      .mutation(async ({ input, ctx }) => {
        const tienda = ctx.user?.tienda || 'admin';
        return await db.createInventoryAccessory({
          ...input,
          tienda,
          cantidadActual: input.cantidadInicial,
          cantidadVendida: 0,
        });
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        nombre: z.string().optional(),
        categoria: z.string().nullish().transform(val => val || ''),
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
        precioVentaUnitario: z.string().optional(),
        fecha: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await db.sellAccessory(input.id, input.cantidad, new Date(input.fecha), input.precioVentaUnitario);
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
        activo: z.number().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const filters = {
          ...input,
          tienda: ctx.user?.tienda || 'admin',
        };
        return await db.getInventoryParts(filters);
      }),

    // Endpoint para que admin pueda ver inventario de sucursal
    listByTienda: publicProcedure
      .input(z.object({
        tienda: z.enum(['admin', 'sucursal']),
        activo: z.number().optional(),
      }))
      .query(async ({ input, ctx }) => {
        // Solo admin puede ver inventario de otras tiendas
        if (ctx.user?.tienda !== 'admin') {
          throw new Error('No tienes permisos para ver inventario de otras tiendas');
        }
        return await db.getInventoryParts(input);
      }),

    create: publicProcedure
      .input(z.object({
        codigo: z.string(),
        nombre: z.string(),
        categoria: z.string().nullish().transform(val => val || ''),
        compatibilidad: z.string().optional(),
        precioCompraUnitario: z.string(),
        cantidadInicial: z.number(),
        stockMinimo: z.number().default(2),
      }))
      .mutation(async ({ input, ctx }) => {
        const tienda = ctx.user?.tienda || 'admin';
        return await db.createInventoryPart({
          ...input,
          tienda,
          cantidadActual: input.cantidadInicial,
          cantidadUsada: 0,
        });
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        nombre: z.string().optional(),
        categoria: z.string().nullish().transform(val => val || ''),
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
    getNextCode: publicProcedure
      .query(async ({ ctx }) => {
        const { getNextRepairCode } = await import('./repair-utils');
        const tienda = ctx.user?.tienda || 'admin';
        const nextCode = await getNextRepairCode(tienda);
        return { codigo: nextCode };
      }),

    list: publicProcedure
      .input(z.object({
        estado: z.enum(['pendiente', 'en_proceso', 'completada', 'entregada']).optional(),
        fechaInicio: z.string().optional(),
        fechaFin: z.string().optional(),
      }).optional())
      .query(async ({ input, ctx }) => {
        const filters = {
          estado: input?.estado,
          tienda: ctx.user?.tienda || 'admin',
          fechaInicio: input?.fechaInicio ? new Date(input.fechaInicio) : undefined,
          fechaFin: input?.fechaFin ? new Date(input.fechaFin) : undefined,
        };
        return await db.getRepairs(filters);
      }),

    create: publicProcedure
      .input(z.object({
        codigo: z.string(),
        cliente: z.string().optional(),
        telefono: z.string().optional(),
        dispositivo: z.string().optional(),
        problema: z.string(),
        diagnostico: z.string().optional(),
        precioManoObra: z.string(),
        precioTotal: z.string(),
        fechaIngreso: z.string(),
        notas: z.string().optional(),
        partes: z.array(z.object({
          partId: z.number(),
          cantidad: z.number(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const tienda = ctx.user?.tienda || 'admin';
        console.log('=== CREATE REPAIR ===');
        console.log('Input recibido:', JSON.stringify(input, null, 2));
        try {
          const result = await db.createRepair({
            ...input,
            tienda,
            fechaIngreso: new Date(input.fechaIngreso),
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
          partId: z.number().optional(), // Opcional para partes manuales
          cantidad: z.number(),
          nombre: z.string().optional(), // Para partes manuales
          costoUnitario: z.string().optional(), // Para partes manuales
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

    generatePDF: publicProcedure
      .input(z.object({ repairId: z.number() }))
      .mutation(async ({ input }) => {
        try {
          console.log('[PDF] Iniciando generación de PDF para repairId:', input.repairId);
          
          const { generateReceiptPDF } = await import('./pdf-generator-pdfkit');
          console.log('[PDF] Módulo pdfkit importado correctamente');
          
          // Obtener la reparación
          const repair = await db.getRepairById(input.repairId);
          console.log('[PDF] Reparación obtenida:', repair ? `${repair.codigo}` : 'null');
          
          if (!repair) {
            throw new Error('Reparación no encontrada');
          }
          
          // Obtener configuración de la tienda
          const storeInfo = await db.getStoreConfig(repair.tienda);
          console.log('[PDF] Store info obtenida:', storeInfo ? storeInfo.nombre : 'null');
          
          if (!storeInfo) {
            throw new Error('Configuración de tienda no encontrada');
          }
          
          // Generar PDF usando pdfkit
          console.log('[PDF] Generando PDF...');
          const pdfBuffer = await generateReceiptPDF(repair, storeInfo);
          console.log('[PDF] PDF generado, tamaño:', pdfBuffer.length, 'bytes');
          
          // Convertir a base64 para enviar al cliente
          const base64 = pdfBuffer.toString('base64');
          console.log('[PDF] Convertido a base64, longitud:', base64.length);
          
          return {
            pdf: base64,
            filename: `recibo-${repair.codigo}.pdf`,
          };
        } catch (error) {
          console.error('[PDF] Error al generar PDF:', error);
          throw error;
        }
      }),
  }),

  // ==================== STORE CONFIG ====================
  storeConfig: router({
    get: publicProcedure
      .input(z.object({
        tienda: z.enum(['admin', 'sucursal']),
      }))
      .query(async ({ input }) => {
        return await db.getStoreConfig(input.tienda);
      }),
    update: publicProcedure
      .input(z.object({
        tienda: z.enum(['admin', 'sucursal']),
        nombre: z.string(),
        telefono: z.string().optional(),
        direccion: z.string().optional(),
        email: z.string().optional(),
        ciudad: z.string().optional(),
        estado: z.string().optional(),
        codigoPostal: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateStoreConfig(input);
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

  // ============================================
  // SERVIDOR (UNLOCKERFAST API)
  // ============================================
  server: router({
    // Obtener información de la cuenta de UnlockerFast
    getAccountInfo: publicProcedure
      .query(async () => {
        return await unlockerfast.getAccountInfo();
      }),

    // Sincronizar servicios desde UnlockerFast API
    syncServices: publicProcedure
      .mutation(async () => {
        const services = await unlockerfast.getAllServices();
        await db.syncServicesFromAPI(services);
        return { success: true, count: services.length };
      }),

    // Obtener todos los servicios
    getServices: publicProcedure
      .input(z.object({
        tienda: z.enum(['admin', 'sucursal']).optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getServerServices(input?.tienda);
      }),

    // Obtener pedidos de servidor
    getOrders: publicProcedure
      .input(z.object({
        tienda: z.enum(['admin', 'sucursal']).optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getServerOrders(input?.tienda);
      }),

    // Crear un nuevo pedido
    createOrder: publicProcedure
      .input(z.object({
        serviceId: z.number(),
        cliente: z.string().optional(),
        telefono: z.string().optional(),
        email: z.string().optional(),
        imei: z.string().optional(),
        customFields: z.string().optional(),
        precioVenta: z.string(),
        precioCosto: z.string(),
        notas: z.string().optional(),
        tienda: z.enum(['admin', 'sucursal']),
      }))
      .mutation(async ({ input }) => {
        // Crear el pedido en la base de datos local
        const order = await db.createServerOrder(input);
        
        // Obtener el servicio para saber el serviceId de UnlockerFast
        const [service] = await db.getServerServices();
        const serviceData = (service as any[]).find((s: any) => s.id === input.serviceId);
        
        if (!serviceData) {
          throw new Error('Service not found');
        }
        
        try {
          // Enviar el pedido a UnlockerFast API
          const customFields = input.customFields ? JSON.parse(input.customFields) : undefined;
          const apiResponse = await unlockerfast.placeOrder({
            serviceId: serviceData.serviceId,
            imei: input.imei,
            customFields,
          });
          
          // Actualizar el pedido con el referenceId de UnlockerFast
          await db.updateServerOrderStatus((order as any).insertId, {
            referenceId: apiResponse.referenceId,
            estado: 'procesando',
          });
          
          return { success: true, order, apiResponse };
        } catch (error) {
          // Si falla el pedido en la API, marcar como fallido
          await db.updateServerOrderStatus((order as any).insertId, {
            estado: 'fallido',
            notas: `Error al enviar a UnlockerFast: ${error}`,
          });
          
          throw error;
        }
      }),

    // Actualizar estado de un pedido
    updateOrderStatus: publicProcedure
      .input(z.object({
        id: z.number(),
        estado: z.enum(['pendiente', 'procesando', 'completado', 'fallido', 'cancelado']).optional(),
        resultado: z.string().optional(),
        notas: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateServerOrderStatus(input.id, input);
      }),

    // Consultar estado de un pedido en UnlockerFast
    checkOrderStatus: publicProcedure
      .input(z.object({
        referenceId: z.string(),
      }))
      .query(async ({ input }) => {
        return await unlockerfast.getOrderInfo(input.referenceId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
