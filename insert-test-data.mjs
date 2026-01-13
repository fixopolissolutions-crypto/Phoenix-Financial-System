import 'dotenv/config';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('Insertando datos de prueba...');

// Insertar ingresos de prueba
await connection.execute(`
  INSERT INTO transactions (tipo, monto, metodo, descripcion, categoria, tienda)
  VALUES 
    ('ingreso', 1000.00, 'efectivo', 'Venta de reparación iPhone', 'Reparaciones', 'admin'),
    ('ingreso', 500.00, 'banco', 'Venta de accesorios', 'Accesorios', 'admin'),
    ('ingreso', 750.00, 'efectivo', 'Reparación Samsung', 'Reparaciones', 'admin'),
    ('ingreso', 300.00, 'banco', 'Venta de fundas', 'Accesorios', 'admin')
`);

// Insertar gastos de prueba
await connection.execute(`
  INSERT INTO transactions (tipo, monto, metodo, descripcion, categoria, tienda)
  VALUES 
    ('gasto', 200.00, 'efectivo', 'Compra de repuestos', 'Inventario', 'admin'),
    ('gasto', 150.00, 'banco', 'Pago de servicios', 'Servicios', 'admin'),
    ('gasto', 100.00, 'efectivo', 'Material de limpieza', 'Mantenimiento', 'admin')
`);

console.log('✅ Datos de prueba insertados correctamente');
console.log('\nResumen:');
console.log('- Ingresos Efectivo: $1,750.00');
console.log('- Ingresos Banco: $800.00');
console.log('- Total Ingresos: $2,550.00');
console.log('- Impuesto (8.25%): $210.38');
console.log('- Ingresos Netos: $2,339.62');
console.log('\n- Gastos Efectivo: $300.00');
console.log('- Gastos Banco: $150.00');
console.log('- Total Gastos: $450.00');
console.log('\n- Ganancia Neta: $1,889.62');

await connection.end();
