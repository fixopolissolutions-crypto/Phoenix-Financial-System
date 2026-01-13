CREATE TABLE `config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(100) NOT NULL,
	`value` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `config_id` PRIMARY KEY(`id`),
	CONSTRAINT `config_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(50) NOT NULL,
	`password` varchar(255) NOT NULL,
	`tienda` enum('admin','sucursal') NOT NULL DEFAULT 'admin',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `credentials_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `daily_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fecha` varchar(10) NOT NULL,
	`tienda` enum('admin','sucursal') NOT NULL DEFAULT 'admin',
	`totalIngresos` decimal(10,2) NOT NULL DEFAULT '0',
	`totalGastos` decimal(10,2) NOT NULL DEFAULT '0',
	`totalNomina` decimal(10,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(200) NOT NULL,
	`puesto` varchar(100),
	`salario` decimal(10,2),
	`telefono` varchar(50),
	`email` varchar(320),
	`tienda` enum('admin','sucursal') NOT NULL DEFAULT 'admin',
	`activo` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll` (
	`id` int AUTO_INCREMENT NOT NULL,
	`employeeId` int NOT NULL,
	`monto` decimal(10,2) NOT NULL,
	`metodo` enum('efectivo','banco') NOT NULL,
	`descripcion` text,
	`tienda` enum('admin','sucursal') NOT NULL DEFAULT 'admin',
	`fecha` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payroll_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(200) NOT NULL,
	`telefono` varchar(50),
	`email` varchar(320),
	`direccion` text,
	`notas` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `providers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` enum('ingreso','gasto') NOT NULL,
	`monto` decimal(10,2) NOT NULL,
	`metodo` enum('efectivo','banco') NOT NULL,
	`descripcion` text,
	`categoria` varchar(100),
	`proveedor` varchar(200),
	`tienda` enum('admin','sucursal') NOT NULL DEFAULT 'admin',
	`fecha` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
