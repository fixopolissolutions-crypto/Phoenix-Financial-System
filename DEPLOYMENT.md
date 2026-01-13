# Guía de Despliegue - PhoneFix Financial System

Esta guía te ayudará a desplegar tu aplicación PhoneFix en diferentes entornos de producción.

## 🌐 Opciones de Despliegue

### Opción 1: Servidor VPS (Recomendado para Producción)

Esta opción es ideal para tener control completo sobre tu aplicación y base de datos.

#### Proveedores Recomendados

**DigitalOcean**: Droplets desde $6/mes con 1GB RAM. Fácil de configurar y administrar. Panel de control intuitivo.

**Linode (Akamai)**: Planes desde $5/mes. Excelente rendimiento y soporte técnico. Red global de centros de datos.

**Vultr**: Instancias desde $5/mes. Múltiples ubicaciones globales. Buena relación precio-rendimiento.

**AWS Lightsail**: Desde $5/mes. Integración con servicios AWS. Escalabilidad sencilla.

#### Requisitos del Servidor

Para ejecutar PhoneFix necesitas un servidor con al menos 1GB de RAM, 1 CPU core, 25GB de almacenamiento SSD, Ubuntu 22.04 LTS o similar, y acceso SSH con permisos sudo.

#### Pasos de Instalación en VPS

**1. Conectar al servidor vía SSH**

```bash
ssh root@tu-servidor-ip
```

**2. Actualizar el sistema**

```bash
apt update && apt upgrade -y
```

**3. Instalar Node.js 22.x**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt install -y nodejs
```

**4. Instalar pnpm**

```bash
npm install -g pnpm
```

**5. Instalar MySQL**

```bash
apt install -y mysql-server
mysql_secure_installation
```

**6. Crear base de datos y usuario**

```bash
mysql -u root -p
```

Dentro de MySQL:

```sql
CREATE DATABASE phonefix_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'phonefix_user'@'localhost' IDENTIFIED BY 'TU_CONTRASEÑA_SEGURA';
GRANT ALL PRIVILEGES ON phonefix_db.* TO 'phonefix_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**7. Clonar o subir el proyecto**

```bash
cd /var/www
# Si usas Git:
git clone tu-repositorio.git phonefix
# O sube los archivos vía SFTP
```

**8. Configurar variables de entorno**

```bash
cd /var/www/phonefix
nano .env
```

Contenido del `.env` para producción:

```env
DATABASE_URL=mysql://phonefix_user:TU_CONTRASEÑA_SEGURA@localhost:3306/phonefix_db
NODE_ENV=production
PORT=3000
OWNER_OPEN_ID=tu_open_id_aqui
```

**9. Instalar dependencias y compilar**

```bash
pnpm install
pnpm db:push
node seed-credentials.mjs
pnpm build
```

**10. Configurar PM2 para mantener la app corriendo**

```bash
npm install -g pm2
pm2 start dist/index.js --name phonefix
pm2 startup
pm2 save
```

**11. Configurar Nginx como reverse proxy**

```bash
apt install -y nginx
nano /etc/nginx/sites-available/phonefix
```

Contenido del archivo:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activar el sitio:

```bash
ln -s /etc/nginx/sites-available/phonefix /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

**12. Configurar SSL con Let's Encrypt (Opcional pero recomendado)**

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d tu-dominio.com
```

### Opción 2: Plataformas Cloud (Más Fácil)

#### Railway.app

Railway es una plataforma moderna que simplifica el despliegue de aplicaciones web.

**Pasos**:

