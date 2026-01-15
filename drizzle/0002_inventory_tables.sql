-- Migración para agregar tablas de inventario

CREATE TABLE `inventory_phones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`modelo` varchar(200) NOT NULL,
	`marca` varchar(100),
	`imei` varchar(50),
	`carrier` varchar(50),
	`condicion` enum('nuevo','usado_a','usado_b','usado_c','para_partes') NOT NULL DEFAULT 'usado_a',
	`precioCompra` decimal(10,2) NOT NULL,
	`precioVenta` decimal(10,2),
	`precioVentaReal` decimal(10,2),
	`ganancia` decimal(10,2),
	`estado` enum('disponible','vendido','reservado') NOT NULL DEFAULT 'disponible',
	`notas` text,
	`tienda` enum('admin','sucursal') NOT NULL DEFAULT 'admin',
	`fechaCompra` timestamp NOT NULL,
	`fechaVenta` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_phones_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_phones_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `inventory_accessories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`nombre` varchar(200) NOT NULL,
	`categoria` varchar(100),
	`precioCompraUnitario` decimal(10,2) NOT NULL,
	`precioVentaUnitario` decimal(10,2),
	`cantidadInicial` int NOT NULL,
	`cantidadActual` int NOT NULL,
	`cantidadVendida` int NOT NULL DEFAULT 0,
	`stockMinimo` int NOT NULL DEFAULT 5,
	`tienda` enum('admin','sucursal') NOT NULL DEFAULT 'admin',
	`activo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_accessories_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_accessories_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `inventory_parts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`nombre` varchar(200) NOT NULL,
	`categoria` varchar(100),
	`compatibilidad` text,
	`precioCompraUnitario` decimal(10,2) NOT NULL,
	`cantidadInicial` int NOT NULL,
	`cantidadActual` int NOT NULL,
	`cantidadUsada` int NOT NULL DEFAULT 0,
	`stockMinimo` int NOT NULL DEFAULT 2,
	`tienda` enum('admin','sucursal') NOT NULL DEFAULT 'admin',
	`activo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_parts_id` PRIMARY KEY(`id`),
	CONSTRAINT `inventory_parts_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `repairs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(50) NOT NULL,
	`cliente` varchar(200),
	`telefono` varchar(50),
	`dispositivo` varchar(200) NOT NULL,
	`problema` text NOT NULL,
	`diagnostico` text,
	`precioManoObra` decimal(10,2) NOT NULL,
	`precioTotal` decimal(10,2) NOT NULL,
	`costoPartes` decimal(10,2) NOT NULL DEFAULT '0',
	`ganancia` decimal(10,2) NOT NULL,
	`estado` enum('pendiente','en_proceso','completada','entregada') NOT NULL DEFAULT 'pendiente',
	`fechaIngreso` timestamp NOT NULL,
	`fechaCompletado` timestamp,
	`fechaEntrega` timestamp,
	`tienda` enum('admin','sucursal') NOT NULL DEFAULT 'admin',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `repairs_id` PRIMARY KEY(`id`),
	CONSTRAINT `repairs_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `repair_parts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`repairId` int NOT NULL,
	`partId` int NOT NULL,
	`cantidad` int NOT NULL DEFAULT 1,
	`precioUnitario` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `repair_parts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` enum('compra','venta','uso_reparacion','ajuste') NOT NULL,
	`categoria` enum('telefono','accesorio','parte') NOT NULL,
	`itemId` int NOT NULL,
	`cantidad` int NOT NULL,
	`precioUnitario` decimal(10,2),
	`precioTotal` decimal(10,2),
	`referencia` varchar(100),
	`notas` text,
	`tienda` enum('admin','sucursal') NOT NULL DEFAULT 'admin',
	`fecha` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_movements_id` PRIMARY KEY(`id`)
);
