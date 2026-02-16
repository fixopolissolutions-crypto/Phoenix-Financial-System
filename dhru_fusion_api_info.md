# Información de la API de Dhru Fusion para UnlockerFast

## Resumen
UnlockerFast utiliza **Dhru Fusion** como plataforma backend. Dhru Fusion proporciona una API robusta para:
- Realizar pedidos de IMEI/Servicios
- Obtener listas de productos/servicios
- Verificar estados de pedidos
- Consultar saldo de cuenta
- Gestionar datos de clientes y fondos

## Credenciales
- **API Key**: `6T0-V56-CPP-IGB-K0Q-54F-9TL-1WB`
- **Servidor**: UnlockerFast (https://www.unlockerfast.com.mx)

## Funcionalidades de la API

### Como Cliente (Conectarse a servidor DHRU)
Puedes:
- Hacer pedidos de IMEI/Servicios
- Obtener lista de productos/servicios
- Verificar estados de pedidos
- Consultar saldo de cuenta
- Gestionar datos de clientes y fondos

### Endpoints Principales (Estándar Dhru Fusion)
Basado en la documentación estándar de Dhru Fusion, los endpoints típicos son:

1. **Obtener lista de servicios**
2. **Crear pedido (order)**
3. **Verificar estado de pedido**
4. **Consultar saldo**
5. **Obtener información de cuenta**

## Recursos Disponibles
- **Documentación oficial**: En el panel de administración de DHRU
- **Colección Postman**: https://www.postman.com/dhrucloud/dhru-fusion/documentation/88tzw38/dhru-fusion-client-api-v2
- **Ejemplo PHP**: api.zip (disponible en help.dhru.com)
- **Estándares API**: https://github.com/dhru/dhru-fusion-api-standards

## Próximos Pasos para Implementación

### 1. Contactar a UnlockerFast
Necesitamos obtener de UnlockerFast:
- URL base de su API (probablemente https://www.unlockerfast.com.mx/api o similar)
- Documentación específica de endpoints
- Formato de request/response
- Ejemplos de uso con la API key proporcionada

### 2. Implementar en Phoenix Financial System
Una vez tengamos la información completa, crearemos:
- Nueva sección "Servidor" en el menú lateral
- Interfaz para consultar servicios disponibles
- Formulario para crear pedidos
- Vista de historial de pedidos
- Consulta de saldo y estado de pedidos

### 3. Restricciones de Acceso
- **Admin**: Acceso completo a todas las funcionalidades
- **Sucursal**: Mensaje "En construcción" o acceso limitado

## Servicios que Ofrece UnlockerFast
Según su página web:
- 🔓 IMEI MOTOROLA
- FRP SAMSUNG
- CPID SAMSUNG
- UNLOCK ATT, TELCEL, MOVISTAR
- G14, G13, E13
- BYPASS HONOR
- TODAS LAS CARRIERS USA
- 🎮 LICENCIAS
- ACTIVACIONES
- CUENTAS STREAMING
- JUEGOS
- OFFICE
- MICROSOFT
- RENTAS SERVER (3, 6 y 12 meses)