1. Crea una cuenta en [railway.app](https://railway.app)
2. Crea un nuevo proyecto y selecciona "Deploy from GitHub repo"
3. Conecta tu repositorio de GitHub
4. Railway detectará automáticamente que es una aplicación Node.js
5. Agrega un servicio MySQL desde el marketplace de Railway
6. Configura las variables de entorno en el dashboard
7. Railway desplegará automáticamente tu aplicación

**Costo**: Plan gratuito con $5 de crédito mensual. Planes pagos desde $5/mes.

#### Render.com

Render ofrece despliegue automático con integración Git.

**Pasos**:

1. Crea una cuenta en [render.com](https://render.com)
2. Crea un nuevo "Web Service" desde tu repositorio Git
3. Configura el build command: `pnpm install && pnpm build`
4. Configura el start command: `pnpm start`
5. Crea una base de datos PostgreSQL o MySQL desde el dashboard
6. Configura las variables de entorno
7. Render desplegará automáticamente

**Costo**: Plan gratuito disponible. Planes pagos desde $7/mes.

#### Heroku

Heroku es una plataforma establecida con gran ecosistema.

**Pasos**:

1. Instala Heroku CLI
2. Inicia sesión: `heroku login`
3. Crea una app: `heroku create tu-app-phonefix`
4. Agrega MySQL: `heroku addons:create jawsdb:kitefin`
5. Configura variables de entorno: `heroku config:set NODE_ENV=production`
6. Despliega: `git push heroku main`

**Costo**: Planes desde $7/mes (Eco Dynos).

### Opción 3: Docker (Para Cualquier Plataforma)

Si prefieres usar contenedores, puedes crear un `Dockerfile` en la raíz del proyecto:

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Compilar la aplicación
RUN pnpm build

# Exponer el puerto
EXPOSE 3000

# Comando de inicio
CMD ["pnpm", "start"]
```

Y un `docker-compose.yml` para incluir MySQL:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://phonefix:phonefix123@db:3306/phonefix_db
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=phonefix_db
      - MYSQL_USER=phonefix
      - MYSQL_PASSWORD=phonefix123
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

volumes:
  mysql_data:
```

Ejecutar con:

```bash
docker-compose up -d
```

## 🔐 Consideraciones de Seguridad

### Variables de Entorno

Nunca subas el archivo `.env` a repositorios públicos. Usa variables de entorno del servidor o plataforma cloud. Genera contraseñas seguras para la base de datos. Cambia las credenciales por defecto (admin/1234) en producción.

### Base de Datos

Usa contraseñas fuertes para el usuario MySQL. Configura backups automáticos diarios. Restringe el acceso a la base de datos solo desde localhost o IPs específicas. Mantén MySQL actualizado con los últimos parches de seguridad.

### Servidor

Configura un firewall (ufw en Ubuntu) para permitir solo puertos necesarios. Mantén el sistema operativo actualizado. Usa SSH con claves en lugar de contraseñas. Configura fail2ban para prevenir ataques de fuerza bruta.

### Aplicación

Usa HTTPS en producción (SSL/TLS). Implementa rate limiting en las APIs. Valida y sanitiza todas las entradas de usuario. Mantén las dependencias actualizadas regularmente.

## 📊 Monitoreo y Mantenimiento

### Logs

Configura rotación de logs para evitar llenar el disco. Usa PM2 para ver logs en tiempo real con `pm2 logs phonefix`. Considera servicios como Papertrail o Logtail para logs centralizados.

### Backups

Configura backups automáticos de la base de datos diariamente. Guarda backups en ubicación externa (S3, Dropbox, etc.). Prueba la restauración de backups periódicamente.

### Actualizaciones

Revisa actualizaciones de dependencias mensualmente con `pnpm outdated`. Actualiza Node.js cuando haya versiones LTS nuevas. Mantén MySQL actualizado con las últimas versiones estables.

## 🚀 Optimizaciones de Rendimiento

### Base de Datos

Crea índices en columnas frecuentemente consultadas (fecha, tienda, tipo). Configura MySQL para el tamaño de tu servidor (innodb_buffer_pool_size). Implementa caché de consultas si es necesario.

### Aplicación

Habilita compresión gzip en Nginx. Configura caché de assets estáticos. Usa CDN para archivos estáticos si tienes usuarios globales. Implementa lazy loading en el frontend.

### Servidor

Aumenta recursos (RAM, CPU) según el tráfico. Considera escalado horizontal con múltiples instancias. Usa balanceador de carga para alta disponibilidad.

## 📞 Soporte Post-Despliegue

Después del despliegue, monitorea los logs durante las primeras 24 horas. Verifica que todos los módulos funcionen correctamente. Prueba el sistema con datos reales en un ambiente controlado. Capacita a los usuarios en el uso del sistema.

## ✅ Checklist de Despliegue

Antes de poner en producción, verifica:

- [ ] Base de datos creada y migraciones aplicadas
- [ ] Variables de entorno configuradas correctamente
- [ ] Credenciales de producción creadas (no usar admin/1234)
- [ ] SSL/HTTPS configurado
- [ ] Backups automáticos configurados
- [ ] Monitoreo de logs implementado
- [ ] Firewall configurado
- [ ] PM2 o similar configurado para auto-restart
- [ ] Nginx o reverse proxy configurado
- [ ] Dominio apuntando al servidor
- [ ] Pruebas de funcionalidad completadas
- [ ] Documentación entregada a usuarios

---

**¡Tu aplicación PhoneFix está lista para producción!**
