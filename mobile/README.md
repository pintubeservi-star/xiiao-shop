# Cotuí Go Native

Aplicación Android/iOS con Expo + React Native. Se conecta al backend existente de Cotuí Go; no crea tablas duplicadas.

## Backend existente
Utiliza las tablas y RPC del proyecto Cotuí Go: `cg_ride_requests`, `cg_delivery_requests`, `cg_driver_profiles`, `cg_driver_wallets`, `cg_wallet_topups`, `cg_wallet_ledger`, `cg_quote_fare`, `cg_driver_accept_ride`, `cg_driver_accept_delivery`, `cg_driver_start_ride`, `cg_driver_update_ride_status`, `cg_driver_update_delivery_status`, `cg_get_public_trip` y `cg_admin_review_wallet_topup`.

No ejecutes `mobile/supabase/schema.sql`: el esquema de producción ya está en las migraciones Supabase existentes del repositorio.

## Configuración
1. Copia `.env.example` a `.env`.
2. Configura URL y anon key del mismo proyecto Supabase usado por Cotuí Go web.
3. Configura `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` y habilita Maps SDK for Android en Google Cloud.
4. En `mobile`: `npm install`, `npx expo install --fix`, `npx expo start`.

## Compilar APK
`npm install -g eas-cli`, `eas login`, `eas build:configure`, `eas build --platform android --profile preview`.

## Cotuí Go Negocios · compartir desde WhatsApp

La app Android acepta contenido de texto y enlaces compartidos desde otras aplicaciones. En WhatsApp, el comercio puede usar **Compartir → Cotuí Go** para enviar la ubicación o el mensaje al formulario de nuevo paquete. La app reconoce coordenadas en enlaces comunes de Google Maps (`q=`, `ll=`, `@lat,lng`, `geo:` y `!3d...!4d...`), además de intentar extraer nombre y teléfono cuando aparecen etiquetados en el texto. Si WhatsApp comparte un enlace corto sin coordenadas, el negocio debe confirmar el punto manualmente en el mapa; nunca se inventa una ubicación.

Para recibir datos desde WhatsApp se requiere instalar una APK recompilada con el plugin nativo `expo-share-intent`; Expo Go no admite esta función.

## Incluido
Cliente: solicitud de moto/paquetes, selección de destino en mapa, cotización por el RPC real de tarifas, seguimiento por token y Realtime.
Repartidor: disponibilidad GPS en primer plano, ofertas, aceptación, estados y PIN de inicio de moto.
Administración: resumen, lista de servicios y revisión de recargas.
La aprobación documental de conductores y configuración avanzada de tarifas permanecen en el panel administrativo web existente.

## Antes de producción
Hay que configurar las credenciales de Supabase/Google Maps, habilitar Realtime en las tablas/canales correspondientes, verificar permisos y compilar APK. El GPS de esta versión se actualiza mientras la app está abierta; el seguimiento en segundo plano y las notificaciones push requieren el módulo nativo adicional. El APK aún no se ha compilado.
