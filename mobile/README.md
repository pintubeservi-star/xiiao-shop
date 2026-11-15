# Cotuí Go — aplicación móvil nativa

Esta aplicación se construye con Expo + React Native. No es una PWA ni una web dentro de un WebView.

## Preparación

1. `cd mobile`
2. `npm install`
3. `npx expo install --fix`
4. Copia `.env.example` a `.env` y configura las variables públicas de Supabase.
5. `npx expo start` para probar en Expo Go cuando los módulos lo permitan.

## APK Android

1. Instala EAS CLI: `npm install -g eas-cli`
2. Ejecuta `eas login` y `eas build:configure`.
3. Sustituye `REPLACE_WITH_EAS_PROJECT_ID` por el ID generado por EAS.
4. Ejecuta `eas build --platform android --profile preview`.

El perfil preview genera un APK instalable. Para compilación local se requiere Android Studio y SDK Android.

## Alcance de esta base

Incluye interfaz móvil nativa inicial, selección de servicio, mapa, permiso de ubicación y flujo visual de solicitud. La conexión real a Supabase, despacho de repartidores, GPS en segundo plano, push remotas y pagos requieren configurar el proyecto/backend y sus credenciales antes de producción.
