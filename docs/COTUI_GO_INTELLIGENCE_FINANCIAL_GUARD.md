# Cotuí Go — inteligencia operativa y protección financiera

## Alcance de esta entrega
Esta rama agrega un panel administrativo de lectura en `/admin/inteligencia`. Lee solicitudes de moto, paquetes y perfiles de motoristas ya existentes en Supabase. No cambia tarifas, comisiones, billeteras, estados ni permisos.

## Reglas financieras obligatorias
1. Comisión estándar inicial: 15%, respetando la configuración vigente.
2. No aplicar descuentos de comisión ni bonos automáticos en esta fase.
3. No declarar utilidad neta usando únicamente la comisión: primero deben registrarse costos variables y fijos.
4. Antes de aceptar incentivos, validar que exista presupuesto financiado y margen mínimo positivo después de costos.
5. La IA puede detectar anomalías y recomendar medidas; no puede retirar fondos, cambiar tarifas, alterar comisiones ni suspender definitivamente a una persona sin autorización administrativa.
6. Toda sanción debe contemplar revisión humana, evidencia y apelación.
7. Las cancelaciones justificadas, fallos de GPS y problemas de conectividad no deben penalizarse automáticamente.

## Ranking preliminar
La vista calcula un indicador de referencia con los registros disponibles: tasa de finalización (65%), volumen de servicios completados (20%, con tope de 30) y tasa de cancelación (15%). Solo muestra puntuación a perfiles con al menos cinco servicios asignados. Este indicador no incorpora todavía calificaciones, puntualidad, reportes de seguridad ni causas justificadas porque no se han integrado todos esos eventos. No concede beneficios económicos.

## Métricas
- Solicitudes de moto y paquetes.
- Servicios completados.
- Comisiones registradas en servicios completados.
- Tarifas brutas de servicios completados.
- Cancelaciones.
- Ranking preliminar por motorista.

## Pendiente antes de automatizar
- Definir y registrar costos variables por viaje y costos fijos de operación.
- Configurar el margen mínimo por servicio y el presupuesto de incentivos.
- Implementar eventos de visitas/sesiones con privacidad.
- Añadir reportes, calificaciones, puntualidad y causas de cancelación.
- Implementar alertas, bitácora de decisiones y flujo de apelación.
- Probar con datos reales y validar permisos/RLS en Supabase.
- Integrar un proveedor de IA y mensajería solo después de configurar claves y controles.

## Despliegue
Esta rama es una vista previa aislada. No debe fusionarse a producción hasta validar el build, permisos de administrador y consultas de Supabase.
