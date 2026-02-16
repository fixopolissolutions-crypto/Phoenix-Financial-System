# Phoenix-Financial-System

**URL:** https://railway.com/project/3b43ba7a-5264-4fed-86a4-23cbb3190749/service/500b75be-a2ce-4fdb-a6e3-e7e185fed871?environmentId=ec2f140e-3b3c-4d36-bea7-c2fb5d8ac4b2

---

intelligent-education
production
Architecture
Observability
Logs
Settings
1
Phoenix-Financial-System
Deployments
Variables
Metrics
Settings
phoenix-financial-system-production.up.railway.app
us-west2
1 Replica
ACTIVE

Fix: Convert undefined to null for MySQL2 compatibility in createRepair - Use nullish coalescing operator (??) to convert undefined to null - MySQL2 requires null instead of undefined for SQL NULL values - This resolves the 'bind parameters must not contain undefined' error - Affected fields: cliente, telefono, dispositivo, diagnostico, notas

44 minutes ago via GitHub

View logs

Deployment successful

DEPLOYING

Fix: Change useUser to useAuth in Servidor.tsx

2 minutes ago via GitHub

View logs

Deployment in progress:

Taking a snapshot of the code...

Building the image...

Publishing image...

Waiting for dependencies to deploy...

Migrating volume...

Running pre-deploy command...

Creating containers...

Tidying up previous deployments...

HISTORY

FAILED

Fix: Change toast import from react-hot-toast to sonner in Servidor.tsx

5 minutes ago via GitHub

View logs

Deployment failed

Initialization

Not started

Build

Not started

Deploy

Not started

Post-deploy

Not started

FAILED

Feature: Add Servidor section for UnlockerFast API integration - Add server_services and server_orders database tables - Create UnlockerFast API integration module (server/unlockerfast.ts) - Add tRPC endpoints for server services and orders - Create Servidor frontend page with services catalog and order management - Add automatic database migration for server tables - Add Servidor link to navigation menu - Support for IMEI, SERVER, and REMOTE service types - Full order lifecycle: create, track status, sync with UnlockerFast API

8 minutes ago via GitHub

View logs
REMOVED

Fix: Make dispositivo field optional in backend and frontend - Change dispositivo validation from z.string() to z.string().optional() in backend - Update frontend to send undefined instead of empty string for dispositivo - This resolves the silent validation error preventing repair creation

50 minutes ago via GitHub

View logs
REMOVED

Fix: Remove required attribute from dispositivo field to allow repair creation

55 minutes ago via GitHub

View logs
REMOVED

Fix: Corregir cálculo de ganancia y agregar endpoint user.me - Agregar router user con endpoint me para compatibilidad - Corregir cálculo de ganancia en createRepair: precioTotal - precioManoObra - costoPartes - Corregir cálculo de ganancia en addRepairParts para incluir precioManoObra - Esto soluciona el error al crear reparaciones y el filtrado de configuración de tienda

2 hours ago via GitHub

View logs
REMOVED

Fix: Corregir cálculo de ganancia y agregar endpoint user.me - Agregar router user con endpoint me para compatibilidad - Corregir cálculo de ganancia en createRepair: precioTotal - precioManoObra - costoPartes - Corregir cálculo de ganancia en addRepairParts para incluir precioManoObra - Esto soluciona el error al crear reparaciones y el filtrado de configuración de tienda

6 days ago via GitHub

View logs
REMOVED

Feat: Agregar garantía descriptiva y detallada en inglés y español al recibo PDF

6 days ago via GitHub

View logs
REMOVED

Feat: Recibo PDF en blanco y negro con logo real de 1+PhoneFix

6 days ago via GitHub

View logs

Railway