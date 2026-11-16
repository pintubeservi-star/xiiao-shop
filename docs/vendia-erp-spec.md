# VENDIA — Especificación funcional ERP para comercios

VENDIA es una marca independiente. Cotuí Go Delivery será un canal de integración opcional, no parte del nombre comercial.

## Objetivo
ERP/POS ligero, mobile-first y multi-comercio. Cada comercio administra su operación y recibe directamente los pagos de sus clientes. VENDIA factura aparte el consumo de e-CF mediante bolsas prepagadas.

## Navegación
Resumen; Punto de venta; Pedidos (integración opcional Cotuí Go Delivery); Productos y servicios; Inventario; Compras y proveedores; Clientes; Facturación electrónica; Caja y bancos; Contabilidad y reportes; Empleados y permisos; Sucursales y almacenes; Impresoras y dispositivos; Configuración fiscal y del negocio.

## POS y caja
Búsqueda por nombre/SKU/código de barras; escaneo con cámara cuando compatible; variantes, carrito, clientes, listas de precio, descuentos con permisos, métodos de pago configurables, pagos divididos, cambio, recibo, ventas pendientes y reimpresión. Apertura/cierre de caja, fondo inicial, retiros, entradas, arqueo y diferencias. Crear pedido no equivale a cobro confirmado.

## Inventario y compras
Productos, servicios, SKU, códigos de barras, variantes, costos, precios, margen, existencia y ubicaciones. Kardex inmutable para compras, ventas, devoluciones, ajustes, mermas, transferencias y reversos. Reservas de stock para pedidos pendientes; alertas y conteos físicos. Proveedores, órdenes de compra, recepción parcial y cuentas por pagar. No permitir stock negativo salvo permiso auditado.

## Clientes y finanzas
Ficha de cliente con identificación/RNC cuando aplique, contacto, direcciones, balance e historial. Ingresos, egresos, cuentas, métodos de pago, conciliación manual, cuentas por cobrar/pagar, flujo de efectivo y estado de resultados gerencial. Separar ITBIS, descuentos, devoluciones, costo de ventas, gastos y utilidad. No presentar reportes gerenciales como declaraciones fiscales oficiales. Exportaciones CSV/PDF y acceso de solo lectura al contador.

## Facturación electrónica RD
Onboarding fiscal por comercio y sucursal; integración mediante adaptador a un PSFE certificado por DGII o autorización/certificación propia. No emitir e-CF legal ni anunciar certificación hasta completar habilitación y pruebas. Validación, secuencia e-NCF, XML, firma, envío, acuse, estado, representación impresa, notas de crédito/débito, consulta, descarga y reintentos idempotentes. Certificados y secretos nunca en el navegador. Consumir saldo solo bajo la condición de emisión confirmada definida por contrato; errores técnicos y rechazos no deben duplicar cargos.

## Bolsas de e-CF
Precios ilustrativos, moneda por confirmar antes de publicar:
| Bolsa | Unidades | Costo indicado | Precio propuesto |
| Emprendedor | 50 | 1.65 | 5.99 |
| Negocio | 200 | 6.60 | 17.99 |
| PYME | 500 | 16.50 | 39.99 |
| Full | 3,000 | 99.00 | 149.99 |
Costo unitario indicado: 0.033. Márgenes brutos antes de comisiones, impuestos, soporte y operación. No cobrar hasta confirmar moneda y proveedor.

## Impresión
Android: ESC/POS Bluetooth para modelos compatibles. PC: diálogo del sistema para USB/red; puente local firmado solo si se necesita impresión silenciosa. iOS: AirPrint/PDF/compartir; Bluetooth depende de compatibilidad. Ticket impreso no sustituye XML ni validación e-CF.

## Administración global
Comercios solicitados/aprobados/activos/suspendidos; visitas y páginas vistas; productos consultados; embudo visita→producto→carrito→checkout→pedido→entrega; GMV, ticket promedio, conversión, cancelaciones y devoluciones; paquetes e-CF, saldo, consumo, aceptación, errores y costo proveedor; delivery y tiempos. Ingresos propios de VENDIA separados de GMV y del dinero cobrado por los comercios. Auditoría y minimización de datos personales.

## Roles y seguridad
Propietario, administrador, gerente, cajero, vendedor, inventario, contador lectura/exportación, repartidor y admin global. Permisos granulares por acción, sucursal y caja. Todas las tablas multi-comercio incluyen merchant_id y RLS estrictas; no confiar en roles enviados por el cliente ni user_metadata. Operaciones financieras/fiscales en servidor o RPC transaccional idempotente.

## Modelo de datos sugerido
Extender merchants, products, orders y perfiles existentes, sin duplicarlos: merchant_locations, merchant_members, merchant_roles, product_variants, inventory_locations, inventory_movements, stock_reservations, suppliers, purchase_orders, cash_registers, cash_sessions, cash_movements, merchant_customers, expenses, payment_records, receivables, payables, invoice_credit_wallets, invoice_packages, invoice_wallet_transactions, fiscal_profiles, ecf_documents, ecf_events, ecf_provider_configs, print_profiles, storefront_events, analytics_daily_rollups y audit_logs.

## Fases
1. Base empresarial: portal, miembros/permisos, catálogo, costos, kardex y dashboard.
2. POS/caja, clientes, compras, gastos y reportes.
3. Bolsas prepago y ledger; panel global y analítica.
4. Adaptador PSFE, onboarding y emisión e-CF real.
5. Impresión Android, PC/AirPrint y pruebas físicas.
6. Multi-sucursal, conciliación y automatizaciones.

## Aceptación
Aislamiento total entre comercios; inventario y cobros idempotentes; dashboard separa ventas/cobros/costos/gastos/utilidad; paquetes descuentan solo emisión válida; métricas globales filtrables; impresión probada; build, RLS, caja, inventario, sandbox fiscal y pruebas físicas antes de considerar listo.
