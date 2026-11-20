# Evidencias de aseguramiento de calidad — URBANTIC

Fecha de ejecución: 15 de noviembre de 2026  
Entorno: aplicación local Docker Compose (frontend, backend y PostgreSQL)  
Resultado general: **APROBADO**

## Datos de la ejecución

- Ciudadano principal: `qa.ciudadano.787458441@urbantic.test`
- Segundo ciudadano: `qa.privacidad.787458441@urbantic.test`
- Técnico adicional: `qa.tecnico.787458441@urbantic.test`
- Contraseña de usuarios QA: `Evidencia123!`
- Reporte principal: **#0015**
- Reporte ajeno: **#0016**
- Reporte rechazado: **#0017**

## Índice de casos

| Caso | Estado | Resultado obtenido | Evidencias |
|---|---|---|---|
| TC-01 | APROBADO | La cuenta fue creada con rol CIUDADANO; la API respondió HTTP 201 y abrió el panel ciudadano. | [TC-01-01-registro-ciudadano-formulario.png](TC-01-01-registro-ciudadano-formulario.png)<br>[TC-01-02-registro-ciudadano-confirmado.png](TC-01-02-registro-ciudadano-confirmado.png) |
| TC-02 | APROBADO | El ciudadano inició sesión; la API respondió HTTP 200 y mostró su panel. | [TC-02-01-inicio-sesion-credenciales-validas.png](TC-02-01-inicio-sesion-credenciales-validas.png)<br>[TC-02-02-inicio-sesion-acceso-ciudadano.png](TC-02-02-inicio-sesion-acceso-ciudadano.png) |
| TC-03 | APROBADO | Se creó el reporte #0015 con categoría, coordenadas, zona y fotografía; HTTP 201. | [TC-03-01-creacion-reporte-formulario-completo.png](TC-03-01-creacion-reporte-formulario-completo.png)<br>[TC-03-02-creacion-reporte-guardado.png](TC-03-02-creacion-reporte-guardado.png) |
| TC-04 | APROBADO | El reporte propio #0015 fue visible y el acceso al reporte ajeno #0016 fue restringido con HTTP 404. | [TC-04-01-consulta-reporte-propio.png](TC-04-01-consulta-reporte-propio.png)<br>[TC-04-02-consulta-reporte-ajeno-restringida.png](TC-04-02-consulta-reporte-ajeno-restringida.png) |
| TC-05 | APROBADO | El reporte #0015 fue clasificado como Agua con prioridad CRÍTICA. | [TC-05-01-clasificacion-prioridad-antes.png](TC-05-01-clasificacion-prioridad-antes.png)<br>[TC-05-02-clasificacion-prioridad-guardada.png](TC-05-02-clasificacion-prioridad-guardada.png) |
| TC-06 | APROBADO | El reporte #0015 fue asignado al técnico Tecnico Urbantic; la lista mostró su carga activa. | [TC-06-01-asignacion-tecnico-carga.png](TC-06-01-asignacion-tecnico-carga.png)<br>[TC-06-02-asignacion-tecnico-confirmada.png](TC-06-02-asignacion-tecnico-confirmada.png) |
| TC-07 | APROBADO | La bandeja del técnico mostró el reporte asignado #0015 con su prioridad. | [TC-07-bandeja-tecnico-reportes-asignados.png](TC-07-bandeja-tecnico-reportes-asignados.png) |
| TC-08 | APROBADO | El técnico asignado cambió el reporte #0015 de ASIGNADO a EN_PROCESO. | [TC-08-01-cambio-asignado-antes.png](TC-08-01-cambio-asignado-antes.png)<br>[TC-08-02-cambio-en-proceso-despues.png](TC-08-02-cambio-en-proceso-despues.png) |
| TC-09 | APROBADO | El técnico no asignado recibió HTTP 404 y no pudo modificar el reporte #0015. | [TC-09-restriccion-tecnico-no-asignado.png](TC-09-restriccion-tecnico-no-asignado.png) |
| TC-10 | APROBADO | La API rechazó la observación corta con HTTP 400 y mantuvo EN_PROCESO. | [TC-10-observacion-menor-10-caracteres.png](TC-10-observacion-menor-10-caracteres.png) |
| TC-11 | APROBADO | La API rechazó cero fotos (HTTP 400) y seis fotos (HTTP 400); el estado no cambió. | [TC-11-validacion-cantidad-fotografias.png](TC-11-validacion-cantidad-fotografias.png) |
| TC-12 | APROBADO | El reporte #0015 cambió a RESUELTO con observación y una fotografía de evidencia. | [TC-12-01-resolucion-valida-formulario.png](TC-12-01-resolucion-valida-formulario.png)<br>[TC-12-02-resolucion-valida-estado-resuelto.png](TC-12-02-resolucion-valida-estado-resuelto.png) |
| TC-13 | APROBADO | El cierre de un reporte EN_REVISION fue rechazado con HTTP 409; el reporte RESUELTO #0015 cambió a CERRADO. | [TC-13-01-cierre-reporte-no-resuelto-denegado.png](TC-13-01-cierre-reporte-no-resuelto-denegado.png)<br>[TC-13-02-cierre-reporte-resuelto-cerrado.png](TC-13-02-cierre-reporte-resuelto-cerrado.png) |
| TC-14 | APROBADO | La solicitud sin motivo fue rechazada con HTTP 400; el rechazo válido cambió el reporte #0017 a RECHAZADO y guardó el motivo. | [TC-14-01-rechazo-sin-motivo-validacion.png](TC-14-01-rechazo-sin-motivo-validacion.png)<br>[TC-14-02-rechazo-administrativo-con-motivo.png](TC-14-02-rechazo-administrativo-con-motivo.png) |
| TC-15 | APROBADO | El dashboard mostró indicadores, gráficos por estado/categoría y puntos geográficos correspondientes a los reportes registrados. | [TC-15-estadisticas-y-mapa-coherencia.png](TC-15-estadisticas-y-mapa-coherencia.png) |
| TC-16 | APROBADO | La API rechazó el acceso sin JWT con HTTP 401 y no entregó reportes. | [TC-16-api-protegida-sin-jwt.png](TC-16-api-protegida-sin-jwt.png) |
| TC-17 | APROBADO | Tras reiniciar los tres servicios, el reporte #0015 continuó disponible en estado CERRADO con su información e historial. | [TC-17-01-persistencia-antes-reinicio.png](TC-17-01-persistencia-antes-reinicio.png)<br>[TC-17-02-persistencia-reinicio-servicios.png](TC-17-02-persistencia-reinicio-servicios.png)<br>[TC-17-03-persistencia-despues-reinicio.png](TC-17-03-persistencia-despues-reinicio.png) |

## Uso en el informe

Cada archivo comienza con el código del caso de prueba. Inserta las capturas correspondientes bajo “Evidencia” y copia el texto de “Resultado obtenido” de esta tabla. Las capturas de respuestas HTTP muestran solicitudes reales; los datos de prueba llevan correos con prefijo `qa.` para distinguirlos de información operativa.

El archivo [resultados-ejecucion.json](resultados-ejecucion.json) conserva los identificadores y respuestas técnicas sin guardar tokens JWT.

## Gráfico resumen para el informe

[GRAFICO-resultados-pruebas-TC-01-a-TC-17.png](GRAFICO-resultados-pruebas-TC-01-a-TC-17.png)

**Pie sugerido:** Resultados de la ejecución formal de los casos de prueba TC-01 a TC-17: 17 casos aprobados, 0 fallidos y 100% de cumplimiento.
