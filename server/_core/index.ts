import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startScheduler } from "./scheduler";
import { applyMigrations } from "../migrations";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Configure cookie parser for session management
  app.use(cookieParser());
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Temporary database setup endpoint
  app.get("/api/setup-database", async (req, res) => {
    try {
      const mysql = await import("mysql2/promise");
      const connection = await mysql.default.createConnection(process.env.DATABASE_URL || "");
      const { setupDatabaseStatements } = await import("./setup-endpoint");
      
      // Execute SQL statements
      const statements = setupDatabaseStatements;
      
      // Old statements removed - now using setup-endpoint.ts
      /*
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
          id varchar(191) NOT NULL,
          name varchar(191) NOT NULL,
          email varchar(191) DEFAULT NULL,
          role enum('admin','sucursal') NOT NULL DEFAULT 'sucursal',
          store_name varchar(191) DEFAULT NULL,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY users_email_unique (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // Credentials table
        `CREATE TABLE IF NOT EXISTS credentials (
          id int NOT NULL AUTO_INCREMENT,
          user_id varchar(191) NOT NULL,
          username varchar(191) NOT NULL,
          password_hash varchar(191) NOT NULL,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY credentials_username_unique (username),
          KEY credentials_user_id_fk (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // Transactions table
        `CREATE TABLE IF NOT EXISTS transactions (
          id int NOT NULL AUTO_INCREMENT,
          user_id varchar(191) NOT NULL,
          type enum('ingreso','gasto') NOT NULL,
          category varchar(191) NOT NULL,
          amount decimal(10,2) NOT NULL,
          payment_method enum('efectivo','banco') NOT NULL,
          description text,
          date date NOT NULL,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY transactions_user_id_fk (user_id),
          KEY transactions_date_idx (date),
          KEY transactions_type_idx (type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // Employees table
        `CREATE TABLE IF NOT EXISTS employees (
          id int NOT NULL AUTO_INCREMENT,
          user_id varchar(191) NOT NULL,
          name varchar(191) NOT NULL,
          position varchar(191) DEFAULT NULL,
          salary decimal(10,2) DEFAULT NULL,
          hire_date date DEFAULT NULL,
          status enum('active','inactive') NOT NULL DEFAULT 'active',
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY employees_user_id_fk (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // Payroll table
        `CREATE TABLE IF NOT EXISTS payroll (
          id int NOT NULL AUTO_INCREMENT,
          user_id varchar(191) NOT NULL,
          employee_id int NOT NULL,
          amount decimal(10,2) NOT NULL,
          payment_method enum('efectivo','banco') NOT NULL,
          payment_date date NOT NULL,
          notes text,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY payroll_user_id_fk (user_id),
          KEY payroll_employee_id_fk (employee_id),
          KEY payroll_payment_date_idx (payment_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // Providers table
        `CREATE TABLE IF NOT EXISTS providers (
          id int NOT NULL AUTO_INCREMENT,
          user_id varchar(191) NOT NULL,
          name varchar(191) NOT NULL,
          contact varchar(191) DEFAULT NULL,
          phone varchar(191) DEFAULT NULL,
          email varchar(191) DEFAULT NULL,
          address text,
          notes text,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY providers_user_id_fk (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // Config table
        `CREATE TABLE IF NOT EXISTS config (
          id int NOT NULL AUTO_INCREMENT,
          user_id varchar(191) NOT NULL,
          \`key\` varchar(191) NOT NULL,
          value text NOT NULL,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY config_user_key_unique (user_id, \`key\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // Daily history table
        `CREATE TABLE IF NOT EXISTS daily_history (
          id int NOT NULL AUTO_INCREMENT,
          user_id varchar(191) NOT NULL,
          date date NOT NULL,
          total_income decimal(10,2) NOT NULL DEFAULT '0.00',
          total_expenses decimal(10,2) NOT NULL DEFAULT '0.00',
          net_income decimal(10,2) NOT NULL DEFAULT '0.00',
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY daily_history_user_date_unique (user_id, date),
          KEY daily_history_date_idx (date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // Insert users
        `INSERT INTO users (id, name, email, role, store_name) VALUES
        ('admin-user-id', 'Administrador', 'admin@fixopolis.com', 'admin', 'Fixopolis Solutions'),
        ('sucursal-user-id', 'Sucursal Downtown', 'sucursal@fixopolis.com', 'sucursal', 'Downtown')
        ON DUPLICATE KEY UPDATE 
          name = VALUES(name),
          email = VALUES(email),
          role = VALUES(role),
          store_name = VALUES(store_name)`,
        
        // Insert credentials
        `INSERT INTO credentials (user_id, username, password_hash) VALUES
        ('admin-user-id', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
        ('sucursal-user-id', 'sucursal', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
        ON DUPLICATE KEY UPDATE 
          password_hash = VALUES(password_hash)`,
        
        // Insert config
        `INSERT INTO config (user_id, \`key\`, value) VALUES
        ('admin-user-id', 'savings_percentage', '10'),
        ('admin-user-id', 'investment_percentage', '10'),
        ('admin-user-id', 'emergency_percentage', '5'),
        ('admin-user-id', 'available_percentage', '75'),
        ('admin-user-id', 'tax_rate', '8.25'),
        ('sucursal-user-id', 'savings_percentage', '10'),
        ('sucursal-user-id', 'investment_percentage', '10'),
        ('sucursal-user-id', 'emergency_percentage', '5'),
        ('sucursal-user-id', 'available_percentage', '75'),
        ('sucursal-user-id', 'tax_rate', '8.25')
      */
      
      for (const sql of statements) {
        await connection.execute(sql);
      }
      
      // Verify tables
      const [tables] = await connection.execute('SHOW TABLES');
      const [users] = await connection.execute('SELECT username FROM credentials');
      
      await connection.end();
      
      res.json({
        success: true,
        message: 'Database initialized successfully',
        tables: (tables as any[]).length,
        users: (users as any[]).length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  });
  
  // Create POS transactions table endpoint
  app.get("/api/create-pos-table", async (req, res) => {
    try {
      const mysql = await import("mysql2/promise");
      const connection = await mysql.default.createConnection(process.env.DATABASE_URL || "");
      
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS pos_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          codigo VARCHAR(50) NOT NULL UNIQUE COMMENT 'Código único (POS-001)',
          items JSON NOT NULL COMMENT 'Array de items vendidos',
          subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          taxRate DECIMAL(5,2) NOT NULL DEFAULT 8.25,
          taxAmount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          metodoPago ENUM('efectivo','tarjeta','mixto') NOT NULL DEFAULT 'efectivo',
          montoEfectivo DECIMAL(10,2) NULL,
          montoTarjeta DECIMAL(10,2) NULL,
          cambio DECIMAL(10,2) NULL DEFAULT 0.00,
          clienteNombre VARCHAR(200) NULL,
          clienteEmail VARCHAR(320) NULL,
          clienteTelefono VARCHAR(50) NULL,
          notas TEXT NULL,
          estado ENUM('completada','cancelada','pendiente') NOT NULL DEFAULT 'completada',
          tienda ENUM('admin','sucursal') NOT NULL DEFAULT 'admin',
          cajero VARCHAR(100) NULL,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      // Also add barcode columns to inventory tables if they don't exist
      try {
        await connection.execute(`ALTER TABLE inventory_parts ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) NULL UNIQUE`);
      } catch (e: any) { console.log('inventory_parts barcode column:', e.message); }
      try {
        await connection.execute(`ALTER TABLE inventory_accessories ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) NULL UNIQUE`);
      } catch (e: any) { console.log('inventory_accessories barcode column:', e.message); }
      
      const [tables] = await connection.execute('SHOW TABLES');
      await connection.end();
      
      res.json({
        success: true,
        message: 'POS table created successfully',
        totalTables: (tables as any[]).length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack
      });
    }
  });

  // Fix email config endpoint
  app.get("/api/fix-email-config", async (req, res) => {
    try {
      const mysql = await import("mysql2/promise");
      const connection = await mysql.default.createConnection(process.env.DATABASE_URL || "");
      
      await connection.execute(
        "INSERT INTO config (\`key\`, value) VALUES ('reportEmail', 'andersonteran2@gmail.com, chavadelarosa549@gmail.com') ON DUPLICATE KEY UPDATE value = 'andersonteran2@gmail.com, chavadelarosa549@gmail.com'"
      );
      
      await connection.end();
      
      res.json({
        success: true,
        message: 'Email configuration updated successfully',
        email: 'andersonteran2@gmail.com, chavadelarosa549@gmail.com'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
  
  // Test endpoint for weekly reports
  app.get("/api/test-weekly-report", async (req, res) => {
    try {
      const { getTransactions, getAllConfig } = await import("../db");
      const { generateWeeklyPDFReport } = await import("./pdf-generator");
      const { sendWeeklyReportEmail } = await import("./email-service");
      
      // Get config for email
      const config = await getAllConfig();
      const reportEmail = config.reportEmail || '';
      
      if (!reportEmail) {
        return res.status(400).json({
          success: false,
          error: 'No email configured. Please set reportEmail in configuration.'
        });
      }
      
      // Get today's date range
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - 7); // Last 7 days
      
      const weekStart = startOfWeek.toISOString().split('T')[0];
      const weekEnd = today.toISOString().split('T')[0];
      
      const tiendas: Array<'admin' | 'sucursal'> = ['admin', 'sucursal'];
      const results = [];
      
      for (const tienda of tiendas) {
        // Get transactions for this store
        const transactions = await getTransactions({ tienda });
        
        // Filter transactions for the date range
        const weekTransactions = transactions.filter(t => {
          const tDate = new Date(t.fecha);
          return tDate >= startOfWeek && tDate <= today;
        });
        
        // Calculate totals
        const totalIngresos = weekTransactions
          .filter(t => t.tipo === 'ingreso')
          .reduce((sum, t) => sum + Number(t.monto), 0);
        
        const totalGastos = weekTransactions
          .filter(t => t.tipo === 'gasto')
          .reduce((sum, t) => sum + Number(t.monto), 0);
        
        const taxRate = parseFloat(config.taxRate || '8.25');
        const totalTax = (totalIngresos * taxRate) / 100;
        const gananciaNeta = totalIngresos - totalTax - totalGastos;
        
        // Generate HTML report
        const htmlPath = await generateWeeklyPDFReport({
          tienda,
          tiendaNombre: tienda === 'admin' ? 'Fixopolis Solutions Principal' : 'Fixopolis Solutions Sucursal',
          weekStart,
          weekEnd,
          totalIngresos,
          totalGastos,
          totalNomina: 0, // For test, set to 0
          totalTax,
          gananciaNeta,
          transaccionesCount: weekTransactions.length,
          taxRate,
        });
        
        // Send email with HTML report
        await sendWeeklyReportEmail({
          to: reportEmail,
          tienda: tienda === 'admin' ? 'Fixopolis Solutions Principal' : 'Fixopolis Solutions Sucursal',
          weekStart,
          weekEnd,
          htmlPath,
        });
        
        results.push({
          tienda,
          htmlPath,
          totalIngresos,
          totalGastos,
          totalTax,
          gananciaNeta,
          transaccionesCount: weekTransactions.length,
        });
      }
      
      res.json({
        success: true,
        message: 'Weekly reports generated and sent successfully',
        emailSentTo: reportEmail,
        reports: results,
      });
      
    } catch (error: any) {
      console.error('[Test Weekly Report] Error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: error.stack,
      });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Aplicar migraciones de base de datos
    await applyMigrations();
    
    // Migrar constraint de inventory_parts
    const { migrateInventoryPartsUniqueConstraint, initializeStoreConfig } = await import("../db");
    await migrateInventoryPartsUniqueConstraint();
    
    // Inicializar configuración de tiendas
    await initializeStoreConfig();
    
    // Iniciar scheduler para tareas programadas
    startScheduler();
  });
}

startServer().catch(console.error);
