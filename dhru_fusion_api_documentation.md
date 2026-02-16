# Documentación API de UnlockerFast (Dhru Fusion Client API v2)

## Información de Autenticación
- **API Key**: `6T0-V56-CPP-IGB-K0Q-54F-9TL-1WB`
- **Username**: `UnlockVeneUsa`
- **URL Base**: `https://www.unlockerfast.com.mx/api/index.php`

## Endpoints Principales

### 1. Get Account Info
**Método**: POST  
**URL**: `https://www.unlockerfast.com.mx/api/index.php`  
**Parámetros**:
- `username`: UnlockVeneUsa
- `apiaccesskey`: 6T0-V56-CPP-IGB-K0Q-54F-9TL-1WB
- `action`: accountinfo

**Respuesta**:
```json
{
  "SUCCESS": [{
    "message": "Your Accout Info",
    "AccoutInfo": {
      "credit": "$61,195.601",
      "creditraw": "61195.601",
      "mail": "demo@demo.com",
      "currency": "USD"
    }
  }],
  "apiversion": "5.2"
}
```

### 2. Get All Services and Groups
**Método**: POST  
**URL**: `https://www.unlockerfast.com.mx/api/index.php`  
**Parámetros**:
- `username`: UnlockVeneUsa
- `apiaccesskey`: 6T0-V56-CPP-IGB-K0Q-54F-9TL-1WB
- `action`: getservicelist

**Descripción**: Retorna todos los servicios y grupos incluyendo IMEI, SERVER y REMOTE.

**Tipos de Grupos**:
- `GROUPTYPE = IMEI` - Servicios de desbloqueo IMEI
- `GROUPTYPE = SERVER` - Servicios de servidor (licencias, activaciones)
- `GROUPTYPE = REMOTE` - Servicios remotos

**Respuesta**: Lista completa de servicios con sus IDs, precios, tiempos y requisitos.

### 3. Place Single Order
**Método**: POST  
**URL**: `https://www.unlockerfast.com.mx/api/index.php`  
**Parámetros**:
- `username`: UnlockVeneUsa
- `apiaccesskey`: 6T0-V56-CPP-IGB-K0Q-54F-9TL-1WB
- `action`: placeorder
- `parameters`: XML con los detalles del pedido

**Formato de parameters para servicios SERVER**:
```xml
<PARAMETERS>
  <ID>SERVICE_ID</ID>
  <CUSTOMFIELD>BASE64_ENCODED_JSON</CUSTOMFIELD>
</PARAMETERS>
```

**Formato de parameters para servicios IMEI**:
```xml
<PARAMETERS>
  <IMEI>111111111111119</IMEI>
  <ID>SERVICE_ID</ID>
  <CUSTOMFIELD>BASE64_ENCODED_JSON</CUSTOMFIELD>
</PARAMETERS>
```

**Respuesta**:
```json
{
  "SUCCESS": [{
    "MESSAGE": "Order received",
    "REFERENCEID": "10101010"
  }],
  "apiversion": "5.2"
}
```

### 4. Get Order Status
**Método**: POST  
**URL**: `https://www.unlockerfast.com.mx/api/index.php`  
**Parámetros**:
- `username`: UnlockVeneUsa
- `apiaccesskey`: 6T0-V56-CPP-IGB-K0Q-54F-9TL-1WB
- `action`: getorderinfo
- `referenceid`: ID del pedido

### 5. Place Bulk Order
**Método**: POST  
**URL**: `https://www.unlockerfast.com.mx/api/index.php`  
**Parámetros**:
- `username`: UnlockVeneUsa
- `apiaccesskey`: 6T0-V56-CPP-IGB-K0Q-54F-9TL-1WB
- `action`: placebulkorder
- `parameters`: BASE64 encoded JSON array

**Formato de parameters**:
```javascript
base64_encode('[{"IMEI":"111111111111119","ID":123123},{"IMEI":"222222222222229","ID":123123}]')
```

## Campos Opcionales (según servicio)
- `QNT` - Cantidad
- `MODELID` - ID del modelo
- `PROVIDERID` - ID del proveedor
- `MEP` - MEP code
- `PIN` - PIN
- `KBH` - KBH
- `PRD` - PRD
- `TYPE` - Tipo
- `REFERENCE` - Referencia
- `LOCKS` - Locks
- `SN` - Serial Number
- `SecRO` - SecRO
- `CUSTOMFIELD` - Campos personalizados (JSON base64 encoded)

## Ejemplo de Implementación

### Obtener Lista de Servicios
```javascript
const response = await fetch('https://www.unlockerfast.com.mx/api/index.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    username: 'UnlockVeneUsa',
    apiaccesskey: '6T0-V56-CPP-IGB-K0Q-54F-9TL-1WB',
    action: 'getservicelist'
  })
});
const data = await response.json();
```

### Crear un Pedido
```javascript
const parameters = `<PARAMETERS><ID>SERVICE_ID</ID></PARAMETERS>`;
const response = await fetch('https://www.unlockerfast.com.mx/api/index.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    username: 'UnlockVeneUsa',
    apiaccesskey: '6T0-V56-CPP-IGB-K0Q-54F-9TL-1WB',
    action: 'placeorder',
    parameters: parameters
  })
});
const data = await response.json();
```

## Notas Importantes
1. Todos los requests son POST
2. La autenticación se hace mediante username + apiaccesskey
3. Los parámetros de pedidos se envían en formato XML
4. Los campos personalizados deben ser JSON codificado en base64
5. Cada servicio tiene requisitos específicos que se obtienen de getservicelist
