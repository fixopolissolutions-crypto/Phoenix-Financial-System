# Phoenix Financial System

Sistema financiero completo para gestión de ingresos, gastos, nómina y reportes para negocios.

## 🚀 Características

- **Dashboard Financiero**: Resumen en tiempo real de ingresos, gastos e impuestos
- **Gestión de Ingresos y Gastos**: Registro detallado con categorías y métodos de pago
- **Sistema de Nómina**: Administración de empleados y pagos integrados con gastos
- **Gestión de Proveedores**: Base de datos de proveedores con información de contacto
- **Reportes PDF**: Generación de reportes semanales profesionales con gráficos
- **Distribución de Fondos**: Cálculo automático de ahorro (10%), inversión (10%), emergencia (5%) y disponible (75%)
- **Multi-tienda**: Soporte para múltiples sucursales (admin y sucursal)
- **Historial Completo**: Registro de todas las transacciones con filtros

## 🛠️ Tecnologías

### Frontend
- React 19 + TypeScript
- Vite
- TailwindCSS
- Radix UI Components
- Recharts para gráficos
- React Hook Form + Zod para validación

### Backend
- Node.js + Express
- tRPC para comunicación type-safe
- Drizzle ORM
- MySQL 8.0

### Autenticación
- Sistema de credenciales local
- Soporte para Manus OAuth

## 📦 Instalación Local

### Requisitos
- Node.js 18+
- pnpm
- MySQL 8.0

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/gghhff/Phoenix-Financial-System.git
cd Phoenix-Financial-System
```

2. **Instalar dependencias**
```bash
pnpm install
```

3. **Configurar base de datos**

Crear base de datos MySQL:
```sql
CREATE DATABASE phonefix_db;
CREATE USER 'phonefix_user'@'localhost' IDENTIFIED BY 'tu_contraseña';
GRANT ALL PRIVILEGES ON phonefix_db.* TO 'phonefix_user'@'localhost';
FLUSH PRIVILEGES;
```

4. **Configurar variables de entorno**

Crear archivo `.env`:
```env
DATABASE_URL=mysql://phonefix_user:tu_contraseña@localhost:3306/phonefix_db
NODE_ENV=development
PORT=3000
```

5. **Ejecutar migraciones**
```bash
pnpm db:push
```

6. **Crear usuarios de prueba**
```bash
node seed-credentials.mjs
```

Esto creará:
- Usuario admin: `admin` / `1234`
- Usuario sucursal: `sucursal` / `1234`

7. **Iniciar servidor de desarrollo**
```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🚀 Despliegue en Railway

### Opción 1: Desde GitHub (Recomendado)

1. Haz fork de este repositorio o clónalo a tu cuenta
2. Ve a [Railway](https://railway.app) y crea una cuenta
3. Crea un nuevo proyecto desde GitHub
4. Selecciona este repositorio
5. Agrega un servicio MySQL:
   - Click en "+ New"
   - Selecciona "Database" → "Add MySQL"
6. Configura variables de entorno:
   - `DATABASE_URL`: Railway lo configura automáticamente
   - `NODE_ENV`: `production`
7. Ejecuta las migraciones:
   ```bash
   railway run pnpm db:push
   railway run node seed-credentials.mjs
   ```
8. Railway generará una URL pública automáticamente

### Opción 2: Desde Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Iniciar sesión
railway login

# Inicializar proyecto
railway init

# Agregar MySQL
railway add

# Desplegar
railway up
```

## 📊 Estructura del Proyecto

```
phonefix-financial-system/
├── client/              # Frontend React
│   └── src/
│       ├── components/  # Componentes reutilizables
│       ├── pages/       # Páginas principales
│       └── lib/         # Utilidades y configuración
├── server/              # Backend Node.js
│   ├── _core/          # Servidor Express
│   ├── routers.ts      # Rutas tRPC
│   └── db.ts           # Configuración de base de datos
├── drizzle/            # Esquemas de base de datos
│   └── schema.ts
└── seed-credentials.mjs # Script para crear usuarios
```

## 🗄️ Base de Datos

### Tablas

- **users**: Usuarios del sistema
- **credentials**: Credenciales de acceso
- **transactions**: Ingresos y gastos
- **employees**: Empleados
- **payroll**: Registros de nómina
- **providers**: Proveedores
- **config**: Configuración del sistema
- **daily_history**: Historial diario

## 📝 Scripts Disponibles

```bash
pnpm dev          # Servidor de desarrollo
pnpm build        # Build para producción
pnpm start        # Iniciar en producción
pnpm db:push      # Aplicar migraciones
pnpm check        # Verificar TypeScript
pnpm format       # Formatear código
pnpm test         # Ejecutar tests
```

## 🔐 Seguridad

- Las contraseñas deben cambiarse en producción
- El archivo `.env` nunca debe subirse a GitHub
- Usa variables de entorno para secretos
- Configura CORS apropiadamente en producción

## 📄 Licencia

MIT

## 👤 Autor

Desarrollado para gestión financiera de negocios.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor abre un issue primero para discutir cambios mayores.

## 📞 Soporte

Para soporte, abre un issue en GitHub.
