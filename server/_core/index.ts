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
  // Diagnostic + POS table creation endpoint
  app.get("/api/db-info", async (req, res) => {
    try {
      const mysql = await import("mysql2/promise");
      const dbUrl = process.env.DATABASE_URL || "";
      // Extract host without password for security
      const urlMatch = dbUrl.match(/@([^/]+)\/(\w+)/);
      const dbHost = urlMatch ? urlMatch[1] : 'unknown';
      const dbName = urlMatch ? urlMatch[2] : 'unknown';
      
      const connection = await mysql.default.createConnection(dbUrl);
      
      // Create pos_transactions if not exists
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS pos_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          codigo VARCHAR(50) NOT NULL UNIQUE,
          items JSON NOT NULL,
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
      
      const [tables] = await connection.execute('SHOW TABLES');
      await connection.end();
      
      res.json({
        success: true,
        dbHost,
        dbName,
        tables: (tables as any[]).map(t => Object.values(t)[0]),
        message: 'pos_transactions table created/verified'
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // (Endpoints de diagnóstico eliminados - correo funciona correctamente)

  // Página pública de opt-in SMS para revisores de Twilio A2P 10DLC (no requiere login)
  app.get("/sms-consent", (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SMS Opt-In Consent - Fixopolis Solutions</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; padding: 20px; }
    .container { max-width: 700px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: #1a1a2e; color: #fff; padding: 24px 32px; }
    .header h1 { font-size: 22px; font-weight: 700; }
    .header p { font-size: 13px; color: #aaa; margin-top: 4px; }
    .badge { display: inline-block; background: #e8f5e9; color: #2e7d32; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; margin-top: 8px; }
    .content { padding: 32px; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 16px; font-weight: 600; color: #1a1a2e; margin-bottom: 12px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; }
    .section p { font-size: 14px; line-height: 1.6; color: #555; margin-bottom: 8px; }
    .form-demo { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px; margin-top: 12px; }
    .form-demo h3 { font-size: 15px; font-weight: 600; margin-bottom: 16px; color: #333; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 500; color: #555; margin-bottom: 6px; }
    .form-group input[type=text], .form-group input[type=tel] { width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; background: #fff; }
    .consent-box { background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 16px; margin-top: 16px; }
    .consent-box label { display: flex; align-items: flex-start; gap: 10px; cursor: pointer; font-size: 13px; line-height: 1.5; color: #444; }
    .consent-box input[type=checkbox] { width: 16px; height: 16px; margin-top: 2px; flex-shrink: 0; accent-color: #1a1a2e; }
    .consent-box .optional-tag { display: inline-block; background: #e3f2fd; color: #1565c0; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-left: 6px; }
    .consent-box .sub-text { font-size: 12px; color: #777; margin-top: 8px; margin-left: 26px; line-height: 1.5; }
    .consent-box .links a { color: #1565c0; text-decoration: none; }
    .info-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .info-table th { background: #f0f0f0; text-align: left; padding: 8px 12px; font-weight: 600; color: #444; }
    .info-table td { padding: 8px 12px; border-bottom: 1px solid #eee; color: #555; }
    .info-table tr:last-child td { border-bottom: none; }
    .highlight { background: #fff3e0; border-left: 4px solid #ff9800; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #555; margin-top: 12px; }
    .footer { background: #f9f9f9; border-top: 1px solid #eee; padding: 16px 32px; font-size: 12px; color: #888; text-align: center; }
    .footer a { color: #1565c0; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Fixopolis Solutions — SMS Opt-In Documentation</h1>
      <p>This page documents the SMS consent mechanism for Twilio A2P 10DLC compliance review.</p>
      <span class="badge">Public Compliance Page — No Login Required</span>
    </div>
    <div class="content">

      <div class="section">
        <h2>Business Information</h2>
        <table class="info-table">
          <tr><th>Business Name</th><td>Fixopolis Solutions</td></tr>
          <tr><th>Business Type</th><td>Cell Phone Repair Shop (LLC)</td></tr>
          <tr><th>Website</th><td><a href="https://fixopolisolutions.com" target="_blank">fixopolisolutions.com</a></td></tr>
          <tr><th>System URL</th><td><a href="https://fixopolisfinanzas.com" target="_blank">fixopolisfinanzas.com</a></td></tr>
          <tr><th>Privacy Policy</th><td><a href="https://fixopolisfinanzas.com/privacy-policy" target="_blank">fixopolisfinanzas.com/privacy-policy</a></td></tr>
          <tr><th>Terms of Service</th><td><a href="https://fixopolisfinanzas.com/terms" target="_blank">fixopolisfinanzas.com/terms</a></td></tr>
        </table>
      </div>

      <div class="section">
        <h2>How Customers Opt In to SMS Notifications</h2>
        <p>When a customer brings a device to Fixopolis Solutions for repair, a staff member opens a new repair intake form in the internal management system. The form includes an <strong>optional, unchecked checkbox</strong> for SMS consent — shown below exactly as it appears in the system.</p>
        <p>The checkbox is <strong>not pre-checked</strong> and is clearly labeled as <strong>Optional</strong>. Customers who do not check the box receive full repair service with no difference in treatment. Consent to receive SMS messages is <strong>never required</strong> as a condition of service.</p>

        <div class="form-demo">
          <h3>New Repair Intake Form — Step 1 of 3: Customer Information</h3>
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" placeholder="e.g. John Smith" disabled>
          </div>
          <div class="form-group">
            <label>Phone Number *</label>
            <input type="tel" placeholder="e.g. 555-123-4567" disabled>
          </div>

          <div class="consent-box">
            <label>
              <input type="checkbox">
              <span>
                I agree to receive SMS text message updates about my repair status from Fixopolis Solutions.
                <span class="optional-tag">OPTIONAL</span>
              </span>
            </label>
            <div class="sub-text">
              Message frequency varies. Msg &amp; data rates may apply. Reply STOP to opt out.
              <br>
              <span class="links">
                <a href="https://fixopolisfinanzas.com/privacy-policy" target="_blank">Privacy Policy</a> ·
                <a href="https://fixopolisfinanzas.com/terms" target="_blank">Terms of Service</a>
              </span>
            </div>
          </div>

          <div class="highlight" style="margin-top:16px;">
            ✅ The checkbox above is <strong>unchecked by default</strong>. Customers must actively check it to opt in. The repair service proceeds normally whether or not the customer opts in.
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Opt-In Process Summary</h2>
        <table class="info-table">
          <tr><th>Opt-In Method</th><td>Optional checkbox on paper/digital repair intake form at point of service</td></tr>
          <tr><th>Checkbox Default State</th><td>Unchecked (customer must actively check to opt in)</td></tr>
          <tr><th>Required for Service?</th><td>No — service is provided regardless of consent</td></tr>
          <tr><th>Message Types</th><td>Repair status updates (e.g., "Your repair is ready for pickup")</td></tr>
          <tr><th>Message Frequency</th><td>Varies — typically 1–5 messages per repair order</td></tr>
          <tr><th>Opt-Out Method</th><td>Reply STOP to any message</td></tr>
          <tr><th>Consent Records</th><td>Stored in the repair management database per customer</td></tr>
        </table>
      </div>

      <div class="section">
        <h2>Sample SMS Messages Sent</h2>
        <table class="info-table">
          <tr><th>Trigger</th><th>Sample Message</th></tr>
          <tr><td>Status: In Progress</td><td>Hi [Name], your [Device] repair at Fixopolis Solutions is now In Progress. We'll notify you when it's ready. Reply STOP to opt out.</td></tr>
          <tr><td>Status: Completed</td><td>Hi [Name], great news! Your [Device] repair is complete and ready for pickup at Fixopolis Solutions. Reply STOP to opt out.</td></tr>
          <tr><td>Status: Delivered</td><td>Hi [Name], your [Device] has been delivered. Thank you for choosing Fixopolis Solutions! Reply STOP to opt out.</td></tr>
        </table>
      </div>

    </div>
    <div class="footer">
      This page is provided for Twilio A2P 10DLC compliance review purposes. &nbsp;|
      <a href="https://fixopolisfinanzas.com/privacy-policy">Privacy Policy</a> &nbsp;|
      <a href="https://fixopolisfinanzas.com/terms">Terms of Service</a> &nbsp;|
      &copy; 2026 Fixopolis Solutions LLC
    </div>
  </div>
</body>
</html>`);
  });

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

      // Also create pos_transactions table if it doesn't exist
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS pos_transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          codigo VARCHAR(50) NOT NULL UNIQUE,
          items JSON NOT NULL,
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
      
      await connection.end();
      
      res.json({
        success: true,
        message: 'Email configuration updated + pos_transactions table ensured',
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
  
  // ==================== POS CUSTOMER DISPLAY SYNC ====================
  // In-memory store for display state (per tienda)
  const posDisplayState: Record<string, any> = {};
  const posDisplayClients: Record<string, Set<any>> = {};

  // POST: POS cashier pushes current cart/payment state
  app.post("/api/pos-display/update", (req, res) => {
    const { tienda = 'admin', ...payload } = req.body;
    posDisplayState[tienda] = payload;
    // Notify all SSE clients for this tienda
    const clients = posDisplayClients[tienda];
    if (clients && clients.size > 0) {
      const data = JSON.stringify(payload);
      clients.forEach(client => {
        try { client.write(`data: ${data}\n\n`); } catch (_) {}
      });
    }
    res.json({ ok: true });
  });

  // GET: Customer display subscribes via SSE for real-time updates
  app.get("/api/pos-display/stream", (req, res) => {
    const tienda = (req.query.tienda as string) || 'admin';
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();
    // Send current state immediately on connect
    if (posDisplayState[tienda]) {
      res.write(`data: ${JSON.stringify(posDisplayState[tienda])}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ type: 'IDLE' })}\n\n`);
    }
    // Register client
    if (!posDisplayClients[tienda]) posDisplayClients[tienda] = new Set();
    posDisplayClients[tienda].add(res);
    // Heartbeat every 20s to keep connection alive
    const heartbeat = setInterval(() => {
      try { res.write(': ping\n\n'); } catch (_) {}
    }, 20000);
    // Cleanup on disconnect
    req.on('close', () => {
      clearInterval(heartbeat);
      posDisplayClients[tienda]?.delete(res);
    });
  });

  // POST: Upload product image (base64) and store in S3
  app.post('/api/product-image/upload', async (req, res) => {
    try {
      const { base64, mimeType, fileName } = req.body;
      if (!base64 || !mimeType) {
        return res.status(400).json({ error: 'base64 and mimeType required' });
      }
      const { storagePut } = await import('../storage');
      const buffer = Buffer.from(base64, 'base64');
      const ext = mimeType.split('/')[1]?.split('+')[0] || 'jpg';
      const key = `product-images/${Date.now()}-${(fileName || 'product').replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}`;
      const { url } = await storagePut(key, buffer, mimeType);
      return res.json({ url });
    } catch (err: any) {
      console.error('[Upload] Error uploading product image:', err);
      return res.status(500).json({ error: err.message || 'Upload failed' });
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
