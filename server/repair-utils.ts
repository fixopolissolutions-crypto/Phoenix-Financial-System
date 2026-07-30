import mysql from 'mysql2/promise';

/**
 * Obtiene el siguiente código de reparación disponible con prefijo por tienda.
 * Busca el número más alto usado para garantizar que nunca colisione,
 * incluso si hubo intentos fallidos previos.
 * Admin: ADM-001, ADM-002, etc.
 * Sucursal: SUC-001, SUC-002, etc.
 */
export async function getNextRepairCode(tienda: string): Promise<string> {
  if (!process.env.DATABASE_URL) {
    throw new Error("Database not available");
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    const prefix = tienda === 'admin' ? 'ADM' : 'SUC';

    // Obtener todos los códigos con este prefijo para encontrar el máximo
    const [rows] = await connection.execute(
      `SELECT codigo FROM repairs WHERE codigo LIKE ? ORDER BY id DESC`,
      [`${prefix}-%`]
    ) as any[];

    await connection.end();

    if (!Array.isArray(rows) || rows.length === 0) {
      return `${prefix}-001`;
    }

    // Extraer todos los números usados y tomar el máximo
    let maxNumber = 0;
    for (const row of rows) {
      const match = String(row.codigo).match(/-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }

    const nextNumber = maxNumber + 1;
    return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;

  } catch (error) {
    await connection.end();
    throw error;
  }
}
