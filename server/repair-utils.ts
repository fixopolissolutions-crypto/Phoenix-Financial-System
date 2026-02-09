import mysql from 'mysql2/promise';

/**
 * Obtiene el siguiente código de reparación disponible (REP-001, REP-002, etc.)
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
    
    if (!Array.isArray(rows) || rows.length === 0) {
      // No hay reparaciones previas, empezar con REP-001
      return 'REP-001';
    }
    
    const lastCode = (rows[0] as any).codigo as string;
    
    // Extraer el número del código (REP-001 -> 001)
    const match = lastCode.match(/REP-(\d+)/);
    if (!match) {
      // Si el formato no es válido, empezar con REP-001
      return 'REP-001';
    }
    
    const lastNumber = parseInt(match[1], 10);
    const nextNumber = lastNumber + 1;
    
    // Formatear con ceros a la izquierda (001, 002, etc.)
    const nextCode = `REP-${nextNumber.toString().padStart(3, '0')}`;
    
    return nextCode;
    
  } catch (error) {
    await connection.end();
    throw error;
  }
}
