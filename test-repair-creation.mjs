#!/usr/bin/env node
/**
 * Script de prueba para diagnosticar el problema de creación de reparaciones
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

async function testRepairCreation() {
  console.log('=== TEST DE CREACIÓN DE REPARACIONES ===\n');
  
  // Verificar DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL no está configurado');
    console.log('Por favor, configura la variable de entorno DATABASE_URL');
    return;
  }
  
  console.log('✅ DATABASE_URL configurado');
  console.log('URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'), '\n');
  
  let connection;
  
  try {
    // Conectar a la base de datos
    console.log('📡 Conectando a la base de datos...');
    connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Conexión exitosa\n');
    
    // Verificar que la tabla repairs existe
    console.log('🔍 Verificando tabla repairs...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'repairs'"
    );
    
    if (!Array.isArray(tables) || tables.length === 0) {
      console.error('❌ ERROR: La tabla repairs no existe');
      console.log('Ejecuta las migraciones primero: pnpm db:push');
      return;
    }
    console.log('✅ Tabla repairs existe\n');
    
    // Verificar estructura de la tabla
    console.log('🔍 Verificando estructura de la tabla repairs...');
    const [columns] = await connection.execute('DESCRIBE repairs');
    console.log('Columnas:');
    console.table(columns);
    
    // Datos de prueba
    const testData = {
      codigo: 'TEST-001',
      cliente: 'Cliente de Prueba',
      telefono: '555-1234',
      dispositivo: 'iPhone 13 Pro',
      problema: 'Pantalla rota',
      diagnostico: 'Requiere reemplazo de pantalla',
      precioManoObra: '50.00',
      precioTotal: '150.00',
      costoPartes: '0.00',
      ganancia: '100.00',
      fechaIngreso: new Date(),
      tienda: 'admin',
      notas: 'Prueba de creación',
    };
    
    console.log('\n📝 Datos de prueba:');
    console.log(JSON.stringify(testData, null, 2));
    
    // Calcular ganancia como lo hace el código
    const costoPartes = 0;
    const ganancia = Number(testData.precioTotal) - Number(testData.precioManoObra) - costoPartes;
    console.log('\n🧮 Cálculo de ganancia:');
    console.log(`precioTotal (${testData.precioTotal}) - precioManoObra (${testData.precioManoObra}) - costoPartes (${costoPartes}) = ${ganancia}`);
    
    // Eliminar registro de prueba si existe
    console.log('\n🧹 Limpiando registros de prueba anteriores...');
    await connection.execute(
      "DELETE FROM repairs WHERE codigo = 'TEST-001'"
    );
    
    // Intentar insertar
    console.log('\n💾 Intentando insertar reparación de prueba...');
    try {
      const [result] = await connection.execute(
        `INSERT INTO repairs (
          codigo, cliente, telefono, dispositivo, problema, diagnostico,
          precioManoObra, precioTotal, costoPartes, ganancia,
          fechaIngreso, tienda, notas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          testData.codigo,
          testData.cliente,
          testData.telefono,
          testData.dispositivo,
          testData.problema,
          testData.diagnostico,
          testData.precioManoObra,
          testData.precioTotal,
          testData.costoPartes,
          ganancia.toFixed(2),
          testData.fechaIngreso,
          testData.tienda,
          testData.notas
        ]
      );
      
      console.log('✅ Inserción exitosa!');
      console.log('ID generado:', result.insertId);
      
      // Verificar que se insertó correctamente
      const [rows] = await connection.execute(
        "SELECT * FROM repairs WHERE codigo = 'TEST-001'"
      );
      
      console.log('\n📊 Registro insertado:');
      console.table(rows);
      
      // Limpiar
      console.log('\n🧹 Limpiando registro de prueba...');
      await connection.execute(
        "DELETE FROM repairs WHERE codigo = 'TEST-001'"
      );
      console.log('✅ Limpieza completada');
      
    } catch (insertError) {
      console.error('❌ ERROR al insertar:');
      console.error('Mensaje:', insertError.message);
      console.error('Código:', insertError.code);
      console.error('SQL State:', insertError.sqlState);
      console.error('\nStack trace:');
      console.error(insertError.stack);
    }
    
  } catch (error) {
    console.error('❌ ERROR:');
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    console.error('\nStack trace:');
    console.error(error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar prueba
testRepairCreation().catch(console.error);
