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

    // Migración 11: Crear tabla pos_transactions para el módulo POS
    try {
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
      console.log('[Migrations] ✅ Created pos_transactions table');
    } catch (error: any) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('[Migrations] ⏭️  pos_transactions table already exists');
      } else {
        console.log('[Migrations] ⚠️  Could not create pos_transactions:', error.message);
      }
    }

    // Migración 12: Agregar columna barcode a inventory_parts e inventory_accessories
    try {
      await connection.execute(`
        ALTER TABLE inventory_parts ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) NULL UNIQUE
      `);
      console.log('[Migrations] ✅ Added barcode column to inventory_parts');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME' || error.message?.includes('Duplicate column')) {
        console.log('[Migrations] ⏭️  barcode column already exists in inventory_parts');
      } else {
        console.log('[Migrations] ⚠️  Could not add barcode to inventory_parts:', error.message);
      }
    }

    try {
      await connection.execute(`
        ALTER TABLE inventory_accessories ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) NULL UNIQUE
      `);
      console.log('[Migrations] ✅ Added barcode column to inventory_accessories');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME' || error.message?.includes('Duplicate column')) {
        console.log('[Migrations] ⏭️  barcode column already exists in inventory_accessories');
      } else {
        console.log('[Migrations] ⚠️  Could not add barcode to inventory_accessories:', error.message);
      }
    }

    // Migración 13: Agregar columna imagen a inventory_accessories e inventory_parts
    try {
      await connection.execute(`
        ALTER TABLE inventory_accessories ADD COLUMN IF NOT EXISTS imagen VARCHAR(500) NULL
      `);
      console.log('[Migrations] ✅ Added imagen column to inventory_accessories');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME' || error.message?.includes('Duplicate column')) {
        console.log('[Migrations] ⏭️  imagen column already exists in inventory_accessories');
      } else {
        console.log('[Migrations] ⚠️  Could not add imagen to inventory_accessories:', error.message);
      }
    }
    try {
      await connection.execute(`
        ALTER TABLE inventory_parts ADD COLUMN IF NOT EXISTS imagen VARCHAR(500) NULL
      `);
      console.log('[Migrations] ✅ Added imagen column to inventory_parts');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME' || error.message?.includes('Duplicate column')) {
        console.log('[Migrations] ⏭️  imagen column already exists in inventory_parts');
      } else {
        console.log('[Migrations] ⚠️  Could not add imagen to inventory_parts:', error.message);
      }
    }

    // Migración 14: Recrear inventory_parts e inventory_accessories con el esquema correcto
    // (si existen con el esquema antiguo que no tiene codigo, precioCompraUnitario, etc.)
    try {
      const [partsColumns] = await connection.execute(`SHOW COLUMNS FROM inventory_parts`) as any;
      const partsColNames = partsColumns.map((c: any) => c.Field);
      const hasNewSchema = partsColNames.includes('codigo') && partsColNames.includes('precioCompraUnitario');
      if (!hasNewSchema) {
        console.log('[Migrations] 🔄 inventory_parts has old schema, recreating with new schema...');
        // Eliminar backup anterior si existe, luego renombrar tabla vieja
        await connection.execute(`DROP TABLE IF EXISTS inventory_parts_old_backup`).catch(() => {});
        await connection.execute(`RENAME TABLE inventory_parts TO inventory_parts_old_backup`).catch(async () => {
          // Si falla el rename, forzar drop directo
          await connection.execute(`DROP TABLE IF EXISTS inventory_parts`);
        });
        // Crear tabla nueva con esquema correcto
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS inventory_parts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            codigo VARCHAR(50) NOT NULL,
            nombre VARCHAR(200) NOT NULL,
            categoria VARCHAR(100) NULL,
            compatibilidad TEXT NULL,
            precioCompraUnitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            cantidadInicial INT NOT NULL DEFAULT 0,
            cantidadActual INT NOT NULL DEFAULT 0,
            cantidadUsada INT NOT NULL DEFAULT 0,
            stockMinimo INT NOT NULL DEFAULT 2,
            tienda ENUM('admin','sucursal') NOT NULL DEFAULT 'admin',
            activo INT NOT NULL DEFAULT 1,
            imagen VARCHAR(500) NULL,
            barcode VARCHAR(100) NULL,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY codigo_tienda_idx (codigo, tienda)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('[Migrations] ✅ Recreated inventory_parts with new schema');
      } else {
        console.log('[Migrations] ⏭️  inventory_parts already has new schema');
      }
    } catch (error: any) {
      console.log('[Migrations] ⚠️  Could not check/recreate inventory_parts:', error.message);
    }
    try {
      const [accColumns] = await connection.execute(`SHOW COLUMNS FROM inventory_accessories`) as any;
      const accColNames = accColumns.map((c: any) => c.Field);
      const hasNewSchema = accColNames.includes('codigo') && accColNames.includes('precioCompraUnitario');
      if (!hasNewSchema) {
        console.log('[Migrations] 🔄 inventory_accessories has old schema, recreating with new schema...');
        await connection.execute(`DROP TABLE IF EXISTS inventory_accessories_old_backup`).catch(() => {});
        await connection.execute(`RENAME TABLE inventory_accessories TO inventory_accessories_old_backup`).catch(async () => {
          await connection.execute(`DROP TABLE IF EXISTS inventory_accessories`);
        });
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS inventory_accessories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            codigo VARCHAR(50) NOT NULL UNIQUE,
            nombre VARCHAR(200) NOT NULL,
            categoria VARCHAR(100) NULL,
            precioCompraUnitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            precioVentaUnitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            cantidadInicial INT NOT NULL DEFAULT 0,
            cantidadActual INT NOT NULL DEFAULT 0,
            cantidadVendida INT NOT NULL DEFAULT 0,
            stockMinimo INT NOT NULL DEFAULT 5,
            tienda ENUM('admin','sucursal') NOT NULL DEFAULT 'admin',
            activo INT NOT NULL DEFAULT 1,
            imagen VARCHAR(500) NULL,
            barcode VARCHAR(100) NULL,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('[Migrations] ✅ Recreated inventory_accessories with new schema');
      } else {
        console.log('[Migrations] ⏭️  inventory_accessories already has new schema');
      }
    } catch (error: any) {
      console.log('[Migrations] ⚠️  Could not check/recreate inventory_accessories:', error.message);
    }

    // Migración 15: Crear tabla pos_services para gestión de servicios desde el dashboard
    try {
      const [svcRows] = await connection.execute(`SHOW TABLES LIKE 'pos_services'`) as any;
      if (svcRows.length === 0) {
        await connection.execute(`
          CREATE TABLE pos_services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(200) NOT NULL,
            descripcion TEXT NULL,
            precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            activo TINYINT(1) NOT NULL DEFAULT 1,
            imagen VARCHAR(500) NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Insert default services
        await connection.execute(`
          INSERT INTO pos_services (nombre, precio) VALUES
          ('Diagnóstico', 20.00),
          ('Limpieza de dispositivo', 15.00),
          ('Cambio de batería', 45.00),
          ('Cambio de pantalla', 80.00),
          ('Desbloqueo de red', 30.00),
          ('Reparación de carga', 35.00),
          ('Recuperación de datos', 60.00),
          ('Actualización de software', 25.00)
        `);
        console.log('[Migrations] ✅ Created pos_services table with 8 default services');
      } else {
        console.log('[Migrations] ⏭️  pos_services table already exists');
      }
    } catch (error: any) {
      console.log('[Migrations] ⚠️  Could not create pos_services:', error.message);
    }

    // ─── Migración 16: Add rol and nombre columns to credentials ───────────────
    try {
      const [colCheck] = await connection.execute(
        `SELECT COUNT(*) as cnt FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'credentials' AND column_name = 'rol'`
      ) as any;
      if (colCheck[0].cnt === 0) {
        await connection.execute(`ALTER TABLE credentials ADD COLUMN rol ENUM('admin','cajero') NOT NULL DEFAULT 'admin' AFTER tienda`);
        await connection.execute(`ALTER TABLE credentials ADD COLUMN nombre VARCHAR(100) NULL AFTER rol`);
        console.log('[Migrations] ✅ Added rol and nombre columns to credentials');
      } else {
        console.log('[Migrations] ⏭️  credentials.rol already exists');
      }
    } catch (error: any) {
      console.log('[Migrations] ⚠️  Could not add rol/nombre to credentials:', error.message);
    }

    // ─── Migración 17: Add tecnico, garantiaDias, garantiaVence to repairs ─────
    try {
      await connection.execute(`ALTER TABLE repairs ADD COLUMN tecnico VARCHAR(200) NULL`);
      await connection.execute(`ALTER TABLE repairs ADD COLUMN garantiaDias INT NOT NULL DEFAULT 30`);
      await connection.execute(`ALTER TABLE repairs ADD COLUMN garantiaVence TIMESTAMP NULL`);
      console.log('[Migrations] ✅ Added tecnico, garantiaDias, garantiaVence to repairs');
    } catch (error: any) {
      console.log('[Migrations] ⏭️  repairs tecnico/garantia columns already exist:', error.message);
    }

    // ─── Migración 18: Add codigoDesbloqueo, checklistComponentes, imagenesDispositivo to repairs ─────
    try {
      await connection.execute(`ALTER TABLE repairs ADD COLUMN codigoDesbloqueo VARCHAR(100) NULL COMMENT 'PIN, patrón o contraseña del dispositivo'`);
      await connection.execute(`ALTER TABLE repairs ADD COLUMN checklistComponentes TEXT NULL COMMENT 'JSON: estado de componentes del dispositivo'`);
      await connection.execute(`ALTER TABLE repairs ADD COLUMN imagenesDispositivo TEXT NULL COMMENT 'JSON array de URLs de imágenes del dispositivo'`);
      console.log('[Migrations] ✅ Added codigoDesbloqueo, checklistComponentes, imagenesDispositivo to repairs');
    } catch (error: any) {
      console.log('[Migrations] ⏭️  repairs new columns already exist:', error.message);
    }

    // ─── Migración 19: Create customers (CRM) table ───────────────────────────────────────────────
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS customers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(200) NOT NULL,
          telefono VARCHAR(50) NULL,
          email VARCHAR(320) NULL,
          direccion TEXT NULL,
          empresa VARCHAR(200) NULL COMMENT 'Para clientes B2B',
          esEmpresa INT NOT NULL DEFAULT 0 COMMENT '0=persona, 1=empresa',
          descuento DECIMAL(5,2) NOT NULL DEFAULT 0.00 COMMENT 'Porcentaje de descuento fijo',
          fuenteAdquisicion VARCHAR(100) NULL COMMENT 'referido, redes_sociales, walk_in, google, otro',
          notas TEXT NULL,
          tienda ENUM('admin','sucursal') NOT NULL DEFAULT 'admin',
          createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[Migrations] ✅ Created customers table');
    } catch (error: any) {
      console.log('[Migrations] ⏭️  customers table already exists:', error.message);
    }

    // ─── Migración 20: Sincronización completa del schema de repairs ────────────────────────
    // Usa SHOW COLUMNS para detectar el estado real de la tabla y aplicar
    // exactamente los cambios necesarios (agregar columnas faltantes y
    // hacer nullable las columnas del esquema antiguo).
    try {
      const [cols] = await connection.execute(`SHOW COLUMNS FROM repairs`) as any[];
      const existingCols = new Set(cols.map((c: any) => c.Field));
      const notNullCols = new Set(cols.filter((c: any) => c.Null === 'NO' && c.Default === null).map((c: any) => c.Field));

      // 1. Agregar columnas nuevas que faltan
      const colsToAdd: { col: string; sql: string }[] = [
        { col: 'cliente',              sql: `ALTER TABLE repairs ADD COLUMN cliente VARCHAR(200) NULL` },
        { col: 'telefono',             sql: `ALTER TABLE repairs ADD COLUMN telefono VARCHAR(50) NULL` },
        { col: 'dispositivo',          sql: `ALTER TABLE repairs ADD COLUMN dispositivo VARCHAR(200) NULL` },
        { col: 'problema',             sql: `ALTER TABLE repairs ADD COLUMN problema TEXT NULL` },
        { col: 'diagnostico',          sql: `ALTER TABLE repairs ADD COLUMN diagnostico TEXT NULL` },
        { col: 'precioManoObra',       sql: `ALTER TABLE repairs ADD COLUMN precioManoObra DECIMAL(10,2) NOT NULL DEFAULT 0.00` },
        { col: 'precioTotal',          sql: `ALTER TABLE repairs ADD COLUMN precioTotal DECIMAL(10,2) NOT NULL DEFAULT 0.00` },
        { col: 'costoPartes',          sql: `ALTER TABLE repairs ADD COLUMN costoPartes DECIMAL(10,2) NOT NULL DEFAULT 0.00` },
        { col: 'ganancia',             sql: `ALTER TABLE repairs ADD COLUMN ganancia DECIMAL(10,2) NOT NULL DEFAULT 0.00` },
        { col: 'estado',               sql: `ALTER TABLE repairs ADD COLUMN estado ENUM('pendiente','en_proceso','completada','entregada') NOT NULL DEFAULT 'pendiente'` },
        { col: 'fechaIngreso',         sql: `ALTER TABLE repairs ADD COLUMN fechaIngreso TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP` },
        { col: 'fechaCompletado',      sql: `ALTER TABLE repairs ADD COLUMN fechaCompletado TIMESTAMP NULL` },
        { col: 'fechaEntrega',         sql: `ALTER TABLE repairs ADD COLUMN fechaEntrega TIMESTAMP NULL` },
        { col: 'tienda',               sql: `ALTER TABLE repairs ADD COLUMN tienda ENUM('admin','sucursal') NOT NULL DEFAULT 'admin'` },
        { col: 'pagado',               sql: `ALTER TABLE repairs ADD COLUMN pagado INT NOT NULL DEFAULT 0` },
        { col: 'notas',                sql: `ALTER TABLE repairs ADD COLUMN notas TEXT NULL` },
        { col: 'tecnico',              sql: `ALTER TABLE repairs ADD COLUMN tecnico VARCHAR(200) NULL` },
        { col: 'garantiaDias',         sql: `ALTER TABLE repairs ADD COLUMN garantiaDias INT NOT NULL DEFAULT 30` },
        { col: 'garantiaVence',        sql: `ALTER TABLE repairs ADD COLUMN garantiaVence TIMESTAMP NULL` },
        { col: 'codigoDesbloqueo',     sql: `ALTER TABLE repairs ADD COLUMN codigoDesbloqueo VARCHAR(100) NULL` },
        { col: 'checklistComponentes', sql: `ALTER TABLE repairs ADD COLUMN checklistComponentes TEXT NULL` },
        { col: 'imagenesDispositivo',  sql: `ALTER TABLE repairs ADD COLUMN imagenesDispositivo TEXT NULL` },
      ];
      for (const { col, sql } of colsToAdd) {
        if (!existingCols.has(col)) {
          try {
            await connection.execute(sql);
            console.log(`[Migrations] ✅ Added column ${col} to repairs`);
          } catch (e: any) {
            console.log(`[Migrations] ⚠️  Could not add ${col}:`, e.message);
          }
        }
      }

      // 2. Hacer nullable las columnas del esquema antiguo que son NOT NULL sin default
      // (clienteNombre, descripcionProblema, etc.) para que el INSERT nuevo no falle
      const oldNotNullCols: { col: string; sql: string }[] = [
        { col: 'clienteNombre',     sql: `ALTER TABLE repairs MODIFY COLUMN clienteNombre VARCHAR(200) NULL DEFAULT NULL` },
        { col: 'clienteTelefono',   sql: `ALTER TABLE repairs MODIFY COLUMN clienteTelefono VARCHAR(50) NULL DEFAULT NULL` },
        { col: 'clienteEmail',      sql: `ALTER TABLE repairs MODIFY COLUMN clienteEmail VARCHAR(320) NULL DEFAULT NULL` },
        { col: 'dispositivoMarca',  sql: `ALTER TABLE repairs MODIFY COLUMN dispositivoMarca VARCHAR(100) NULL DEFAULT NULL` },
        { col: 'dispositivoModelo', sql: `ALTER TABLE repairs MODIFY COLUMN dispositivoModelo VARCHAR(100) NULL DEFAULT NULL` },
        { col: 'dispositivoImei',   sql: `ALTER TABLE repairs MODIFY COLUMN dispositivoImei VARCHAR(20) NULL DEFAULT NULL` },
        { col: 'descripcionProblema', sql: `ALTER TABLE repairs MODIFY COLUMN descripcionProblema TEXT NULL` },
        { col: 'costoManoObra',     sql: `ALTER TABLE repairs MODIFY COLUMN costoManoObra DECIMAL(10,2) NULL DEFAULT 0.00` },
        { col: 'costoTotal',        sql: `ALTER TABLE repairs MODIFY COLUMN costoTotal DECIMAL(10,2) NULL DEFAULT 0.00` },
        { col: 'anticipo',          sql: `ALTER TABLE repairs MODIFY COLUMN anticipo DECIMAL(10,2) NULL DEFAULT 0.00` },
        { col: 'fechaRecibido',     sql: `ALTER TABLE repairs MODIFY COLUMN fechaRecibido TIMESTAMP NULL DEFAULT NULL` },
        { col: 'prioridad',         sql: `ALTER TABLE repairs MODIFY COLUMN prioridad VARCHAR(50) NULL DEFAULT 'normal'` },
      ];
      for (const { col, sql } of oldNotNullCols) {
        if (existingCols.has(col) && notNullCols.has(col)) {
          try {
            await connection.execute(sql);
            console.log(`[Migrations] ✅ Made ${col} nullable in repairs`);
          } catch (e: any) {
            console.log(`[Migrations] ⚠️  Could not nullify ${col}:`, e.message);
          }
        }
      }
      console.log('[Migrations] ✅ Migration 20 complete: repairs schema fully synchronized');
    } catch (error: any) {
      console.log('[Migrations] ⚠️  Migration 20 error:', error.message);
    }

    await connection.end();
    console.log('[Migrations] ✅ All migrations completed successfully');
    
  } catch (error) {
    console.error('[Migrations] ❌ Error applying migrations:', error);
    // No lanzar el error para no detener el servidor
  }
}
