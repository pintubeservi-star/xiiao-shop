# Cotuí Go — aplicación nativa Android/iOS

Aplicación React Native con Expo (no PWA ni WebView). Incluye experiencia de cliente, repartidor y panel administrativo por roles, mapa, selección de destino, cálculo de tarifa por distancia, solicitudes, asignación, PIN de inicio, estados y lectura en tiempo real cuando Supabase está configurado.

## Configurar backend
1. Crea un proyecto Supabase.
2. Ejecuta todo el archivo `supabase/schema.sql` en SQL Editor.
3. Copia `.env.example` a `.env` y coloca URL y anon key.
4. Crea usuarios en Supabase Auth y sus perfiles en `public.profiles`. Para repartidores y administradores, asigna los roles desde el panel seguro de Supabase; nunca desde la app del usuario.
5. Ejecuta `npm install`, `npx expo install --fix` y `npx expo start`.

## Tarifas iniciales editables
`src/lib/pricing.ts` define RD$100 de base + RD$25 por km (mínimo RD$100). La función SQL aplica la misma regla. Confirma y ajusta estos valores antes de operar comercialmente. Comisión: 15%.

## APK Android
Instala EAS CLI, ejecuta `eas login`, luego `eas build:configure` y finalmente `eas build --platform android --profile preview`. El perfil preview produce APK instalable. Para compilar hace falta vincular el proyecto EAS y tener credenciales.

## Alcance y pendientes antes de producción
La interfaz nativa y el flujo principal están implementados. El esquema SQL proporciona creación segura de solicitudes, asignación exclusiva, PIN de inicio y panel de métricas. Aún hay que configurar el proyecto Supabase real, permisos/roles, credenciales de mapas, notificaciones push, pasarela de recargas, tracking GPS persistente en segundo plano, y el proceso de cobro/liquidación. No se ha generado un APK en este commit.