// Temporary database setup endpoint - DELETE AFTER USE
export const setupDatabaseStatements = [
  // Drop existing tables to recreate with correct structure
  `DROP TABLE IF EXISTS weekly_history`,
  `DROP TABLE IF EXISTS daily_history`,
  `DROP TABLE IF EXISTS payroll`,
  `DROP TABLE IF EXISTS employees`,
  `DROP TABLE IF EXISTS providers`,
  `DROP TABLE IF EXISTS transactions`,
  `DROP TABLE IF EXISTS config`,
  `DROP TABLE IF EXISTS credentials`,
  `DROP TABLE IF EXISTS users`,
  
  // Users table (matches Drizzle schema)
  `CREATE TABLE users (
    id int NOT NULL AUTO_INCREMENT,
    openId varchar(64) NOT NULL UNIQUE,
    name text,
    email varchar(320),
    loginMethod varchar(64),
    role enum('user','admin') NOT NULL DEFAULT 'user',
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastSignedIn timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  
  // Transactions table
  `CREATE TABLE transactions (
    id int NOT NULL AUTO_INCREMENT,
    tipo enum('ingreso','gasto') NOT NULL,
    monto decimal(10,2) NOT NULL,
    metodo enum('efectivo','banco') NOT NULL,
    descripcion text,
    categoria varchar(100),
    proveedor varchar(200),
    tienda enum('admin','sucursal') NOT NULL DEFAULT 'admin',
    fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  
  // Providers table
  `CREATE TABLE providers (
    id int NOT NULL AUTO_INCREMENT,
    nombre varchar(200) NOT NULL,
    telefono varchar(50),
    email varchar(320),
    direccion text,
    notas text,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  
  // Employees table
  `CREATE TABLE employees (
    id int NOT NULL AUTO_INCREMENT,
    nombre varchar(200) NOT NULL,
    puesto varchar(100),
    salario decimal(10,2),
    telefono varchar(50),
    email varchar(320),
    tienda enum('admin','sucursal') NOT NULL DEFAULT 'admin',
    activo int NOT NULL DEFAULT 1,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  
  // Payroll table
  `CREATE TABLE payroll (
    id int NOT NULL AUTO_INCREMENT,
    employeeId int NOT NULL,
    monto decimal(10,2) NOT NULL,
    metodo enum('efectivo','banco') NOT NULL,
    descripcion text,
    tienda enum('admin','sucursal') NOT NULL DEFAULT 'admin',
    fecha timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  
  // Config table
  `CREATE TABLE config (
    id int NOT NULL AUTO_INCREMENT,
    \`key\` varchar(100) NOT NULL UNIQUE,
    value text,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  
  // Weekly history table
  `CREATE TABLE weekly_history (
    id int NOT NULL AUTO_INCREMENT,
    weekStart varchar(10) NOT NULL,
    weekEnd varchar(10) NOT NULL,
    tienda enum('admin','sucursal') NOT NULL DEFAULT 'admin',
    totalIngresos decimal(10,2) NOT NULL DEFAULT '0.00',
    totalGastos decimal(10,2) NOT NULL DEFAULT '0.00',
    totalNomina decimal(10,2) NOT NULL DEFAULT '0.00',
    totalTax decimal(10,2) NOT NULL DEFAULT '0.00',
    gananciaNeta decimal(10,2) NOT NULL DEFAULT '0.00',
    transaccionesCount int NOT NULL DEFAULT 0,
    pdfPath varchar(500),
    emailSent int NOT NULL DEFAULT 0,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  
  // Daily history table
  `CREATE TABLE daily_history (
    id int NOT NULL AUTO_INCREMENT,
    fecha varchar(10) NOT NULL,
    tienda enum('admin','sucursal') NOT NULL DEFAULT 'admin',
    totalIngresos decimal(10,2) NOT NULL DEFAULT '0.00',
    totalGastos decimal(10,2) NOT NULL DEFAULT '0.00',
    totalNomina decimal(10,2) NOT NULL DEFAULT '0.00',
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  
  // Credentials table (IMPORTANT: password is plain text, not hashed!)
  `CREATE TABLE credentials (
    id int NOT NULL AUTO_INCREMENT,
    username varchar(50) NOT NULL UNIQUE,
    password varchar(255) NOT NULL,
    tienda enum('admin','sucursal') NOT NULL DEFAULT 'admin',
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  
  // Insert default credentials (password in plain text: "1234")
  `INSERT INTO credentials (username, password, tienda) VALUES
  ('admin', '1234', 'admin'),
  ('sucursal', '1234', 'sucursal')`,
  
  // Insert default config
  `INSERT INTO config (\`key\`, value) VALUES
  ('savings_percentage', '10'),
  ('investment_percentage', '10'),
  ('emergency_percentage', '5'),
  ('available_percentage', '75'),
  ('tax_rate', '8.25')`
];
