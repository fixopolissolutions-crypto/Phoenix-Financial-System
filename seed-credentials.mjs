import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL no está definida en .env');
  process.exit(1);
}

async function seed() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // Insertar credenciales por defecto
  await connection.execute(`
    INSERT INTO credentials (username, password, tienda) 
    VALUES ('admin', '1234', 'admin')
    ON DUPLICATE KEY UPDATE password = '1234', tienda = 'admin'
  `);
  
  await connection.execute(`
    INSERT INTO credentials (username, password, tienda) 
    VALUES ('sucursal', '1234', 'sucursal')
    ON DUPLICATE KEY UPDATE password = '1234', tienda = 'sucursal'
  `);
  
  console.log('Credenciales insertadas correctamente');
  await connection.end();
}

seed().catch(console.error);
