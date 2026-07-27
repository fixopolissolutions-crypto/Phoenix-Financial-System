// Temporary database setup endpoint - DELETE AFTER USE
export const setupDatabaseStatements = [
  // Drop existing tables to recreate with correct structure
  `DROP TABLE IF EXISTS pos_transactions`,
  `DROP TABLE IF EXISTS repair_parts`,
  `DROP TABLE IF EXISTS repairs`,
  `DROP TABLE IF EXISTS inventory_movements`,
  `DROP TABLE IF EXISTS inventory_accessories`,
  `DROP TABLE IF EXISTS inventory_parts`,
  `DROP TABLE IF EXISTS inventory_phones`,
  `DROP TABLE IF EXISTS servidor_requests`,
  `DROP TABLE IF EXISTS store_config`,
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
  
  // Credentials table
  `CREATE TABLE credentials (
    id int NOT NULL AUTO_INCREMENT,
    username varchar(50) NOT NULL UNIQUE,
    password varchar(255) NOT NULL,
    tienda enum('admin','sucursal') NOT NULL DEFAULT 'admin',
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Inventory phones table
  `CREATE TABLE inventory_phones (
    id int NOT NULL AUTO_INCREMENT,
    marca varchar(100) NOT NULL,
    modelo varchar(100) NOT NULL,
    imei varchar(20),
    color varchar(50),
    capacidad varchar(20),
    condicion enum('nuevo','excelente','bueno','regular','para_partes') NOT NULL DEFAULT 'bueno',
    precioCompra decimal(10,2),
    precioVenta decimal(10,2),
    fechaCompra date,
    proveedor varchar(200),
    notas text,
    estado enum('disponible','vendido','reparacion','apartado') NOT NULL DEFAULT 'disponible',
    tienda enum('admin','sucursal') NOT NULL DEFAULT 'admin',
    fechaVenta date,
    precioVentaFinal decimal(10,2),
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Inventory parts table
  `CREATE TABLE inventory_parts (
    id int NOT NULL AUTO_INCREMENT,
    nombre varchar(200) NOT NULL,
    categoria varchar(100),
    marca varchar(100),
    modelo varchar(100),
    cantidad int NOT NULL DEFAULT 0,
    cantidadMinima int NOT NULL DEFAULT 1,
    precioCompra decimal(10,2),
    precioVenta decimal(10,2),
    proveedor varchar(200),
    ubicacion varchar(100),
    notas text,
    barcode varchar(100),
    tienda enum('admin','sucursal') NOT NULL DEFAULT 'admin',
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_parts_barcode (barcode)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Inventory accessories table
  `CREATE TABLE inventory_accessories (
    id int NOT NULL AUTO_INCREMENT,
    nombre varchar(200) NOT NULL,
    categoria varchar(100),
    marca varchar(100),
    cantidad int NOT NULL DEFAULT 0,
    cantidadMinima int NOT NULL DEFAULT 1,
    precioCompra decimal(10,2),
    precioVenta decimal(10,2),
    proveedor varchar(200),
    ubicacion varchar(100),
    notas text,
    barcode varchar(100),
    tienda enum('admin','sucursal') NOT NULL DEFAULT 'admin',
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_acc_barcode (barcode)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Inventory movements table
  `CREATE TABLE inventory_movements (
    id int NOT NULL AUTO_INCREMENT,
    tipo enum('entrada','salida','ajuste') NOT NULL,
    itemType enum('parte','accesorio','telefono') NOT NULL,
    itemId int NOT NULL,
    cantidad int NOT NULL,
    motivo varchar(200),
    notas text,
    tienda enum('admin','sucursal') NOT NULL DEFAULT 'admin',
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Repairs table
  `CREATE TABLE repairs (
    id int NOT NULL AUTO_INCREMENT,
    codigo varchar(50) NOT NULL UNIQUE,
    clienteNombre varchar(200) NOT NULL,
    clienteTelefono varchar(50),
    clienteEmail varchar(320),
    dispositivoMarca varchar(100),
    dispositivoModelo varchar(100),
    dispositivoImei varchar(20),
    descripcionProblema text NOT NULL,
    diagnostico text,
    estado enum('recibido','diagnostico','en_reparacion','esperando_partes','listo','entregado','cancelado') NOT NULL DEFAULT 'recibido',
    prioridad enum('baja','normal','alta','urgente') NOT NULL DEFAULT 'normal',
    tecnico varchar(200),
    costoPartes decimal(10,2) NOT NULL DEFAULT 0.00,
    costoManoObra decimal(10,2) NOT NULL DEFAULT 0.00,
    costoTotal decimal(10,2) NOT NULL DEFAULT 0.00,
    anticipo decimal(10,2) NOT NULL DEFAULT 0.00,
    notas text,
    tienda enum('admin','sucursal') NOT NULL DEFAULT 'admin',
    fechaRecibido timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fechaPromesa date,
    fechaEntregado timestamp,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Repair parts table
  `CREATE TABLE repair_parts (
    id int NOT NULL AUTO_INCREMENT,
    repairId int NOT NULL,
    partId int,
    nombre varchar(200) NOT NULL,
    cantidad int NOT NULL DEFAULT 1,
    precioUnitario decimal(10,2) NOT NULL DEFAULT 0.00,
    subtotal decimal(10,2) NOT NULL DEFAULT 0.00,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Store config table
  `CREATE TABLE store_config (
    id int NOT NULL AUTO_INCREMENT,
    tienda enum('admin','sucursal') NOT NULL DEFAULT 'admin',
    nombreNegocio varchar(200),
    telefono varchar(50),
    email varchar(320),
    direccion text,
    logoUrl varchar(500),
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_store_config_tienda (tienda)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Servidor requests table
  `CREATE TABLE servidor_requests (
    id int NOT NULL AUTO_INCREMENT,
    tipo varchar(100) NOT NULL,
    datos JSON,
    estado enum('pendiente','procesando','completado','error') NOT NULL DEFAULT 'pendiente',
    resultado JSON,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // POS transactions table
  `CREATE TABLE pos_transactions (
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
  ('tax_rate', '8.25'),
  ('reportEmail', 'andersonteran2@gmail.com, chavadelarosa549@gmail.com')`
];
