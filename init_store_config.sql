-- Insertar configuración inicial para tiendas si no existen
INSERT IGNORE INTO store_config (tienda, nombre, telefono, email, direccion, ciudad, estado, codigoPostal)
VALUES 
  ('admin', '1+PhoneFix - Admin', '(512) XXX-XXXX', 'admin@1plusphonefix.com', '123 Main Street', 'Austin', 'TX', '78701'),
  ('sucursal', '1+PhoneFix - Sucursal', '(512) YYY-YYYY', 'sucursal@1plusphonefix.com', '456 Oak Avenue', 'Austin', 'TX', '78702');

-- Verificar los datos insertados
SELECT * FROM store_config;
