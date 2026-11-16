# XiiAO Shop

Plataforma independiente de social commerce para República Dominicana: marketplace, creadores afiliados y comercios.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- PWA manifest and installable experience
- Supabase planned for authentication, PostgreSQL, storage and row-level security

## Estado

Primera base del proyecto. Los módulos financieros y de atribución se implementarán del lado del servidor; las comisiones solo serán liberadas después de confirmar entrega y pago.

## Desarrollo local

```bash
npm install
npm run dev
```

## Variables de entorno

Copia `.env.example` a `.env.local` y completa las credenciales de Supabase cuando el backend esté conectado. Nunca publiques claves privadas.


## ERP de comercios integrado

La rama `cotui-go-market-erp` incorpora el primer núcleo funcional del sistema de gestión multi-comercio:

- Portal de comercios: `/comercios` (también disponible en `/gestion`).
- Administración global de comercios: `/admin/market` (requiere rol `admin`).
- Catálogo, POS, pedidos, inventario, clientes, proveedores, compras, gastos, cuentas por cobrar/pagar, caja, sucursales y recibos internos.
- Las ventas POS y compras actualizan inventario mediante funciones transaccionales existentes o nuevas.
- Los pagos de los clientes se reciben directamente en el comercio; no se enrutan a una cuenta central de la plataforma.
- Cotuí Go Delivery queda como integración opcional para pedidos con entrega.

### Activación
1. El comercio crea una cuenta en `/comercios` y envía su solicitud.
2. Un administrador revisa y aprueba el comercio en `/admin/market`.
3. El propietario vuelve a entrar en `/comercios` para gestionar su negocio.

### Límites de esta fase
Los recibos actuales son internos, no e-CF. La emisión fiscal requiere PSFE autorizado y pruebas DGII. La conexión de pago de paquetes, impresión térmica Bluetooth, empleados/invitaciones, conciliación bancaria y analítica completa de la tienda siguen pendientes de implementación y validación.
