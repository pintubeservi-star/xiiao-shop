# Cotuí Go · Apps nativas de paquetería

Este módulo compila dos aplicaciones Android independientes conectadas al proyecto Supabase real de Cotuí Go:

- **Cotuí Go Negocios**: recibe contenido compartido desde WhatsApp, prepara la dirección, calcula la tarifa, crea el envío y muestra el PIN de recogida y el seguimiento.
- **Cotuí Go Delivery**: recibe solicitudes en tiempo real, acepta paquetes, comparte GPS en primer plano y segundo plano mientras está disponible, navega a recogida/entrega, verifica el PIN de recogida y administra su billetera.

La administración opera desde el panel web `/admin/paquetes`, con despacho, mapa en vivo, asignación de repartidores, seguimiento y revisión de recargas.

## Backend real

Se usa el mismo proyecto Supabase que el sitio Cotuí Go. No se crea un backend de demostración ni tablas duplicadas. La app usa autenticación Supabase persistente, RLS y RPC seguras.

Flujos conectados:
- Cotización de paquetería mediante `cg_quote_fare` y reglas de tarifas activas.
- Creación de solicitudes en `cg_delivery_requests`.
- Actualizaciones de estado y tracking con Realtime y consulta de respaldo.
- Asignación administrativa mediante `cg_admin_assign_delivery`.
- Billetera de repartidor: recargas manuales, aprobación administrativa, reserva del 15% al aceptar y captura/liberación al finalizar o cancelar.
- PIN de 4 dígitos en la recogida, validado por `cg_driver_start_delivery`, con máximo de cinco intentos.

## Compartir desde WhatsApp

En WhatsApp, el comercio toca **Compartir → Cotuí Go Negocios**. La app interpreta texto y enlaces de ubicación de Google Maps. Si WhatsApp comparte un enlace corto sin coordenadas o manda el nombre/teléfono por separado, el comercio confirma el punto en el mapa y completa únicamente los datos que falten. La app no puede leer conversaciones privadas que no se compartan explícitamente.

## Mapas y navegación

El mapa dentro de la app usa MapLibre con OpenFreeMap/OpenStreetMap; no necesita Google Maps API key. El repartidor puede abrir Google Maps como navegación externa.

## Compilación Android

El workflow `.github/workflows/cotui-go-native-apk.yml` crea dos APK independientes:
- `cotui-go-negocios-apk`
- `cotui-go-delivery-apk`

Usa Expo prebuild y Gradle, e incluye el bundle JavaScript dentro del APK. La rama de trabajo es `cotui-go-packages`; no se modifica `main`.

## Permisos Android

La app de Delivery solicita ubicación precisa y en segundo plano. Android muestra una notificación persistente mientras el repartidor está disponible y comparte ubicación. Si el usuario deniega el permiso de segundo plano, el envío sigue disponible, pero el seguimiento GPS puede interrumpirse al dejar la app en segundo plano.
