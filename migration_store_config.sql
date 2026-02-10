-- Migración: Agregar tabla store_config para configuración de tiendas
-- Fecha: 2026-02-09

-- Crear tabla store_config
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
);

-- Insertar configuración por defecto para ambas tiendas
INSERT INTO store_config (tienda, nombre, telefono, direccion, email, ciudad, estado) VALUES
('admin', '1+PhoneFix', '(512) 555-0123', '123 Main St', 'admin@1phonefix.com', 'Austin', 'TX'),
('sucursal', '1+PhoneFix Sucursal', '(512) 555-0124', '456 Branch Ave', 'sucursal@1phonefix.com', 'Austin', 'TX')
ON DUPLICATE KEY UPDATE 
  nombre = VALUES(nombre),
  telefono = VALUES(telefono),
  direccion = VALUES(direccion),
  email = VALUES(email),
  ciudad = VALUES(ciudad),
  estado = VALUES(estado);
