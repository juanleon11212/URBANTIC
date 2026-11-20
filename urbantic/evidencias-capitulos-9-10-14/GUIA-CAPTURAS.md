# Guía ampliada de capturas — capítulos 9, 10 y 14

Esta carpeta usa nombres **CAP-01 a CAP-42** para el cuerpo del informe. Las evidencias **TC-01 a TC-17** originales se mantienen en la carpeta del Anexo A; no fueron borradas ni renombradas para no romper su índice.

## Cómo usar las imágenes

1. En el capítulo correspondiente, inserta la imagen cuyo nombre comienza con el código solicitado.
2. Debajo de la imagen utiliza el texto de la columna “Qué demuestra” como pie de figura.
3. Las imágenes de terminal/API fueron generadas con resultados reales del entorno local y no muestran tokens ni contraseñas.
4. Para las seis evidencias externas pendientes, sigue las instrucciones de la última sección después de desplegar.

## Índice completo

| Código | Estado | Qué demuestra | Archivo(s) | Orientación |
|---|---|---|---|---|
| CAP-01 | LISTA | Docker Compose iniciado sin errores. | [CAP-01-docker-compose-iniciado.png](CAP-01-docker-compose-iniciado.png) | Docker Compose iniciado sin errores. |
| CAP-02 | LISTA | Los tres contenedores aparecen activos y saludables. | [CAP-02-contenedores-activos.png](CAP-02-contenedores-activos.png) | Los tres contenedores aparecen activos y saludables. |
| CAP-03 | LISTA | Frontend local accesible. | [CAP-03-frontend-local-localhost-8081.png](CAP-03-frontend-local-localhost-8081.png) | Frontend local accesible. |
| CAP-04 | LISTA | Healthcheck del backend correcto. | [CAP-04-healthcheck-backend.png](CAP-04-healthcheck-backend.png) | Healthcheck del backend correcto. |
| CAP-05 | LISTA | Formulario de inicio de sesión. | [CAP-05-pantalla-inicio-sesion.png](CAP-05-pantalla-inicio-sesion.png) | Formulario de inicio de sesión. |
| CAP-06 | LISTA | Panel principal del ciudadano. | [CAP-06-interfaz-ciudadano.png](CAP-06-interfaz-ciudadano.png) | Panel principal del ciudadano. |
| CAP-07 | LISTA | Formulario de creación con foto y ubicación. | [CAP-07-creacion-reporte-formulario.png](CAP-07-creacion-reporte-formulario.png) | Formulario de creación con foto y ubicación. |
| CAP-08 | LISTA | Mapa Leaflet con ubicación seleccionada. | [CAP-08-mapa-ubicacion-seleccionada.png](CAP-08-mapa-ubicacion-seleccionada.png) | Mapa Leaflet con ubicación seleccionada. |
| CAP-09 | LISTA | Reporte registrado y visible. | [CAP-09-reporte-ciudadano-registrado.png](CAP-09-reporte-ciudadano-registrado.png) | Reporte registrado y visible. |
| CAP-10 | LISTA | Panel principal del administrador. | [CAP-10-panel-administrador.png](CAP-10-panel-administrador.png) | Panel principal del administrador. |
| CAP-11 | LISTA | Categoría y prioridad guardadas. | [CAP-11-clasificacion-administrativa.png](CAP-11-clasificacion-administrativa.png) | Categoría y prioridad guardadas. |
| CAP-12 | LISTA | Técnico y carga activa mostrados. | [CAP-12-asignacion-tecnico.png](CAP-12-asignacion-tecnico.png) | Técnico y carga activa mostrados. |
| CAP-13 | LISTA | Bandeja de tareas del técnico. | [CAP-13-panel-tecnico-bandeja.png](CAP-13-panel-tecnico-bandeja.png) | Bandeja de tareas del técnico. |
| CAP-14 | LISTA | Reporte en estado EN_PROCESO. | [CAP-14-atencion-reporte-en-proceso.png](CAP-14-atencion-reporte-en-proceso.png) | Reporte en estado EN_PROCESO. |
| CAP-15 | LISTA | Formulario de resolución con observación y foto. | [CAP-15-resolucion-descripcion-fotografia.png](CAP-15-resolucion-descripcion-fotografia.png) | Formulario de resolución con observación y foto. |
| CAP-16 | LISTA | Reporte en estado RESUELTO. | [CAP-16-reporte-resuelto.png](CAP-16-reporte-resuelto.png) | Reporte en estado RESUELTO. |
| CAP-17 | LISTA | Estadísticas por estado y categoría. | [CAP-17-estadisticas-administrativas.png](CAP-17-estadisticas-administrativas.png) | Estadísticas por estado y categoría. |
| CAP-18 | LISTA | Mapa con incidencias georreferenciadas. | [CAP-18-mapa-incidencias.png](CAP-18-mapa-incidencias.png) | Mapa con incidencias georreferenciadas. |
| CAP-19 | PENDIENTE EXTERNO | Despliegue del frontend en Vercel. | — | Requiere un despliegue real y acceso al panel de Vercel. |
| CAP-20 | PENDIENTE EXTERNO | Servicio backend activo en Render. | — | Requiere un servicio desplegado y acceso a Render. |
| CAP-21 | PENDIENTE EXTERNO | Base PostgreSQL activa en Neon. | — | La base actual es PostgreSQL local; no hay un proyecto Neon conectado. |
| CAP-22 | PENDIENTE EXTERNO | Aplicación pública desde su URL final. | — | No existe una URL pública configurada en este repositorio. |
| CAP-23 | LISTA | Comunicación real entre navegador y API. | [CAP-23-comunicacion-frontend-backend.png](CAP-23-comunicacion-frontend-backend.png) | Comunicación real entre navegador y API. |
| CAP-24 | LISTA | Backend iniciado después de preparar migraciones y PostgreSQL. | [CAP-24-backend-conectado-postgresql.png](CAP-24-backend-conectado-postgresql.png) | Backend iniciado después de preparar migraciones y PostgreSQL. |
| CAP-25 | LISTA | Registro #0015 consultado directamente en PostgreSQL. | [CAP-25-registro-postgresql-reporte.png](CAP-25-registro-postgresql-reporte.png) | Registro #0015 consultado directamente en PostgreSQL. |
| CAP-26 | PENDIENTE EXTERNO | CORS/HTTPS en producción. | — | Requiere la aplicación pública comunicándose por HTTPS con Render. |
| CAP-27 | LISTA | CPU y memoria de los contenedores. | [CAP-27-uso-recursos-docker.png](CAP-27-uso-recursos-docker.png) | CPU y memoria de los contenedores. |
| CAP-28 | LISTA | Tiempo real de respuesta de la API. | [CAP-28-tiempo-respuesta-api.png](CAP-28-tiempo-respuesta-api.png) | Tiempo real de respuesta de la API. |
| CAP-29 | LISTA | Reinicio y recuperación de servicios. | [CAP-29-reinicio-servicios-recuperacion.png](CAP-29-reinicio-servicios-recuperacion.png) | Reinicio y recuperación de servicios. |
| CAP-30 | LISTA | Comparación de una petición con JWT y otra sin JWT. | [CAP-30-seguridad-jwt-contra-sin-token.png](CAP-30-seguridad-jwt-contra-sin-token.png) | Comparación de una petición con JWT y otra sin JWT. |
| CAP-31 | LISTA | Ciudadano rechazado al usar una ruta administrativa. | [CAP-31-validacion-rol-ciudadano-denegado.png](CAP-31-validacion-rol-ciudadano-denegado.png) | Ciudadano rechazado al usar una ruta administrativa. |
| CAP-32 | LISTA | Persistencia del volumen tras down/up sin -v. | [CAP-32-persistencia-volumen-down-up.png](CAP-32-persistencia-volumen-down-up.png) | Persistencia del volumen tras down/up sin -v. |
| CAP-33 | LISTA | Estructura principal del repositorio. | [CAP-33-estructura-repositorio.png](CAP-33-estructura-repositorio.png) | Estructura principal del repositorio. |
| CAP-34 | LISTA | Servicios y puertos de docker-compose.yml. | [CAP-34-docker-compose-servicios-puertos.png](CAP-34-docker-compose-servicios-puertos.png) | Servicios y puertos de docker-compose.yml. |
| CAP-35 | LISTA | Variables de entorno completamente ocultas. | [CAP-35-variables-entorno-ocultas.png](CAP-35-variables-entorno-ocultas.png) | Variables de entorno completamente ocultas. |
| CAP-36 | LISTA | Construcción de imágenes Docker. | [CAP-36-construccion-contenedores.png](CAP-36-construccion-contenedores.png) | Construcción de imágenes Docker. |
| CAP-37 | LISTA | Ejecución con docker compose up -d. | [CAP-37-ejecucion-docker-compose-up.png](CAP-37-ejecucion-docker-compose-up.png) | Ejecución con docker compose up -d. |
| CAP-38 | LISTA | Verificación con docker compose ps. | [CAP-38-verificacion-docker-compose-ps.png](CAP-38-verificacion-docker-compose-ps.png) | Verificación con docker compose ps. |
| CAP-39 | LISTA | Healthcheck del backend. | [CAP-39-verificacion-healthcheck.png](CAP-39-verificacion-healthcheck.png) | Healthcheck del backend. |
| CAP-40 | LISTA | Acceso al frontend local. | [CAP-40-acceso-frontend-local.png](CAP-40-acceso-frontend-local.png) | Acceso al frontend local. |
| CAP-41 | LISTA | Puerto PostgreSQL 5433 accesible. | [CAP-41-postgresql-puerto-5433.png](CAP-41-postgresql-puerto-5433.png) | Puerto PostgreSQL 5433 accesible. |
| CAP-42 | PENDIENTE EXTERNO | Resumen del despliegue Vercel + Render + Neon. | — | Depende de completar Vercel, Render y Neon. |

