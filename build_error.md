# Error de Build en Railway

## Error Principal
```
[vite]: Rollup failed to resolve import "react-hot-toast" from "/app/client/src/pages/Servidor.tsx".
```

## Causa
El archivo `Servidor.tsx` importa `react-hot-toast` pero no está instalado en las dependencias del proyecto.

## Solución
Agregar `react-hot-toast` a las dependencias en `package.json` o usar el sistema de toast existente en el proyecto.
