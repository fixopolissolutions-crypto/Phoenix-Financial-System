import mysql from 'mysql2/promise';
import 'dotenv/config';

const SQL_SETUP = `
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` varchar(191) NOT NULL,
  \`name\` varchar(191) NOT NULL,
  \`email\` varchar(191) DEFAULT NULL,
  \`role\` enum('admin','sucursal') NOT NULL DEFAULT 'sucursal',
  \`store_name\` varchar(191) DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`users_email_unique\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`credentials\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`user_id\` varchar(191) NOT NULL,
  \`username\` varchar(191) NOT NULL,
  \`password_hash\` varchar(191) NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`credentials_username_unique\` (\`username\`),
  KEY \`credentials_user_id_fk\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`transactions\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`user_id\` varchar(191) NOT NULL,
  \`type\` enum('ingreso','gasto') NOT NULL,
  \`category\` varchar(191) NOT NULL,
  \`amount\` decimal(10,2) NOT NULL,
  \`payment_method\` enum('efectivo','banco') NOT NULL,
  \`description\` text,
  \`date\` date NOT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`transactions_user_id_fk\` (\`user_id\`),
  KEY \`transactions_date_idx\` (\`date\`),
  KEY \`transactions_type_idx\` (\`type\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`employees\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`user_id\` varchar(191) NOT NULL,
  \`name\` varchar(191) NOT NULL,
  \`position\` varchar(191) DEFAULT NULL,
  \`salary\` decimal(10,2) DEFAULT NULL,
  \`hire_date\` date DEFAULT NULL,
  \`status\` enum('active','inactive') NOT NULL DEFAULT 'active',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`employees_user_id_fk\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`payroll\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`user_id\` varchar(191) NOT NULL,
  \`employee_id\` int NOT NULL,
  \`amount\` decimal(10,2) NOT NULL,
  \`payment_method\` enum('efectivo','banco') NOT NULL,
  \`payment_date\` date NOT NULL,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`payroll_user_id_fk\` (\`user_id\`),
  KEY \`payroll_employee_id_fk\` (\`employee_id\`),
  KEY \`payroll_payment_date_idx\` (\`payment_date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`providers\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`user_id\` varchar(191) NOT NULL,
  \`name\` varchar(191) NOT NULL,
  \`contact\` varchar(191) DEFAULT NULL,
  \`phone\` varchar(191) DEFAULT NULL,
  \`email\` varchar(191) DEFAULT NULL,
  \`address\` text,
  \`notes\` text,
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`providers_user_id_fk\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`config\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`user_id\` varchar(191) NOT NULL,
  \`key\` varchar(191) NOT NULL,
  \`value\` text NOT NULL,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`config_user_key_unique\` (\`user_id\`, \`key\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS \`daily_history\` (
  \`id\` int NOT NULL AUTO_INCREMENT,
  \`user_id\` varchar(191) NOT NULL,
  \`date\` date NOT NULL,
  \`total_income\` decimal(10,2) NOT NULL DEFAULT '0.00',
  \`total_expenses\` decimal(10,2) NOT NULL DEFAULT '0.00',
  \`net_income\` decimal(10,2) NOT NULL DEFAULT '0.00',
  \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`daily_history_user_date_unique\` (\`user_id\`, \`date\`),
  KEY \`daily_history_date_idx\` (\`date\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`users\` (\`id\`, \`name\`, \`email\`, \`role\`, \`store_name\`) VALUES
('admin-user-id', 'Administrador', 'admin@phonefix.com', 'admin', '1+PhoneFix'),
('sucursal-user-id', 'Sucursal Downtown', 'sucursal@phonefix.com', 'sucursal', 'Downtown')
ON DUPLICATE KEY UPDATE 
  \`name\` = VALUES(\`name\`),
  \`email\` = VALUES(\`email\`),
  \`role\` = VALUES(\`role\`),
  \`store_name\` = VALUES(\`store_name\`);

INSERT INTO \`credentials\` (\`user_id\`, \`username\`, \`password_hash\`) VALUES
('admin-user-id', 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
('sucursal-user-id', 'sucursal', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
ON DUPLICATE KEY UPDATE 
  \`password_hash\` = VALUES(\`password_hash\`);

INSERT INTO \`config\` (\`user_id\`, \`key\`, \`value\`) VALUES
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
ON DUPLICATE KEY UPDATE 
  \`value\` = VALUES(\`value\`);
`;

async function initDatabase() {
  console.log('🚀 Initializing database...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found!');
    process.exit(1);
  }

  let connection;
  try {
    connection = await mysql.createConnection(databaseUrl);
    console.log('✅ Connected to database');

    // Split and execute each statement
    const statements = SQL_SETUP.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    console.log('✅ Database initialized successfully!');
    console.log('👤 Users created:');
    console.log('   - admin / 1234');
    console.log('   - sucursal / 1234');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
