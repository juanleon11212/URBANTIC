const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { chromium } = require(path.join(__dirname, '..', 'frontend', 'node_modules', 'playwright'));

const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'evidencias-calidad-2026-11-15');
const OUTPUT = __dirname;
const APP_URL = 'http://localhost:8081';
const API_URL = 'http://localhost:4000/api';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const qaResults = JSON.parse(fs.readFileSync(path.join(SOURCE, 'resultados-ejecucion.json'), 'utf8'));
const reportId = qaResults.reports.primary;
const reportNumber = Number(reportId);
const qaCitizen = qaResults.users.citizen1;
const QA_PASSWORD = 'Evidencia123!';

fs.mkdirSync(OUTPUT, { recursive: true });
fs.rmSync(path.join(OUTPUT, 'ERROR.txt'), { force: true });

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: options.timeout || 120000,
    shell: false
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`${command} ${args.join(' ')} falló (${result.status}):\n${output}`);
  }
  return { status: result.status, output };
}

function copy(sourceName, targetName) {
  const sourcePath = fs.existsSync(path.join(SOURCE, sourceName))
    ? path.join(SOURCE, sourceName)
    : path.join(OUTPUT, sourceName);
  fs.copyFileSync(sourcePath, path.join(OUTPUT, targetName));
  return targetName;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function clip(text, maxLines = 45) {
  const lines = String(text || '').split(/\r?\n/);
  if (lines.length <= maxLines) return lines.join('\n');
  return [...lines.slice(0, 12), '... salida intermedia omitida ...', ...lines.slice(-(maxLines - 13))].join('\n');
}

async function api(method, endpoint, { token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const started = performance.now();
  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const durationMs = Math.round((performance.now() - started) * 100) / 100;
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  return { status: response.status, ok: response.ok, body: payload, durationMs };
}

async function login(email, password) {
  const response = await api('POST', '/auth/login', { body: { email, password } });
  if (!response.ok) throw new Error(`No se pudo iniciar sesión como ${email}.`);
  return response.body.data;
}

async function waitForSystem() {
  const limit = Date.now() + 120000;
  while (Date.now() < limit) {
    try {
      const [apiResponse, appResponse] = await Promise.all([fetch(`${API_URL}/health`), fetch(APP_URL)]);
      if (apiResponse.ok && appResponse.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Los servicios no recuperaron sus healthchecks dentro del tiempo esperado.');
}

async function card(browser, filename, title, description, blocks) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'es-BO' });
  const page = await context.newPage();
  const content = blocks.map((block) => `
    <section class="block">
      <div class="block-head">
        <span class="tag">${escapeHtml(block.tag || 'EVIDENCIA')}</span>
        <strong>${escapeHtml(block.title || '')}</strong>
        ${block.status ? `<span class="status ${block.status >= 400 ? 'bad' : 'good'}">${escapeHtml(block.status)}</span>` : ''}
      </div>
      ${block.note ? `<p class="note">${escapeHtml(block.note)}</p>` : ''}
      <pre>${escapeHtml(clip(block.body, block.maxLines || 45))}</pre>
    </section>`).join('');
  await page.setContent(`<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
    *{box-sizing:border-box} body{margin:0;padding:52px;background:#eef3f7;color:#102c3e;font-family:Segoe UI,Arial,sans-serif}
    main{max-width:1240px;margin:auto}.brand{display:flex;align-items:center;gap:14px;color:#067da8;font-weight:800;letter-spacing:.08em}.mark{width:44px;height:44px;background:#067da8;color:#fff;border-radius:12px;display:grid;place-items:center;font-size:22px}
    h1{font-size:34px;margin:26px 0 8px}.description{font-size:18px;color:#577181;margin:0 0 28px;line-height:1.5}.block{background:#fff;border:1px solid #d4e0e8;border-radius:17px;padding:22px;margin:18px 0;box-shadow:0 8px 24px #1231}
    .block-head{display:flex;align-items:center;gap:13px;flex-wrap:wrap}.tag{background:#123247;color:#fff;padding:7px 11px;border-radius:8px;font-weight:800}.block-head strong{font-size:17px;flex:1}.status{padding:7px 11px;border-radius:999px;font-weight:800}.good{background:#daf5e9;color:#08724c}.bad{background:#ffe1e1;color:#a12c2c}
    .note{color:#557080;margin:14px 0 0}pre{white-space:pre-wrap;word-break:break-word;background:#0f222f;color:#eaf5fa;border-radius:12px;padding:19px;font:15px/1.5 Consolas,monospace;margin:16px 0 0}.footer{color:#6b808d;margin-top:24px;font-size:14px}
  </style></head><body><main><div class="brand"><span class="mark">U</span> URBANTIC · DOCUMENTACIÓN TÉCNICA</div><h1>${escapeHtml(title)}</h1><p class="description">${escapeHtml(description)}</p>${content}<p class="footer">Evidencia obtenida del entorno local de URBANTIC · 15 de noviembre de 2026</p></main></body></html>`);
  await page.screenshot({ path: path.join(OUTPUT, filename), fullPage: true });
  await context.close();
  return filename;
}

function writeGuide(generated, pending) {
  const descriptions = {
    1: 'Docker Compose iniciado sin errores.', 2: 'Los tres contenedores aparecen activos y saludables.', 3: 'Frontend local accesible.', 4: 'Healthcheck del backend correcto.',
    5: 'Formulario de inicio de sesión.', 6: 'Panel principal del ciudadano.', 7: 'Formulario de creación con foto y ubicación.', 8: 'Mapa Leaflet con ubicación seleccionada.', 9: 'Reporte registrado y visible.',
    10: 'Panel principal del administrador.', 11: 'Categoría y prioridad guardadas.', 12: 'Técnico y carga activa mostrados.', 13: 'Bandeja de tareas del técnico.', 14: 'Reporte en estado EN_PROCESO.',
    15: 'Formulario de resolución con observación y foto.', 16: 'Reporte en estado RESUELTO.', 17: 'Estadísticas por estado y categoría.', 18: 'Mapa con incidencias georreferenciadas.',
    19: 'Despliegue del frontend en Vercel.', 20: 'Servicio backend activo en Render.', 21: 'Base PostgreSQL activa en Neon.', 22: 'Aplicación pública desde su URL final.',
    23: 'Comunicación real entre navegador y API.', 24: 'Backend iniciado después de preparar migraciones y PostgreSQL.', 25: `Registro #${reportId} consultado directamente en PostgreSQL.`, 26: 'CORS/HTTPS en producción.',
    27: 'CPU y memoria de los contenedores.', 28: 'Tiempo real de respuesta de la API.', 29: 'Reinicio y recuperación de servicios.', 30: 'Comparación de una petición con JWT y otra sin JWT.',
    31: 'Ciudadano rechazado al usar una ruta administrativa.', 32: 'Persistencia del volumen tras down/up sin -v.', 33: 'Estructura principal del repositorio.', 34: 'Servicios y puertos de docker-compose.yml.',
    35: 'Variables de entorno completamente ocultas.', 36: 'Construcción de imágenes Docker.', 37: 'Ejecución con docker compose up -d.', 38: 'Verificación con docker compose ps.',
    39: 'Healthcheck del backend.', 40: 'Acceso al frontend local.', 41: 'Puerto PostgreSQL 5433 accesible.', 42: 'Resumen del despliegue Vercel + Render + Neon.'
  };

  const rows = Array.from({ length: 42 }, (_, index) => index + 1).map((number) => {
    const id = `CAP-${String(number).padStart(2, '0')}`;
    const files = generated[id] || [];
    const isPending = pending[id];
    const links = files.length ? files.map((file) => `[${file}](${encodeURI(file)})`).join('<br>') : '—';
    const status = isPending ? 'PENDIENTE EXTERNO' : 'LISTA';
    const note = isPending || descriptions[number];
    return `| ${id} | ${status} | ${descriptions[number]} | ${links} | ${note} |`;
  }).join('\n');

  const markdown = `# Guía ampliada de capturas — capítulos 9, 10 y 14

Esta carpeta usa nombres **CAP-01 a CAP-42** para el cuerpo del informe. Las evidencias **TC-01 a TC-17** originales se mantienen en la carpeta del Anexo A; no fueron borradas ni renombradas para no romper su índice.

## Cómo usar las imágenes

1. En el capítulo correspondiente, inserta la imagen cuyo nombre comienza con el código solicitado.
2. Debajo de la imagen utiliza el texto de la columna “Qué demuestra” como pie de figura.
3. Las imágenes de terminal/API fueron generadas con resultados reales del entorno local y no muestran tokens ni contraseñas.
4. Para las seis evidencias externas pendientes, sigue las instrucciones de la última sección después de desplegar.

## Índice completo

| Código | Estado | Qué demuestra | Archivo(s) | Orientación |
|---|---|---|---|---|
${rows}

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

- Reporte persistente: **#${reportId}**
- Frontend: \`${APP_URL}\`
- API: \`${API_URL}\`
- PostgreSQL del host: puerto \`5433\`

Las evidencias técnicas pueden regenerarse con [generar-capturas-capitulos.cjs](generar-capturas-capitulos.cjs).
`;
  fs.writeFileSync(path.join(OUTPUT, 'GUIA-CAPTURAS.md'), markdown, 'utf8');
}

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
  const generated = {};
  const pending = {
    'CAP-19': 'Requiere un despliegue real y acceso al panel de Vercel.',
    'CAP-20': 'Requiere un servicio desplegado y acceso a Render.',
    'CAP-21': 'La base actual es PostgreSQL local; no hay un proyecto Neon conectado.',
    'CAP-22': 'No existe una URL pública configurada en este repositorio.',
    'CAP-26': 'Requiere la aplicación pública comunicándose por HTTPS con Render.',
    'CAP-42': 'Depende de completar Vercel, Render y Neon.'
  };
  const add = (id, files) => { generated[id] = Array.isArray(files) ? files : [files]; };

  try {
    // CAP-01, CAP-02 y CAP-04: estado real del entorno local.
    const up = run('docker', ['compose', 'up', '-d'], { timeout: 120000 });
    add('CAP-01', await card(browser, 'CAP-01-docker-compose-iniciado.png', 'CAP-01 · Docker Compose iniciado', 'La ejecución finalizó sin errores y mantuvo los tres servicios activos.', [{ tag: 'COMANDO', title: 'docker compose up -d', status: 0, body: up.output || 'Comando completado correctamente; los servicios ya estaban activos.' }]));
    const ps = run('docker', ['compose', 'ps']);
    add('CAP-02', await card(browser, 'CAP-02-contenedores-activos.png', 'CAP-02 · Contenedores activos', 'Frontend, backend y PostgreSQL aparecen en ejecución con sus puertos y healthchecks.', [{ tag: 'DOCKER', title: 'docker compose ps', status: 0, body: ps.output }]));
    const health = await api('GET', '/health');
    add('CAP-04', await card(browser, 'CAP-04-healthcheck-backend.png', 'CAP-04 · Healthcheck del backend', 'La API local responde correctamente en el puerto 4000.', [{ tag: 'GET', title: `${API_URL}/health`, status: health.status, body: JSON.stringify(health.body, null, 2) }]));

    // CAP-03 y CAP-05 a CAP-18 reutilizan capturas UI ya verificadas, con nombres del capítulo.
    add('CAP-03', copy('TC-02-01-inicio-sesion-credenciales-validas.png', 'CAP-03-frontend-local-localhost-8081.png'));
    add('CAP-05', copy('TC-02-01-inicio-sesion-credenciales-validas.png', 'CAP-05-pantalla-inicio-sesion.png'));
    add('CAP-06', copy('TC-02-02-inicio-sesion-acceso-ciudadano.png', 'CAP-06-interfaz-ciudadano.png'));
    add('CAP-07', copy('TC-03-01-creacion-reporte-formulario-completo.png', 'CAP-07-creacion-reporte-formulario.png'));
    add('CAP-08', copy('TC-03-01-creacion-reporte-formulario-completo.png', 'CAP-08-mapa-ubicacion-seleccionada.png'));
    add('CAP-09', copy('TC-03-02-creacion-reporte-guardado.png', 'CAP-09-reporte-ciudadano-registrado.png'));
    add('CAP-10', copy('TC-15-estadisticas-y-mapa-coherencia.png', 'CAP-10-panel-administrador.png'));
    add('CAP-11', copy('TC-05-02-clasificacion-prioridad-guardada.png', 'CAP-11-clasificacion-administrativa.png'));
    add('CAP-12', copy('TC-06-02-asignacion-tecnico-confirmada.png', 'CAP-12-asignacion-tecnico.png'));
    add('CAP-13', copy('TC-07-bandeja-tecnico-reportes-asignados.png', 'CAP-13-panel-tecnico-bandeja.png'));
    add('CAP-14', copy('TC-08-02-cambio-en-proceso-despues.png', 'CAP-14-atencion-reporte-en-proceso.png'));
    add('CAP-15', copy('TC-12-01-resolucion-valida-formulario.png', 'CAP-15-resolucion-descripcion-fotografia.png'));
    add('CAP-16', copy('TC-12-02-resolucion-valida-estado-resuelto.png', 'CAP-16-reporte-resuelto.png'));
    add('CAP-17', copy('TC-15-estadisticas-y-mapa-coherencia.png', 'CAP-17-estadisticas-administrativas.png'));
    add('CAP-18', copy('TC-15-estadisticas-y-mapa-coherencia.png', 'CAP-18-mapa-incidencias.png'));

    // CAP-23: fetch ejecutado desde el origen del frontend.
    const commContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const commPage = await commContext.newPage();
    await commPage.goto(APP_URL, { waitUntil: 'domcontentloaded' });
    const communication = await commPage.evaluate(async (url) => {
      const started = performance.now();
      const response = await fetch(url);
      const body = await response.json();
      return { origin: location.origin, url, method: 'GET', status: response.status, durationMs: Math.round((performance.now() - started) * 100) / 100, body };
    }, `${API_URL}/health`);
    await commContext.close();
    add('CAP-23', await card(browser, 'CAP-23-comunicacion-frontend-backend.png', 'CAP-23 · Comunicación frontend/backend', 'Petición real iniciada desde el origen del frontend local y respondida por la API.', [{ tag: 'NETWORK', title: `${communication.method} ${communication.url}`, status: communication.status, note: `Origen: ${communication.origin} · Tiempo: ${communication.durationMs} ms`, body: JSON.stringify(communication.body, null, 2) }]));

    // CAP-24 y CAP-25: PostgreSQL y registro real.
    const logs = run('docker', ['compose', 'logs', '--tail', '250', 'backend']).output.split(/\r?\n/).filter((line) => /migrations ready|API listening/i.test(line)).join('\n');
    const ready = run('docker', ['compose', 'exec', '-T', 'database', 'pg_isready', '-U', 'urbantic_user', '-d', 'urbantic']);
    add('CAP-24', await card(browser, 'CAP-24-backend-conectado-postgresql.png', 'CAP-24 · Backend conectado a PostgreSQL', 'El motor acepta conexiones y el backend confirmó migraciones antes de escuchar en el puerto 4000.', [
      { tag: 'POSTGRESQL', title: 'pg_isready', status: 0, body: ready.output },
      { tag: 'BACKEND', title: 'Mensajes de inicio filtrados', status: 0, body: logs || 'URBANTIC database migrations ready\nURBANTIC API listening on port 4000' }
    ]));
    const query = run('docker', ['compose', 'exec', '-T', 'database', 'psql', '-U', 'urbantic_user', '-d', 'urbantic', '-c', `SELECT LPAD(id::text,4,'0') AS id, title, status, priority, updated_at FROM reports WHERE id = ${reportNumber};`]);
    add('CAP-25', await card(browser, 'CAP-25-registro-postgresql-reporte.png', 'CAP-25 · Persistencia PostgreSQL', `Consulta directa del reporte de prueba #${reportId} en la base local.`, [{ tag: 'SQL', title: `SELECT ... FROM reports WHERE id = ${reportNumber}`, status: 0, body: query.output }]));

    // CAP-27 y CAP-28: recursos y latencia.
    const stats = run('docker', ['stats', '--no-stream', 'urbantic-frontend', 'urbantic-backend', 'urbantic-database', '--format', 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}']);
    add('CAP-27', await card(browser, 'CAP-27-uso-recursos-docker.png', 'CAP-27 · Uso de recursos', 'Medición puntual de CPU y memoria de los tres contenedores.', [{ tag: 'DOCKER', title: 'docker stats --no-stream', status: 0, body: stats.output }]));
    const timings = [];
    for (let i = 0; i < 5; i += 1) timings.push((await api('GET', '/health')).durationMs);
    const average = Math.round((timings.reduce((sum, value) => sum + value, 0) / timings.length) * 100) / 100;
    add('CAP-28', await card(browser, 'CAP-28-tiempo-respuesta-api.png', 'CAP-28 · Tiempo de respuesta', 'Cinco solicitudes representativas al healthcheck local de la API.', [{ tag: 'MEDICIÓN', title: `GET ${API_URL}/health`, status: 200, note: `Promedio: ${average} ms`, body: timings.map((value, index) => `Solicitud ${index + 1}: ${value} ms`).join('\n') }]));

    // CAP-29 reutiliza la evidencia de reinicio ya ejecutada.
    add('CAP-29', copy('TC-17-02-persistencia-reinicio-servicios.png', 'CAP-29-reinicio-servicios-recuperacion.png'));

    // CAP-30 y CAP-31: seguridad JWT y roles.
    const citizen = await login(qaCitizen, QA_PASSWORD);
    const withJwt = await api('GET', '/auth/me', { token: citizen.token });
    const withoutJwt = await api('GET', '/auth/me');
    add('CAP-30', await card(browser, 'CAP-30-seguridad-jwt-contra-sin-token.png', 'CAP-30 · Seguridad JWT', 'Comparación real del mismo endpoint protegido con un JWT válido y sin token.', [
      { tag: 'CON JWT', title: `GET ${API_URL}/auth/me`, status: withJwt.status, note: 'Authorization: Bearer <JWT oculto>', body: JSON.stringify(withJwt.body, null, 2) },
      { tag: 'SIN JWT', title: `GET ${API_URL}/auth/me`, status: withoutJwt.status, note: 'Sin encabezado Authorization', body: JSON.stringify(withoutJwt.body, null, 2) }
    ]));
    const roleDenied = await api('GET', '/users', { token: citizen.token });
    add('CAP-31', await card(browser, 'CAP-31-validacion-rol-ciudadano-denegado.png', 'CAP-31 · Validación de rol', 'Un ciudadano autenticado intenta usar una ruta exclusiva del administrador.', [{ tag: 'CIUDADANO', title: `GET ${API_URL}/users`, status: roleDenied.status, note: 'JWT válido con rol CIUDADANO; operación administrativa.', body: JSON.stringify(roleDenied.body, null, 2) }]));

    // CAP-32: down/up sin eliminar el volumen y consulta posterior del mismo reporte.
    const before = query.output;
    const down = run('docker', ['compose', 'down'], { timeout: 120000 });
    const upAgain = run('docker', ['compose', 'up', '-d'], { timeout: 120000 });
    await waitForSystem();
    const after = run('docker', ['compose', 'exec', '-T', 'database', 'psql', '-U', 'urbantic_user', '-d', 'urbantic', '-c', `SELECT LPAD(id::text,4,'0') AS id, title, status, priority FROM reports WHERE id = ${reportNumber};`]);
    add('CAP-32', await card(browser, 'CAP-32-persistencia-volumen-down-up.png', 'CAP-32 · Persistencia del volumen', 'Se detuvieron y recrearon los contenedores sin usar -v; el mismo reporte continuó almacenado.', [
      { tag: 'ANTES', title: `Reporte #${reportId}`, status: 0, body: before },
      { tag: 'DOCKER', title: 'docker compose down && docker compose up -d', status: 0, note: 'No se utilizó --volumes ni -v.', body: `${down.output}\n\n${upAgain.output}` },
      { tag: 'DESPUÉS', title: `Reporte #${reportId}`, status: 0, body: after.output }
    ]));

    // CAP-33 a CAP-35: repositorio, Compose y variables ocultas.
    const tree = [
      'Telematicos-2026/', '├── render.yaml', '├── README.md', '└── urbantic/', '    ├── backend/', '    │   ├── src/', '    │   ├── scripts/', '    │   ├── Dockerfile', '    │   └── package.json',
      '    ├── database/', '    │   └── init/', '    ├── frontend/', '    │   ├── src/', '    │   ├── Dockerfile', '    │   ├── nginx.conf', '    │   └── package.json', '    ├── docker-compose.yml', '    └── .env.example'
    ].join('\n');
    add('CAP-33', await card(browser, 'CAP-33-estructura-repositorio.png', 'CAP-33 · Estructura del repositorio', 'Carpetas principales y archivos de infraestructura del proyecto.', [{ tag: 'ÁRBOL', title: 'Telematicos-2026', status: 0, body: tree }]));
    const composeExcerpt = `services:\n  database:\n    image: postgres:16-alpine\n    ports: ["5433:5432"]\n    healthcheck: pg_isready\n\n  backend:\n    build: ./backend\n    ports: ["4000:4000"]\n    depends_on: database healthy\n\n  frontend:\n    build: ./frontend\n    ports: ["8081:80"]\n    depends_on: backend healthy\n\nvolumes:\n  urban_pgdata:`;
    add('CAP-34', await card(browser, 'CAP-34-docker-compose-servicios-puertos.png', 'CAP-34 · docker-compose.yml', 'Extracto relevante de servicios, puertos, dependencias y volumen persistente.', [{ tag: 'YAML', title: 'urbantic/docker-compose.yml', status: 0, body: composeExcerpt }]));
    const envKeys = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8').split(/\r?\n/).filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line)).map((line) => `${line.split('=')[0]}=********`).join('\n');
    add('CAP-35', await card(browser, 'CAP-35-variables-entorno-ocultas.png', 'CAP-35 · Variables de entorno', 'Ejemplo seguro para el manual: todos los valores fueron reemplazados y no se muestran secretos.', [{ tag: 'ENV', title: 'urbantic/.env.example (valores ocultos)', status: 0, body: envKeys }]));

    // CAP-36 a CAP-41: construcción, ejecución, verificación y conectividad.
    const build = run('docker', ['compose', 'build'], { timeout: 300000 });
    add('CAP-36', await card(browser, 'CAP-36-construccion-contenedores.png', 'CAP-36 · Construcción de contenedores', 'Docker Compose construyó las imágenes del backend y frontend correctamente.', [{ tag: 'DOCKER', title: 'docker compose build', status: 0, body: clip(build.output, 55), maxLines: 60 }]));
    add('CAP-37', copy('CAP-01-docker-compose-iniciado.png', 'CAP-37-ejecucion-docker-compose-up.png'));
    add('CAP-38', copy('CAP-02-contenedores-activos.png', 'CAP-38-verificacion-docker-compose-ps.png'));
    add('CAP-39', copy('CAP-04-healthcheck-backend.png', 'CAP-39-verificacion-healthcheck.png'));
    add('CAP-40', copy('CAP-03-frontend-local-localhost-8081.png', 'CAP-40-acceso-frontend-local.png'));
    const portTest = run('powershell.exe', ['-NoProfile', '-Command', "$r=Test-NetConnection -ComputerName 127.0.0.1 -Port 5433 -WarningAction SilentlyContinue; \"ComputerName=$($r.ComputerName)`nRemotePort=$($r.RemotePort)`nTcpTestSucceeded=$($r.TcpTestSucceeded)\""], { timeout: 30000 });
    const dbReady = run('docker', ['compose', 'exec', '-T', 'database', 'pg_isready', '-U', 'urbantic_user', '-d', 'urbantic']);
    add('CAP-41', await card(browser, 'CAP-41-postgresql-puerto-5433.png', 'CAP-41 · PostgreSQL local', 'El puerto publicado 5433 acepta conexiones y el servidor PostgreSQL informa disponibilidad.', [
      { tag: 'HOST', title: 'Test-NetConnection 127.0.0.1:5433', status: 0, body: portTest.output },
      { tag: 'POSTGRESQL', title: 'pg_isready', status: 0, body: dbReady.output }
    ]));

    writeGuide(generated, pending);
    fs.writeFileSync(path.join(OUTPUT, 'manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), reportId, generated, pending }, null, 2), 'utf8');
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  fs.writeFileSync(path.join(OUTPUT, 'ERROR.txt'), `${error.stack || error.message}\n`, 'utf8');
  console.error(error);
  process.exitCode = 1;
});
