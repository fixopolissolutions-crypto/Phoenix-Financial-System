import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL no está configurada');
    process.exit(1);
  }

  console.log('📦 Conectando a la base de datos...');
  
  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ Conexión establecida');

    // Leer el archivo de migración
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migration_reparaciones.sql'),
      'utf8'
    );

    // Dividir en comandos individuales
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📝 Ejecutando ${commands.length} comandos SQL...`);

    for (const command of commands) {
      if (command.trim()) {
        try {
          await connection.execute(command);
          console.log(`✅ Ejecutado: ${command.substring(0, 50)}...`);
        } catch (error) {
          // Ignorar errores de columnas que ya existen
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`⚠️  Campo ya existe, continuando...`);
          } else {
            throw error;
          }
        }
      }
    }

    await connection.end();
    console.log('✅ Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error al aplicar migración:', error);
    process.exit(1);
  }
}

applyMigration();
