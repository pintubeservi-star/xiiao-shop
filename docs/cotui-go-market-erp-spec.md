# Cotuí Go Market — Especificación funcional ERP para comercios

## Objetivo
Convertir el portal de comercios existente en un ERP/POS ligero, mobile-first y multi-comercio, integrado con el catálogo, pedidos y delivery de Cotuí Go. Cada comercio administra su operación y recibe directamente los pagos de sus clientes. Cotuí Go factura aparte el consumo de e-CF mediante bolsas prepagadas.

## Principios de producto
- Una sola experiencia para teléfono, tablet y PC; navegación simple, lenguaje cotidiano y acciones rápidas.
- El comercio solo ve su propio negocio, sucursales, empleados, inventario, clientes, ventas, documentos y métricas.
- No mezclar ventas del comercio con ingresos de Cotuí Go. Los pagos de ventas pertenecen directamente al comercio.
- Toda operación financiera y fiscal debe tener trazabilidad; no borrar movimientos confirmados, usar reversos/ajustes auditables.
- PWA instalable, interfaz responsive y funcionamiento degradado sin conexión para catálogo/caja; sincronización segura al recuperar internet.
- Los módulos avanzados aparecen según el tamaño y necesidades del comercio, sin abrumar al usuario nuevo.

## Navegación del comercio
1. Resumen
2. Punto de venta
3. Pedidos Cotuí Go
4. Productos y servicios
5. Inventario
6. Compras y proveedores
7. Clientes
8. Facturación electrónica
9. Caja y bancos
10. Contabilidad y reportes
11. Empleados y permisos
12. Sucursales y almacenes
13. Impresoras y dispositivos
14. Configuración del negocio / fiscal

## Resumen del negocio
Tarjetas: ventas de hoy, ventas del período, cobrado, por cobrar, costo de mercancía vendida, gastos, ganancia bruta estimada, caja actual, pedidos pendientes y productos con stock bajo. Gráficos comparables por día/semana/mes y filtros por sucursal, caja y vendedor. Mostrar claramente cuándo una cifra es estimada o depende de costos aún no registrados.

## POS
- Búsqueda por nombre, SKU o código de barras; escaneo con cámara cuando el dispositivo lo permita.
- Cuadrícula de productos, categorías, variantes, favoritos y carrito editable.
- Cliente opcional/identificado; precios por lista; descuentos con permiso.
- Métodos de cobro configurables por el comercio: efectivo, transferencia, tarjeta y otros.
- Pago dividido, cambio, recibo, guardar venta pendiente y reimprimir.
- Confirmación de pago independiente del pedido de delivery. No marcar cobrado solo por crear el pedido.
- Apertura/cierre de caja, fondo inicial, retiros, entradas, arqueo y diferencias.

## Inventario y compras
- Productos/servicios, SKU, código de barras, variantes, unidades, categorías, fotos, costo, precio, margen y existencia.
- Kardex inmutable: compra, venta, devolución, ajuste, merma, transferencia y reverso.
- Costeo promedio ponderado como opción inicial; permitir costo específico y lotes/caducidad en una fase posterior.
- Stock reservado por pedidos pendientes y stock disponible separado del físico.
- Mínimos, alertas, inventario valorizado, productos sin movimiento y conteos físicos.
- Proveedores, órdenes de compra, recepción parcial, cuentas por pagar y gastos asociados.
- No permitir stock negativo salvo permiso explícito y registro de auditoría.

## Clientes y proveedores
Ficha con datos de contacto, identificación/RNC cuando aplique, direcciones, balance, historial de ventas, facturas y notas internas. Consentimiento para comunicaciones comerciales. Cuentas por cobrar con vencimientos y registro de abonos.

## Contabilidad y finanzas
- Ingresos, egresos, categorías, cuentas, métodos de pago y conciliación manual.
- Cuentas por cobrar/pagar, vencimientos y recordatorios.
- Libro de movimientos, resumen de caja, flujo de efectivo y estado de resultados gerencial.
- Separar ITBIS, descuentos, devoluciones, costo de ventas, gastos y utilidad.
- No presentar un reporte gerencial como declaración tributaria oficial.
- Exportaciones CSV/PDF y acceso de solo lectura para el contador.
- Fase posterior: libro diario, catálogo de cuentas configurable, asientos automáticos revisables y reportes fiscales DGII según alcance aprobado por contador.

## Facturación electrónica RD
- Datos fiscales por comercio y sucursal; RNC, razón social, domicilio fiscal, actividad y configuración tributaria.
- Flujo de onboarding: checklist de elegibilidad, autorización del comercio, certificado digital/credenciales según el proveedor y pruebas.
- Integración mediante adaptador a un Proveedor de Servicios de Facturación Electrónica (PSFE) certificado por DGII, o vía autorización/certificación propia si Cotuí Go decide convertirse en emisor/proveedor conforme a los requisitos.
- No emitir un e-CF legal ni anunciar certificación mientras no exista autorización real y pruebas aprobadas.
- Tipos de e-CF habilitados según autorización del comercio; validación de datos, secuencia e-NCF, XML, firma, envío, acuse, trackId/estado, representación impresa y reintentos idempotentes.
- Estados: borrador, en cola, enviado, aceptado, rechazado, contingencia, anulado/ajustado conforme a normativa.
- Notas de crédito/débito, consulta, descarga XML/PDF y envío al receptor.
- Registro de cada intento y respuesta del proveedor; claves y certificados nunca accesibles desde el navegador.
- Contabilizar el consumo de una factura solo cuando el proveedor confirme la emisión/aceptación definida en el contrato. Rechazos y errores técnicos no consumen saldo; aplicar política de reintentos sin doble cargo.

