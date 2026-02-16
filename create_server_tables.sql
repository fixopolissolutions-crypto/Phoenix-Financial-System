-- Tabla de servicios de servidor
CREATE TABLE IF NOT EXISTS server_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  serviceId VARCHAR(50) NOT NULL,
  serviceName VARCHAR(300) NOT NULL,
  groupName VARCHAR(200),
  serviceType ENUM('IMEI', 'SERVER', 'REMOTE') NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  precioVenta DECIMAL(10, 2) NOT NULL,
  tiempo VARCHAR(100),
  info TEXT,
  activo INT DEFAULT 1 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  UNIQUE KEY unique_serviceId (serviceId)
);

-- Tabla de pedidos de servidor
CREATE TABLE IF NOT EXISTS server_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  serviceId INT NOT NULL,
  cliente VARCHAR(200),
  telefono VARCHAR(50),
  email VARCHAR(320),
  imei VARCHAR(20),
  customFields TEXT,
  precioVenta DECIMAL(10, 2) NOT NULL,
  precioCosto DECIMAL(10, 2) NOT NULL,
  ganancia DECIMAL(10, 2) NOT NULL,
  estado ENUM('pendiente', 'procesando', 'completado', 'fallido', 'cancelado') DEFAULT 'pendiente' NOT NULL,
  referenceId VARCHAR(100),
  resultado TEXT,
  notas TEXT,
  tienda ENUM('admin', 'sucursal') DEFAULT 'admin' NOT NULL,
  fechaPedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  fechaCompletado TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_tienda (tienda),
  INDEX idx_estado (estado),
  INDEX idx_fechaPedido (fechaPedido)
);
