-- Migración para permitir códigos de partes duplicados por tienda
-- Fecha: 2026-02-09

-- 1. Eliminar el constraint único actual en la columna 'codigo'
ALTER TABLE inventory_parts DROP INDEX codigo;

-- 2. Crear un índice único compuesto en 'codigo' y 'tienda'
-- Esto permite que cada tienda tenga sus propios códigos de partes
ALTER TABLE inventory_parts ADD UNIQUE INDEX codigo_tienda_idx (codigo, tienda);

-- Verificación:
-- SELECT * FROM inventory_parts WHERE codigo = 'PART-001';
-- Ahora debería permitir que tanto 'admin' como 'sucursal' tengan 'PART-001'
