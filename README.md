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
