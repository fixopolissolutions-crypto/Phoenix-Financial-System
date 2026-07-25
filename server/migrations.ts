import mysql from 'mysql2/promise';

/**
 * Aplica migraciones necesarias a la base de datos
 */
export async function applyMigrations() {
  if (!process.env.DATABASE_URL) {
    console.warn('[Migrations] DATABASE_URL not configured, skipping migrations');
    return;
  }

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('[Migrations] Checking and applying migrations...');

    // Migración 1: Agregar campo 'pagado' a repairs
    try {
      await connection.execute(`
        ALTER TABLE repairs 
        ADD COLUMN pagado INT NOT NULL DEFAULT 0 
        COMMENT '0 = no pagado, 1 = pagado'
      `);
      console.log('[Migrations] ✅ Added pagado field to repairs table');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('[Migrations] ⏭️  pagado field already exists');
      } else {
        throw error;
      }
    }

    // Migración 2: Crear tabla repair_parts si no existe
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS repair_parts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          repairId INT NOT NULL,
          partId INT NULL,
          esExterna INT NOT NULL DEFAULT 0,
          nombreExterno VARCHAR(200) NULL,
          cantidad INT NOT NULL,
          costoUnitario DECIMAL(10, 2) NOT NULL,
          costoTotal DECIMAL(10, 2) NOT NULL,
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (repairId) REFERENCES repairs(id) ON DELETE CASCADE,
          FOREIGN KEY (partId) REFERENCES inventory_parts(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[Migrations] ✅ Created repair_parts table');
    } catch (error: any) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('[Migrations] ⏭️  repair_parts table already exists');
      } else {
        console.log('[Migrations] ⚠️  Could not create repair_parts:', error.message);
      }
    }

    // Migración 3: Modificar partId para permitir NULL en repair_parts
    try {
      await connection.execute(`
        ALTER TABLE repair_parts 
        MODIFY COLUMN partId INT NULL 
        COMMENT 'FK a inventory_parts (null si es parte externa)'
      `);
      console.log('[Migrations] ✅ Modified partId to allow NULL in repair_parts');
    } catch (error: any) {
      console.log('[Migrations] ⚠️  Could not modify partId:', error.message);
    }

    // Migración 4: Agregar campo 'esExterna' a repair_parts
    try {
      await connection.execute(`
        ALTER TABLE repair_parts 
        ADD COLUMN esExterna INT NOT NULL DEFAULT 0 
        COMMENT '0 = del inventario, 1 = externa'
      `);
      console.log('[Migrations] ✅ Added esExterna field to repair_parts');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('[Migrations] ⏭️  esExterna field already exists');
      } else {
        throw error;
      }
    }

    // Migración 5: Agregar campo 'nombreExterno' a repair_parts
    try {
      await connection.execute(`
        ALTER TABLE repair_parts 
        ADD COLUMN nombreExterno VARCHAR(200) NULL 
        COMMENT 'Nombre si es parte externa'
      `);
      console.log('[Migrations] ✅ Added nombreExterno field to repair_parts');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('[Migrations] ⏭️  nombreExterno field already exists');
      } else {
        throw error;
      }
    }

    // Migración 6: Crear tabla store_config
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS store_config (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tienda ENUM('admin', 'sucursal') NOT NULL UNIQUE,
          nombre VARCHAR(200) NOT NULL,
          telefono VARCHAR(50),
          direccion TEXT,
          email VARCHAR(320),
          ciudad VARCHAR(100),
          estado VARCHAR(100),
          codigoPostal VARCHAR(20),
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
        )
      `);
      console.log('[Migrations] ✅ Created store_config table');
      
      // Insertar configuración por defecto
      await connection.execute(`
        INSERT INTO store_config (tienda, nombre, telefono, direccion, email, ciudad, estado) VALUES
        ('admin', 'Fixopolis Solutions', '(512) 555-0123', '123 Main St', 'admin@fixopolissolutions.com', 'Austin', 'TX'),
        ('sucursal', 'Fixopolis Solutions Sucursal', '(512) 555-0124', '456 Branch Ave', 'sucursal@fixopolissolutions.com', 'Austin', 'TX')
        ON DUPLICATE KEY UPDATE 
          nombre = VALUES(nombre)
      `);
      console.log('[Migrations] ✅ Inserted default store configurations');
    } catch (error: any) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('[Migrations] ⏭️  store_config table already exists');
      } else {
        console.log('[Migrations] ⚠️  Could not create store_config:', error.message);
      }
    }

    // Migración 7: Hacer dispositivo nullable en repairs
    try {
      await connection.execute(`
        ALTER TABLE repairs 
        MODIFY COLUMN dispositivo VARCHAR(200) NULL 
        COMMENT 'Modelo del dispositivo (opcional)'
      `);
      console.log('[Migrations] ✅ Made dispositivo nullable in repairs table');
    } catch (error: any) {
      console.log('[Migrations] ⚠️  Could not modify dispositivo:', error.message);
    }

    // Migración 8: Agregar columnas costoUnitario y costoTotal a repair_parts si no existen
    try {
      await connection.execute(`
        ALTER TABLE repair_parts 
        ADD COLUMN costoUnitario DECIMAL(10,2) NOT NULL DEFAULT 0.00 
        COMMENT 'Costo unitario de la parte'
      `);
      console.log('[Migrations] ✅ Added costoUnitario field to repair_parts');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('[Migrations] ⏭️  costoUnitario field already exists');
      } else {
        console.log('[Migrations] ⚠️  Could not add costoUnitario:', error.message);
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE repair_parts 
        ADD COLUMN costoTotal DECIMAL(10,2) NOT NULL DEFAULT 0.00 
        COMMENT 'Costo total (cantidad * costoUnitario)'
      `);
      console.log('[Migrations] ✅ Added costoTotal field to repair_parts');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('[Migrations] ⏭️  costoTotal field already exists');
      } else {
        console.log('[Migrations] ⚠️  Could not add costoTotal:', error.message);
      }
    }

    // Migración 9: Crear tabla servidor_requests para integración UnlockerFast
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS servidor_requests (
          id INT AUTO_INCREMENT PRIMARY KEY,
          tienda ENUM('admin', 'sucursal') NOT NULL DEFAULT 'admin',
          servicio VARCHAR(300) NOT NULL COMMENT 'Nombre del servicio solicitado',
          imei VARCHAR(100) NOT NULL COMMENT 'IMEI o número de serie',
          notas TEXT NULL COMMENT 'Notas adicionales',
          estado VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'Estado del pedido en UnlockerFast',
          orderId VARCHAR(100) NULL COMMENT 'ID del pedido en UnlockerFast',
          respuesta TEXT NULL COMMENT 'Respuesta completa de la API',
          costo DECIMAL(10,2) NULL COMMENT 'Costo del servicio',
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[Migrations] ✅ Created servidor_requests table');
    } catch (error: any) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('[Migrations] ⏭️  servidor_requests table already exists');
      } else {
        console.log('[Migrations] ⚠️  Could not create servidor_requests:', error.message);
      }
    }

    // Migración 10: Crear tabla config para configuración del sistema
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS config (
          id INT AUTO_INCREMENT PRIMARY KEY,
          \`key\` VARCHAR(100) NOT NULL UNIQUE,
          value TEXT NULL,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[Migrations] ✅ Created config table');

      // Insertar valores por defecto
      await connection.execute(`
        INSERT IGNORE INTO config (\`key\`, value) VALUES
          ('taxRate', '8.25'),
          ('porcentajeAhorro', '30'),
          ('porcentajeInversion', '20'),
          ('porcentajeEmergencia', '10'),
          ('porcentajeDisponible', '40'),
          ('cajaChicaAdmin', '500'),
          ('diaInicioSemana', '1'),
          ('diaFinSemana', '0'),
          ('zonaHoraria', 'America/Chicago'),
          ('reportEmail', '')
      `);
      console.log('[Migrations] ✅ Inserted default config values');
    } catch (error: any) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('[Migrations] ⏭️  config table already exists');
      } else {
        console.log('[Migrations] ⚠️  Could not create config table:', error.message);
      }
    }

    await connection.end();
    console.log('[Migrations] ✅ All migrations completed successfully');
    
  } catch (error) {
    console.error('[Migrations] ❌ Error applying migrations:', error);
    // No lanzar el error para no detener el servidor
  }
}
