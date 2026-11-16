# Cotuí Go Market

## Objetivo
Marketplace multi-comercio conectado al proyecto Cotuí Go existente. La aplicación reutiliza Next.js 14, Supabase Auth y el sistema de entregas de Cotuí Go.

## Rutas
- `/mercado`: escaparate público, categorías, comercios, catálogo y checkout.
- `/comercios`: portal privado del comerciante; solicitud de alta, catálogo, inventario, pedidos, POS y recibos internos.
- `/admin/comercios`: aprobación, suspensión y asignación de planes/comisiones.
- `/admin/movilidad`: acceso directo a la administración de comercios.
- `/`: acceso a Market desde la pantalla principal de Cotuí Go.

## Reglas de dinero
- El cliente paga los productos directamente al comercio (efectivo o transferencia).
- Cotuí Go no custodia ni liquida el dinero de la mercancía.
- La tarifa de delivery se calcula aparte con el motor de precios existente de Cotuí Go.
- La solicitud de repartidor se crea cuando el comercio marca el pedido como listo y pulsa “Solicitar repartidor”.
- El driver recibe el trabajo en la cola existente de `cg_delivery_requests`; el campo `service_kind` utiliza el valor existente `package`; `package_type` distingue comida de compras de tienda.
- El pedido de Market se sincroniza con los estados del delivery mediante trigger. El repartidor pasa por `accepted` → `courier_arriving` → `picked_up` → `on_the_way` → `delivered`.
- El PIN de recogida se genera automáticamente en el trigger existente de Cotuí Go; el comercio lo consulta con `cg_market_get_pickup_pin` y el repartidor lo valida con `cg_driver_start_delivery`. No se solicita PIN al finalizar la entrega.
- Comisión marketplace de referencia: Inicial 5%, Negocio 3%, Premium 2%. Se registra como cuenta por cobrar al comercio; no se descuenta del pago recibido directamente por el comercio.

## Tablas nuevas
Todas las tablas nuevas llevan el prefijo `cg_market_` para no interferir con el catálogo anterior de XiiAO Shop:
- `cg_market_categories`
- `cg_market_merchants`
- `cg_market_products`
- `cg_market_orders`
- `cg_market_order_items`
- `cg_market_inventory_movements`
- `cg_market_invoices`

La migración es `supabase/migrations/20261116190000_cotui_go_marketplace.sql`.

## Operaciones
- `cg_market_create_order`: crea pedido o venta POS, valida inventario, guarda líneas, registra movimientos, calcula la tarifa de delivery y genera recibo interno.
- `cg_market_update_order`: actualiza estado del pedido y confirma pagos recibidos directamente por el comercio.
- `cg_market_dispatch_order`: crea una solicitud de entrega en el sistema Cotuí Go Delivery.
- `cg_market_get_pickup_pin`: entrega el PIN de recogida únicamente al propietario autenticado del comercio.
- `cg_market_adjust_stock`: registra ajustes de inventario.
- `cg_market_admin_set_merchant_status`: aprobación y asignación de plan, solo administrador.
- `cg_market_sync_delivery_status`: sincroniza estados del repartidor con el pedido del marketplace.

Las funciones que usan `SECURITY DEFINER` validan el usuario autenticado, la propiedad del comercio o el rol de administrador y tienen permisos de ejecución limitados. No deben quitarse esas comprobaciones.

## Facturación
La primera etapa genera recibos internos con numeración y snapshots del comercio, cliente y totales. El recibo indica expresamente que no sustituye un comprobante fiscal electrónico e-CF. La emisión fiscal e-CF requiere la configuración fiscal del comercio, certificado, autorización y una integración certificada con DGII/proveedor; no se simula ni se declara habilitada.

## Prueba manual
1. Iniciar sesión con un usuario normal.
2. Abrir `/comercios`, registrar un negocio y enviar la solicitud.
3. Abrir `/admin/comercios` con una cuenta administradora y aprobarlo.
4. Volver al portal del comercio, crear productos y subir imágenes.
5. En `/mercado`, seleccionar ese comercio y hacer un pedido de prueba con una cuenta cliente.
6. En el portal del comercio, aceptar el pedido, prepararlo, marcarlo listo y solicitar repartidor.
7. Confirmar que el trabajo aparece en Cotuí Go Delivery y que los estados se reflejan en el pedido.
8. Probar una venta con varios productos desde el POS y verificar el recibo e inventario.

## Limitaciones conocidas de esta primera entrega
- No se integra una pasarela de pago para cobrar la mercancía; el comercio cobra directamente por efectivo o transferencia.
- La tarifa de delivery se calcula con la configuración actual de Cotuí Go; la liquidación del delivery sigue su flujo existente.
- No se emiten e-CF todavía.
- No se habilita carrito multi-comercio: cada pedido pertenece a un único comercio para mantener separadas las facturas, preparación y recogida.
- Las coordenadas de entrega se obtienen por geocodificación de la dirección escrita; deben confirmarse en el piloto.
