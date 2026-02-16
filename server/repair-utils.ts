import mysql from 'mysql2/promise';

/**
 * Obtiene el siguiente código de reparación disponible con prefijo por tienda
 * Admin: ADM-001, ADM-002, etc.
 * Sucursal: SUC-001, SUC-002, etc.
 * @param tienda - La tienda para la cual generar el código
 * @returns El siguiente código disponible
 */
export async function getNextRepairCode(tienda: string): Promise<string> {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Obtener el último código de reparación para esta tienda
    const [rows] = await connection.execute(
      `SELECT codigo FROM repairs 
       WHERE tienda = ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [tienda]
    );
    
    await connection.end();
    
    // Determinar el prefijo según la tienda
    const prefix = tienda === 'admin' ? 'ADM' : 'SUC';
    
    if (!Array.isArray(rows) || rows.length === 0) {
      // No hay reparaciones previas, empezar con XXX-001
      return `${prefix}-001`;
    }
    
    const lastCode = (rows[0] as any).codigo as string;
    
    // Extraer el número del código (ADM-001 -> 001 o SUC-001 -> 001)
    const match = lastCode.match(/(ADM|SUC|REP)-(\d+)/);
    if (!match) {
      // Si el formato no es válido, empezar con XXX-001
      return `${prefix}-001`;
    }
    
    const lastNumber = parseInt(match[2], 10);
    const nextNumber = lastNumber + 1;
    
    // Formatear con ceros a la izquierda y prefijo de tienda (ADM-001, SUC-001, etc.)
    const nextCode = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
    
    return nextCode;
    
  } catch (error) {
    await connection.end();
    throw error;
  }
}
