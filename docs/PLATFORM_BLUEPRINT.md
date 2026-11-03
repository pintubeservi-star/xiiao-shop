# XiiAO Shop — blueprint

## Producto
Marketplace social para República Dominicana con cuatro áreas: tienda pública, afiliados/creadores, comercios y administración.

## Reglas no negociables
- La atribución se guarda en servidor y queda asociada al pedido.
- Enlaces y códigos son únicos por afiliado/producto.
- Un clic o pedido pendiente nunca genera saldo disponible.
- Una comisión solo pasa a disponible tras confirmar entrega y pago.
- Cancelación, rechazo, devolución o contracargo revierten la comisión con movimiento compensatorio.
- El ledger es append-only; no se edita un saldo directamente.
- Bloquear auto-referidos, duplicados, abuso de códigos y eventos repetidos mediante idempotency keys.

## Áreas
1. Storefront: catálogo, búsqueda, contenido, carrito, checkout y seguimiento.
2. Afiliados: perfil, enlaces/códigos, clics, pedidos atribuidos, comisiones y retiros.
3. Comercios: productos, inventario, pedidos y reportes.
4. Admin: aprobación de comercios/afiliados, catálogo, pedidos, reglas, conciliación y auditoría.

## Stack
Next.js App Router + TypeScript + Tailwind; Supabase Auth/Postgres/Storage con RLS; Vercel para despliegue. Las claves de servicio solo existen en servidor.

## Estado de esta primera entrega
- Interfaz inicial responsive del storefront con filtros y búsqueda locales.
- Identidad visual y manifest PWA.
- Esquema inicial PostgreSQL con RLS, afiliados, atribución, pedidos, comisiones, retiros y ledger.
- El catálogo visible actualmente es de demostración. Aún no hay autenticación, checkout, inventario, pagos ni liquidaciones conectadas.

## Próximos hitos
1. Crear proyecto Supabase y aplicar migración.
2. Conectar Auth y perfiles con políticas RLS revisadas.
3. Implementar tracking de enlaces/códigos y persistencia de atribución.
4. Checkout y gestión de pedidos con stock transaccional.
5. Máquina de estados de entrega/pago y cálculo idempotente de comisiones.
6. Paneles de afiliado, comercio y administración.
7. Pruebas automatizadas y despliegue Vercel.