## Bolsas de e-CF
Moneda de precios por confirmar con el dueño; conservar literalmente la unidad monetaria acordada antes de publicar:
| Bolsa | Unidades | Costo plataforma indicado | Precio comercio | Margen bruto |
| Emprendedor | 50 | 1.65 | 9.99 | 8.34 |
| Negocio | 200 | 6.60 | 24.99 | 18.39 |
| PYME | 500 | 16.50 | 49.99 | 33.49 |
| Full | 3,000 | 99.00 | 199.00 | 100.00 |

Costo y margen anteriores son datos de negocio suministrados, no una cotización validada del proveedor. Mostrar saldo restante, historial de cargos, paquetes adquiridos, alertas de saldo bajo y recarga opcional. Los paquetes no caducan inicialmente salvo que se defina una política clara y visible. La compra de bolsas no reemplaza obligaciones tributarias ni incluye automáticamente un plan contable.

## Impresión y dispositivos
- Perfil de impresión por comercio, sucursal y caja; pruebas de impresión y selección de formato 58/80 mm/A4.
- Android: módulo de impresión ESC/POS para impresoras Bluetooth compatibles; emparejamiento, reconexión, selección y prueba.
- PC: impresión del navegador/diálogo del sistema para impresoras instaladas USB/red; investigar puente local firmado solo si se necesita impresión silenciosa o ESC/POS avanzado.
- iOS/iPadOS: AirPrint y PDF/compartir; Bluetooth directo solo con accesorios/protocolos compatibles, no prometer compatibilidad universal.
- Plantillas separadas para ticket, representación impresa e-CF, cotización, orden y cierre de caja.
- La impresión en papel es una representación; no sustituye el XML ni la validación del e-CF.

## Estadísticas de plataforma para administración Cotuí Go
Panel global con filtros de fecha, comercio, categoría y canal:
- Comercios: solicitudes, aprobados, activos, suspendidos, nuevos y retención.
- Tráfico: sesiones, visitantes únicos aproximados, páginas vistas, fichas de producto, búsquedas y fuentes/campañas.
- Embudo: visita → producto → carrito → checkout → pedido → entrega.
- Ventas: pedidos, GMV, ticket promedio, conversión, cancelación, devoluciones y comercios principales.
- Facturación: paquetes vendidos, unidades emitidas, saldo por comercio, errores, aceptación y costo del proveedor.
- Delivery: pedidos solicitados, asignados, recogidos y entregados; tiempos y zonas.
- Ingresos propios de Cotuí Go separados de GMV y del dinero cobrado directamente por cada comercio.
- Exportación y auditoría. Métricas de visitas agregadas, minimización de datos personales, retención limitada y aviso de privacidad.

## Roles y permisos
Propietario, administrador del comercio, gerente, cajero, vendedor, encargado de inventario, contador (lectura/exportación), repartidor y administrador global Cotuí Go. Permisos granulares por acción, sucursal y caja. MFA recomendado para administradores. Toda acción sensible genera auditoría con usuario, fecha, entidad y motivo.

## Modelo de datos sugerido
Extender el esquema existente sin reemplazar merchants, products, orders ni perfiles:
- merchant_locations, merchant_members, merchant_roles
- product_variants, inventory_locations, inventory_movements, stock_reservations
- suppliers, purchase_orders, purchase_order_items
- cash_registers, cash_sessions, cash_movements
- merchant_customers, expenses, payment_records, receivables, payables
- invoice_credit_wallets, invoice_packages, invoice_wallet_transactions
- fiscal_profiles, ecf_documents, ecf_events, ecf_provider_configs
- print_profiles, print_jobs (solo metadatos; no almacenar credenciales Bluetooth)
- storefront_events, analytics_daily_rollups, audit_logs

Todas las tablas multi-comercio deben incluir merchant_id y políticas RLS estrictas que verifiquen membresía/rol del usuario. El administrador global accede mediante funciones/servicios confiables auditados. No confiar en role enviado por el cliente ni en user_metadata. Las escrituras financieras y fiscales críticas deben ejecutarse en servidor o RPC transaccional con idempotencia.

## Fases de entrega
1. Base empresarial: panel comercio, miembros/permisos, catálogo, costo/precio, kardex y dashboard.
2. POS/caja, clientes, compras, gastos y reportes financieros.
3. Bolsas prepago y ledger de consumo; administración de paquetes y estadísticas de visitas/ventas.
4. Adaptador PSFE, pruebas de certificación/onboarding fiscal y emisión e-CF real.
5. Impresión Android Bluetooth, impresión PC/AirPrint y pruebas por modelos de impresora.
6. Analítica avanzada, multi-sucursal, conciliación y automatizaciones.

## Criterios de aceptación
- Un comercio A no puede leer ni modificar ningún dato del comercio B, incluso manipulando requests.
- Una venta confirmada descuenta stock exactamente una vez y genera movimientos auditables.
- Reintentar una solicitud de venta o e-CF no duplica cobros, facturas ni movimientos.
- Dashboard separa ventas, cobros, costos, gastos y utilidad.
- Paquete descuenta solo emisión fiscal válida según contrato del proveedor.
- Admin global ve métricas agregadas y puede filtrar por comercio/fecha.
- El sistema permite imprimir ticket en dispositivos oficialmente probados y ofrece fallback PDF/diálogo del sistema.
- El despliegue no se considera completo hasta probar build, RLS, flujos de caja, inventario, facturación sandbox y pruebas físicas de impresora.
