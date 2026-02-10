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

    // Migración 2: Modificar partId para permitir NULL en repair_parts
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

    // Migración 3: Agregar campo 'esExterna' a repair_parts
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

    // Migración 4: Agregar campo 'nombreExterno' a repair_parts
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

    // Migración 5: Crear tabla store_config
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
        ('admin', '1+PhoneFix', '(512) 555-0123', '123 Main St', 'admin@1phonefix.com', 'Austin', 'TX'),
        ('sucursal', '1+PhoneFix Sucursal', '(512) 555-0124', '456 Branch Ave', 'sucursal@1phonefix.com', 'Austin', 'TX')
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

    await connection.end();
    console.log('[Migrations] ✅ All migrations completed successfully');
    
  } catch (error) {
    console.error('[Migrations] ❌ Error applying migrations:', error);
    // No lanzar el error para no detener el servidor
  }
}
