-- Migración para agregar mejoras al módulo de reparaciones
-- Fecha: 2026-02-09

-- Agregar campo 'pagado' a la tabla repairs
ALTER TABLE repairs ADD COLUMN pagado INT NOT NULL DEFAULT 0 COMMENT '0 = no pagado, 1 = pagado';

-- Modificar tabla repair_parts para soportar partes externas
ALTER TABLE repair_parts MODIFY COLUMN partId INT NULL COMMENT 'FK a inventory_parts (null si es parte externa)';
ALTER TABLE repair_parts ADD COLUMN esExterna INT NOT NULL DEFAULT 0 COMMENT '0 = del inventario, 1 = externa';
ALTER TABLE repair_parts ADD COLUMN nombreExterno VARCHAR(200) NULL COMMENT 'Nombre si es parte externa';

-- Verificar que los cambios se aplicaron correctamente
SELECT 'Migración completada exitosamente' AS status;
