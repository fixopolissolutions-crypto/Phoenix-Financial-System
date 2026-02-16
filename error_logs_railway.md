# Error Encontrado en Railway Logs

## Timestamp
Feb 16 2026 02:06:06

## Input Recibido
```json
{
  "codigo": "REP-001",
  "dispositivo": "",
  "problema": "Pantalla rota",
  "precioManoObra": "50.00",
  "precioTotal": "150",
  ...
}
```

## Error
```
Error al crear reparación: TypeError: bind parameters must not contain undefined. To pass SQL NULL specify JS null
```

## Stack Trace
```
at /app/node_modules/.pnpm/mysql2@3.16.3/node_modules/mysql2/lib/promise/connection.js:56:11
at new Promise (<anonymous>)
at PromiseConnection.execute (/app/node_modules/.pnpm/mysql2@3.16.3/node_modules/mysql2/lib/promise/connection.js:53:12)
at createRepair (file:///app/dist/index.js:1116:39)
at async resolveMiddleware (file:///app/node_modules/.pnpm/@trpc+server@11.10.0_typescript@5.9.3/node_modules/@trpc/server/dist/initTRPC-RoZMIBeA.mjs:221:17)
at async file:///app/dist/index.js:3169:24
at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
```

## Análisis
El error indica que **MySQL2 no acepta `undefined` como parámetro de bind**. Debe ser `null` en lugar de `undefined`.

El problema es que el frontend está enviando `dispositivo: ""` (cadena vacía), pero luego en el backend se está convirtiendo a `undefined`, y MySQL2 espera `null` para valores NULL en SQL.

## Solución
Modificar el backend para convertir `undefined` a `null` antes de insertar en la base de datos.