## Capturas que no se pudieron obtener localmente

### CAP-19 — Vercel

Abre **Vercel → proyecto → Deployments** y captura el despliegue marcado como **Ready**, incluyendo el dominio público. No abras Environment Variables y oculta nombres de cuenta si lo deseas.

### CAP-20 — Render

Abre el servicio **urbantic-api** en Render y captura el estado **Live** junto con la URL. No muestres la pestaña Environment ni valores de variables.

### CAP-21 — Neon

Captura el panel del proyecto Neon mostrando el nombre de la base, región y estado activo. Oculta completamente usuario, contraseña, connection string y cualquier botón que revele credenciales.

### CAP-22 — Aplicación pública

Abre la URL de Vercel en una ventana normal, inicia sesión con una cuenta de demostración y captura el panel. La barra de direcciones debe mostrar el dominio público.

### CAP-26 — CORS/HTTPS en producción

En la aplicación pública abre DevTools → Network, recarga y selecciona una petición a Render. Captura la URL HTTPS, estado 200 y el encabezado de respuesta **Access-Control-Allow-Origin** correspondiente al dominio de Vercel.

### CAP-42 — Despliegue final

Después de completar CAP-19 a CAP-22, combina en el informe dos o tres capturas: Vercel Ready, Render Live/health y Neon activo. No incluyas credenciales.

## Datos locales utilizados

- Reporte persistente: **#0015**
- Frontend: `http://localhost:8081`
- API: `http://localhost:4000/api`
- PostgreSQL del host: puerto `5433`

Las evidencias técnicas pueden regenerarse con [generar-capturas-capitulos.cjs](generar-capturas-capitulos.cjs).
