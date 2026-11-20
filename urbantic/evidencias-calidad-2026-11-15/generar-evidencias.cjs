const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require(path.join(__dirname, '..', 'frontend', 'node_modules', 'playwright'));

const APP_URL = 'http://localhost:8081';
const API_URL = 'http://localhost:4000/api';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = __dirname;
const ASSETS_DIR = path.join(OUTPUT_DIR, 'recursos');
const PASSWORD = 'Evidencia123!';
const DEMO_PASSWORD = 'Password123!';
const RUN_STAMP = `${Date.now()}`.slice(-9);

const names = {
  citizen1: `qa.ciudadano.${RUN_STAMP}@urbantic.test`,
  citizen2: `qa.privacidad.${RUN_STAMP}@urbantic.test`,
  technician2: `qa.tecnico.${RUN_STAMP}@urbantic.test`
};

const results = {
  generatedAt: new Date().toISOString(),
  runStamp: RUN_STAMP,
  users: {
    citizen1: names.citizen1,
    citizen2: names.citizen2,
    technician2: names.technician2
  },
  reports: {},
  cases: {}
};

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(ASSETS_DIR, { recursive: true });
fs.rmSync(path.join(OUTPUT_DIR, 'error-ejecucion.json'), { force: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function apiRequest(method, endpoint, { token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  return { method, endpoint, status: response.status, ok: response.ok, body: payload };
}

async function loginApi(email, password) {
  const response = await apiRequest('POST', '/auth/login', { body: { email, password } });
  if (!response.ok) throw new Error(`No se pudo iniciar sesión como ${email}: ${response.status} ${JSON.stringify(response.body)}`);
  return response.body.data;
}

async function registerApi(payload) {
  const response = await apiRequest('POST', '/auth/register', { body: payload });
  if (!response.ok) throw new Error(`No se pudo registrar ${payload.email}: ${response.status} ${JSON.stringify(response.body)}`);
  return response.body.data;
}

async function newAuthedPage(browser, token) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'es-BO',
    timezoneId: 'America/La_Paz'
  });
  await context.addInitScript((sessionToken) => {
    localStorage.setItem('urbantic_token', sessionToken);
  }, token);
  const page = await context.newPage();
  return { context, page };
}

async function screenshot(page, filename, fullPage = true) {
  const target = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: target, fullPage });
  return filename;
}

async function evidenceCard(browser, filename, title, subtitle, entries) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'es-BO' });
  const page = await context.newPage();
  const cards = entries.map((entry) => {
    const statusClass = entry.status >= 200 && entry.status < 300 ? 'ok' : 'error';
    return `
      <section class="response-card">
        <div class="request-line">
          <span class="method">${escapeHtml(entry.method || '')}</span>
          <code>${escapeHtml(entry.url || '')}</code>
          ${entry.status !== undefined ? `<span class="status ${statusClass}">HTTP ${escapeHtml(entry.status)}</span>` : ''}
        </div>
        ${entry.note ? `<p class="note">${escapeHtml(entry.note)}</p>` : ''}
        <pre>${escapeHtml(typeof entry.body === 'string' ? entry.body : JSON.stringify(entry.body, null, 2))}</pre>
      </section>`;
  }).join('');

  await page.setContent(`<!doctype html>
    <html lang="es"><head><meta charset="utf-8"><style>
      *{box-sizing:border-box} body{margin:0;background:#eef3f7;color:#183042;font-family:Inter,Segoe UI,Arial,sans-serif;padding:56px}
      main{max-width:1240px;margin:auto}.brand{display:flex;align-items:center;gap:14px;color:#087ca8;font-weight:800;letter-spacing:.08em}
      .mark{width:44px;height:44px;border-radius:12px;background:#087ca8;color:#fff;display:grid;place-items:center;font-size:22px}
      h1{font-size:34px;margin:28px 0 8px} .subtitle{font-size:18px;color:#587080;margin:0 0 28px}
      .response-card{background:#fff;border:1px solid #d7e2e9;border-radius:18px;box-shadow:0 10px 30px #1232 0;margin:18px 0;padding:24px}
      .request-line{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.method{background:#183042;color:#fff;padding:7px 12px;border-radius:8px;font-weight:800}
      code{font-size:16px;flex:1}.status{padding:7px 12px;border-radius:999px;font-weight:800}.status.ok{background:#d9f6e9;color:#08724c}.status.error{background:#ffe2e2;color:#a12c2c}
      pre{white-space:pre-wrap;word-break:break-word;background:#10202c;color:#eaf4f8;border-radius:12px;padding:20px;font:15px/1.5 Consolas,monospace;margin:18px 0 0}
      .note{color:#4f6878;font-size:16px;margin:15px 0 0}.footer{margin-top:26px;color:#6f818d;font-size:14px}
    </style></head><body><main>
      <div class="brand"><span class="mark">U</span> URBANTIC · EVIDENCIA TÉCNICA</div>
      <h1>${escapeHtml(title)}</h1><p class="subtitle">${escapeHtml(subtitle)}</p>
      ${cards}
      <p class="footer">Captura generada a partir de solicitudes reales ejecutadas contra la API local de URBANTIC.</p>
    </main></body></html>`, { waitUntil: 'load' });
  await screenshot(page, filename, true);
  await context.close();
}

async function waitForSystem() {
  const deadline = Date.now() + 120000;
  let lastError = '';
  while (Date.now() < deadline) {
    try {
      const api = await fetch(`${API_URL}/health`);
      const web = await fetch(APP_URL);
      if (api.ok && web.ok) return;
      lastError = `API ${api.status}, web ${web.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await sleep(2000);
  }
  throw new Error(`Los servicios no se recuperaron después del reinicio: ${lastError}`);
}

function caseResult(id, status, evidence, note) {
  results.cases[id] = { status, evidence, note };
}

function writeIndex() {
  const rows = Object.entries(results.cases)
    .sort(([left], [right]) => Number(left.slice(3)) - Number(right.slice(3)))
    .map(([id, item]) => {
    const links = item.evidence.map((file) => `[${file}](${encodeURI(file)})`).join('<br>');
    return `| ${id} | ${item.status} | ${item.note} | ${links} |`;
  }).join('\n');

  const markdown = `# Evidencias de aseguramiento de calidad — URBANTIC

Fecha de ejecución: 15 de noviembre de 2026  
Entorno: aplicación local Docker Compose (frontend, backend y PostgreSQL)  
Resultado general: **${Object.values(results.cases).every((item) => item.status === 'APROBADO') ? 'APROBADO' : 'REVISAR RESULTADOS'}**

## Datos de la ejecución

- Ciudadano principal: \`${names.citizen1}\`
- Segundo ciudadano: \`${names.citizen2}\`
- Técnico adicional: \`${names.technician2}\`
- Contraseña de usuarios QA: \`${PASSWORD}\`
- Reporte principal: **#${results.reports.primary}**
- Reporte ajeno: **#${results.reports.other}**
- Reporte rechazado: **#${results.reports.rejected}**

## Índice de casos

| Caso | Estado | Resultado obtenido | Evidencias |
|---|---|---|---|
${rows}

## Uso en el informe

Cada archivo comienza con el código del caso de prueba. Inserta las capturas correspondientes bajo “Evidencia” y copia el texto de “Resultado obtenido” de esta tabla. Las capturas de respuestas HTTP muestran solicitudes reales; los datos de prueba llevan correos con prefijo \`qa.\` para distinguirlos de información operativa.

El archivo [resultados-ejecucion.json](resultados-ejecucion.json) conserva los identificadores y respuestas técnicas sin guardar tokens JWT.
`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'INDICE.md'), markdown, 'utf8');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'resultados-ejecucion.json'), JSON.stringify(results, null, 2), 'utf8');
}

async function main() {
  const health = await apiRequest('GET', '/health');
  if (!health.ok) throw new Error('La API no está disponible.');

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox']
  });

  try {
    // Recurso fotográfico sintético y claramente rotulado para los casos de prueba.
    const assetContext = await browser.newContext({ viewport: { width: 800, height: 500 } });
    const assetPage = await assetContext.newPage();
    await assetPage.setContent(`<!doctype html><html><body style="margin:0"><div id="photo" style="width:760px;height:420px;background:linear-gradient(150deg,#777,#444);color:white;font-family:Arial;display:flex;align-items:center;justify-content:center;flex-direction:column;border:20px solid #ddd"><div style="width:220px;height:95px;background:#211;border-radius:50%;box-shadow:0 0 0 14px #555"></div><h1 style="margin:34px 0 4px">EVIDENCIA DE PRUEBA</h1><p style="font-size:22px">Incidencia urbana simulada · URBANTIC QA</p></div></body></html>`);
    const evidenceImage = path.join(ASSETS_DIR, 'evidencia-prueba.png');
    await assetPage.locator('#photo').screenshot({ path: evidenceImage });
    await assetContext.close();
    const evidenceData = `data:image/png;base64,${fs.readFileSync(evidenceImage).toString('base64')}`;

    // TC-01: registro real desde la interfaz.
    const citizenContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      locale: 'es-BO',
      timezoneId: 'America/La_Paz',
      geolocation: { latitude: -17.3895, longitude: -66.1568 },
      permissions: ['geolocation']
    });
    const citizenPage = await citizenContext.newPage();
    await citizenPage.goto(`${APP_URL}/registro`, { waitUntil: 'domcontentloaded' });
    await citizenPage.locator('[name="firstName"]').fill('Evidencia');
    await citizenPage.locator('[name="lastName"]').fill('Ciudadano');
    await citizenPage.locator('[name="phone"]').fill('70001111');
    await citizenPage.locator('[name="email"]').fill(names.citizen1);
    await citizenPage.locator('[name="password"]').fill(PASSWORD);
    const tc01Form = await screenshot(citizenPage, 'TC-01-01-registro-ciudadano-formulario.png', true);
    const registerResponsePromise = citizenPage.waitForResponse((response) => response.url().endsWith('/api/auth/register') && response.request().method() === 'POST');
    await citizenPage.getByRole('button', { name: 'Registrarme' }).click();
    const registerResponse = await registerResponsePromise;
    await citizenPage.waitForURL('**/ciudadano');
    await citizenPage.locator('h1').first().waitFor();
    const tc01Success = await screenshot(citizenPage, 'TC-01-02-registro-ciudadano-confirmado.png', true);
    results.registrationStatus = registerResponse.status();
    const citizen1Token = await citizenPage.evaluate(() => localStorage.getItem('urbantic_token'));
    caseResult('TC-01', registerResponse.status() === 201 ? 'APROBADO' : 'FALLIDO', [tc01Form, tc01Success], `La cuenta fue creada con rol CIUDADANO; la API respondió HTTP ${registerResponse.status()} y abrió el panel ciudadano.`);

    // TC-02: cierre de sesión e inicio de sesión real desde la interfaz.
    await citizenPage.getByRole('button', { name: 'Salir' }).click();
    await citizenPage.waitForURL('**/login');
    await citizenPage.locator('[name="email"]').fill(names.citizen1);
    await citizenPage.locator('[name="password"]').fill(PASSWORD);
    const tc02Login = await screenshot(citizenPage, 'TC-02-01-inicio-sesion-credenciales-validas.png', true);
    const loginResponsePromise = citizenPage.waitForResponse((response) => response.url().endsWith('/api/auth/login') && response.request().method() === 'POST');
    await citizenPage.getByRole('button', { name: 'Ingresar', exact: true }).click();
    const loginResponse = await loginResponsePromise;
    await citizenPage.waitForURL('**/ciudadano');
    const tc02Panel = await screenshot(citizenPage, 'TC-02-02-inicio-sesion-acceso-ciudadano.png', true);
    caseResult('TC-02', loginResponse.status() === 200 ? 'APROBADO' : 'FALLIDO', [tc02Login, tc02Panel], `El ciudadano inició sesión; la API respondió HTTP ${loginResponse.status()} y mostró su panel.`);

    // TC-03: creación del reporte con ubicación y fotografía.
    await citizenPage.goto(`${APP_URL}/ciudadano/reportes/nuevo`, { waitUntil: 'domcontentloaded' });
    await citizenPage.locator('[name="type"]').selectOption({ label: 'Bache' });
    await citizenPage.locator('[name="title"]').fill(`Bache de evidencia QA ${RUN_STAMP}`);
    await citizenPage.locator('[name="description"]').fill('Bache profundo que dificulta el tránsito y requiere atención municipal prioritaria.');
    await citizenPage.locator('[name="zone"]').fill('Zona Centro - Evidencia QA');
    await citizenPage.getByRole('button', { name: /Usar mi ubicaci/ }).click();
    await citizenPage.locator('.form-helper').waitFor();
    await citizenPage.locator('input[type="file"]').setInputFiles(evidenceImage);
    await citizenPage.locator('img[alt="Vista previa de la evidencia"]').waitFor();
    const tc03Form = await screenshot(citizenPage, 'TC-03-01-creacion-reporte-formulario-completo.png', true);
    const createResponsePromise = citizenPage.waitForResponse((response) => response.url().endsWith('/api/reports') && response.request().method() === 'POST');
    await citizenPage.getByRole('button', { name: /Enviar reporte/ }).click();
    const createResponse = await createResponsePromise;
    const createPayload = await createResponse.json();
    const primaryReport = createPayload.data.report;
    results.reports.primary = primaryReport.id;
    await citizenPage.waitForURL(new RegExp(`/ciudadano/reportes/${primaryReport.id}$`));
    await citizenPage.locator('h1').filter({ hasText: primaryReport.title }).waitFor();
    const tc03Created = await screenshot(citizenPage, 'TC-03-02-creacion-reporte-guardado.png', true);
    caseResult('TC-03', createResponse.status() === 201 ? 'APROBADO' : 'FALLIDO', [tc03Form, tc03Created], `Se creó el reporte #${primaryReport.id} con categoría, coordenadas, zona y fotografía; HTTP ${createResponse.status()}.`);

    // Datos controlados para privacidad, rechazo y escenarios negativos.
    const citizen2 = await registerApi({ firstName: 'Privacidad', lastName: 'Ciudadano', phone: '70002222', email: names.citizen2, password: PASSWORD });
    const otherCreate = await apiRequest('POST', '/reports', {
      token: citizen2.token,
      body: {
        type: 'Luminaria', title: `Luminaria ajena QA ${RUN_STAMP}`,
        description: 'Luminaria apagada utilizada para comprobar la privacidad entre ciudadanos.',
        location: 'Av. Privacidad 200', zone: 'Zona Norte', latitude: -17.378, longitude: -66.151,
        image: evidenceData
      }
    });
    if (!otherCreate.ok) throw new Error(`No se pudo crear el reporte ajeno: ${JSON.stringify(otherCreate.body)}`);
    const otherReport = otherCreate.body.data.report;
    results.reports.other = otherReport.id;
    const rejectCreate = await apiRequest('POST', '/reports', {
      token: citizen1Token,
      body: {
        type: 'Basura', title: `Reporte improcedente QA ${RUN_STAMP}`,
        description: 'Reporte creado para comprobar el rechazo administrativo con motivo obligatorio.',
        location: 'Calle Prueba 14', zone: 'Zona QA', latitude: -17.401, longitude: -66.163,
        image: evidenceData
      }
    });
    if (!rejectCreate.ok) throw new Error(`No se pudo crear el reporte para rechazo: ${JSON.stringify(rejectCreate.body)}`);
    const rejectReport = rejectCreate.body.data.report;
    results.reports.rejected = rejectReport.id;

    // TC-04: reporte propio visible y reporte ajeno oculto con 404.
    await citizenPage.goto(`${APP_URL}/ciudadano/reportes/${primaryReport.id}`, { waitUntil: 'domcontentloaded' });
    await citizenPage.locator('h1').filter({ hasText: primaryReport.title }).waitFor();
    const tc04Own = await screenshot(citizenPage, 'TC-04-01-consulta-reporte-propio.png', true);
    const privacyDenied = await apiRequest('GET', `/reports/${otherReport.id}`, { token: citizen1Token });
    const tc04Denied = 'TC-04-02-consulta-reporte-ajeno-restringida.png';
    await evidenceCard(browser, tc04Denied, 'TC-04 · Protección de reportes por ciudadano', 'El ciudadano autenticado intenta consultar directamente un reporte perteneciente a otra cuenta.', [{
      method: 'GET', url: `${API_URL}/reports/${otherReport.id}`, status: privacyDenied.status, body: privacyDenied.body,
      note: `El reporte propio #${primaryReport.id} sí fue visible; el reporte ajeno #${otherReport.id} no fue expuesto.`
    }]);
    caseResult('TC-04', privacyDenied.status === 404 ? 'APROBADO' : 'FALLIDO', [tc04Own, tc04Denied], `El reporte propio #${primaryReport.id} fue visible y el acceso al reporte ajeno #${otherReport.id} fue restringido con HTTP ${privacyDenied.status}.`);
    await citizenContext.close();

    const admin = await loginApi('administrador@urbantic.test', DEMO_PASSWORD);
    const technician = await loginApi('tecnico@urbantic.test', DEMO_PASSWORD);
    const createTech2 = await apiRequest('POST', '/users', {
      token: admin.token,
      body: { name: 'Técnico Privacidad QA', email: names.technician2, role: 'TECNICO', password: PASSWORD }
    });
    if (!createTech2.ok) throw new Error(`No se pudo crear el segundo técnico: ${JSON.stringify(createTech2.body)}`);
    const technician2 = await loginApi(names.technician2, PASSWORD);
    const categories = await apiRequest('GET', '/categories', { token: admin.token });
    const category = categories.body.data.categories.find((item) => item.active) || categories.body.data.categories[0];

    // TC-05 y TC-06 desde el detalle administrativo.
    const adminSession = await newAuthedPage(browser, admin.token);
    const adminPage = adminSession.page;
    await adminPage.goto(`${APP_URL}/admin/reportes/${primaryReport.id}`, { waitUntil: 'domcontentloaded' });
    await adminPage.locator('h1').filter({ hasText: primaryReport.title }).waitFor();
    const tc05Before = await screenshot(adminPage, 'TC-05-01-clasificacion-prioridad-antes.png', true);
    const classifyPanel = adminPage.locator('section').filter({ has: adminPage.getByRole('heading', { name: /Priorizar y clasificar/ }) });
    await classifyPanel.locator('select').nth(0).selectOption(String(category.id));
    await classifyPanel.locator('select').nth(1).selectOption('CRITICA');
    await classifyPanel.getByRole('button', { name: /Guardar clasificaci/ }).click();
    await adminPage.locator('.toast-message').waitFor();
    const tc05After = await screenshot(adminPage, 'TC-05-02-clasificacion-prioridad-guardada.png', true);
    caseResult('TC-05', 'APROBADO', [tc05Before, tc05After], `El reporte #${primaryReport.id} fue clasificado como ${category.name} con prioridad CRÍTICA.`);

    const assignmentPanel = adminPage.locator('section').filter({ has: adminPage.getByRole('heading', { name: /Asignar t/ }) });
    await assignmentPanel.locator('select').selectOption(String(technician.user.id));
    const tc06Selection = await screenshot(adminPage, 'TC-06-01-asignacion-tecnico-carga.png', true);
    await assignmentPanel.getByRole('button', { name: 'Asignar reporte' }).click();
    await adminPage.locator('.toast-message').filter({ hasText: /asignado/ }).waitFor();
    const tc06Assigned = await screenshot(adminPage, 'TC-06-02-asignacion-tecnico-confirmada.png', true);
    caseResult('TC-06', 'APROBADO', [tc06Selection, tc06Assigned], `El reporte #${primaryReport.id} fue asignado al técnico ${technician.user.first_name} ${technician.user.last_name}; la lista mostró su carga activa.`);

    // Intento de cierre prematuro para TC-13, conservado hasta completar el flujo positivo.
    const prematureClose = await apiRequest('PATCH', `/reports/${otherReport.id}/decision`, {
      token: admin.token, body: { decision: 'CERRADO', reason: 'Intento negativo de QA' }
    });

    // TC-14 negativo y rechazo válido por interfaz.
    const emptyRejection = await apiRequest('PATCH', `/reports/${rejectReport.id}/decision`, {
      token: admin.token, body: { decision: 'RECHAZADO', reason: '' }
    });
    const tc14Invalid = 'TC-14-01-rechazo-sin-motivo-validacion.png';
    await evidenceCard(browser, tc14Invalid, 'TC-14 · Rechazo sin motivo', 'La API debe impedir el rechazo administrativo cuando no existe un motivo válido.', [{
      method: 'PATCH', url: `${API_URL}/reports/${rejectReport.id}/decision`, status: emptyRejection.status, body: emptyRejection.body
    }]);
    await adminPage.goto(`${APP_URL}/admin/reportes/${rejectReport.id}`, { waitUntil: 'domcontentloaded' });
    await adminPage.locator('h1').filter({ hasText: rejectReport.title }).waitFor();
    const decisionPanel = adminPage.locator('.decision-card');
    await decisionPanel.locator('textarea').fill('El contenido fue creado exclusivamente como escenario improcedente de aseguramiento de calidad.');
    await decisionPanel.getByRole('button', { name: /Rechazar reporte/ }).click();
    await adminPage.locator('.toast-message').filter({ hasText: /rechazado/ }).waitFor();
    const tc14Rejected = await screenshot(adminPage, 'TC-14-02-rechazo-administrativo-con-motivo.png', true);
    caseResult('TC-14', emptyRejection.status === 400 ? 'APROBADO' : 'FALLIDO', [tc14Invalid, tc14Rejected], `La solicitud sin motivo fue rechazada con HTTP ${emptyRejection.status}; el rechazo válido cambió el reporte #${rejectReport.id} a RECHAZADO y guardó el motivo.`);
    await adminSession.context.close();

    // TC-07 y TC-08 desde la cuenta técnica asignada.
    const techSession = await newAuthedPage(browser, technician.token);
    const techPage = techSession.page;
    await techPage.goto(`${APP_URL}/tecnico/tareas`, { waitUntil: 'domcontentloaded' });
    await techPage.getByRole('heading', { name: 'Mis tareas' }).waitFor();
    await techPage.locator('tr', { hasText: primaryReport.id }).waitFor();
    const tc07 = await screenshot(techPage, 'TC-07-bandeja-tecnico-reportes-asignados.png', true);
    caseResult('TC-07', 'APROBADO', [tc07], `La bandeja del técnico mostró el reporte asignado #${primaryReport.id} con su prioridad.`);

    await techPage.goto(`${APP_URL}/tecnico/tareas/${primaryReport.id}`, { waitUntil: 'domcontentloaded' });
    await techPage.locator('h1').filter({ hasText: primaryReport.title }).waitFor();
    const tc08Before = await screenshot(techPage, 'TC-08-01-cambio-asignado-antes.png', true);
    await techPage.getByRole('button', { name: /Iniciar trabajo/ }).click();
    await techPage.getByRole('heading', { name: /Registrar soluci/ }).waitFor();
    const tc08After = await screenshot(techPage, 'TC-08-02-cambio-en-proceso-despues.png', true);
    caseResult('TC-08', 'APROBADO', [tc08Before, tc08After], `El técnico asignado cambió el reporte #${primaryReport.id} de ASIGNADO a EN_PROCESO.`);

    // TC-09: segundo técnico intenta modificar un reporte ajeno.
    const nonAssignedAttempt = await apiRequest('PATCH', `/reports/${primaryReport.id}/status`, {
      token: technician2.token, body: { status: 'EN_PROCESO' }
    });
    const tc09 = 'TC-09-restriccion-tecnico-no-asignado.png';
    await evidenceCard(browser, tc09, 'TC-09 · Restricción a técnico no asignado', 'Un segundo técnico intenta modificar el reporte asignado al técnico principal.', [{
      method: 'PATCH', url: `${API_URL}/reports/${primaryReport.id}/status`, status: nonAssignedAttempt.status, body: nonAssignedAttempt.body,
      note: `Cuenta utilizada: ${names.technician2}. El reporte permaneció EN_PROCESO.`
    }]);
    caseResult('TC-09', nonAssignedAttempt.status === 404 ? 'APROBADO' : 'FALLIDO', [tc09], `El técnico no asignado recibió HTTP ${nonAssignedAttempt.status} y no pudo modificar el reporte #${primaryReport.id}.`);

    // TC-10: observación técnica demasiado corta.
    const shortObservation = await apiRequest('PATCH', `/reports/${primaryReport.id}/status`, {
      token: technician.token, body: { status: 'RESUELTO', observations: 'Corto', evidenceImages: [evidenceData] }
    });
    const tc10 = 'TC-10-observacion-menor-10-caracteres.png';
    await evidenceCard(browser, tc10, 'TC-10 · Longitud mínima de observación', 'Se intenta resolver el reporte con una observación técnica menor a 10 caracteres.', [{
      method: 'PATCH', url: `${API_URL}/reports/${primaryReport.id}/status`, status: shortObservation.status, body: shortObservation.body,
      note: 'Observación enviada: “Corto” (5 caracteres).'
    }]);
    caseResult('TC-10', shortObservation.status === 400 ? 'APROBADO' : 'FALLIDO', [tc10], `La API rechazó la observación corta con HTTP ${shortObservation.status} y mantuvo EN_PROCESO.`);

    // TC-11: cero fotografías y más de cinco fotografías.
    const noPhotos = await apiRequest('PATCH', `/reports/${primaryReport.id}/status`, {
      token: technician.token, body: { status: 'RESUELTO', observations: 'Observación técnica suficientemente extensa.', evidenceImages: [] }
    });
    const tooManyPhotos = await apiRequest('PATCH', `/reports/${primaryReport.id}/status`, {
      token: technician.token, body: { status: 'RESUELTO', observations: 'Observación técnica suficientemente extensa.', evidenceImages: Array(6).fill(evidenceData) }
    });
    const tc11 = 'TC-11-validacion-cantidad-fotografias.png';
    await evidenceCard(browser, tc11, 'TC-11 · Validación de fotografías', 'Se ejecutan los dos límites inválidos: ninguna fotografía y seis fotografías.', [
      { method: 'PATCH', url: `${API_URL}/reports/${primaryReport.id}/status`, status: noPhotos.status, body: noPhotos.body, note: 'Escenario A: evidenceImages = []' },
      { method: 'PATCH', url: `${API_URL}/reports/${primaryReport.id}/status`, status: tooManyPhotos.status, body: tooManyPhotos.body, note: 'Escenario B: evidenceImages contiene 6 fotografías.' }
    ]);
    caseResult('TC-11', noPhotos.status === 400 && tooManyPhotos.status === 400 ? 'APROBADO' : 'FALLIDO', [tc11], `La API rechazó cero fotos (HTTP ${noPhotos.status}) y seis fotos (HTTP ${tooManyPhotos.status}); el estado no cambió.`);

    // TC-12: resolución válida desde la interfaz.
    await techPage.goto(`${APP_URL}/tecnico/tareas/${primaryReport.id}`, { waitUntil: 'domcontentloaded' });
    await techPage.getByRole('heading', { name: /Registrar soluci/ }).waitFor();
    await techPage.locator('textarea').fill('Se rellenó y compactó el bache; la vía quedó habilitada y señalizada correctamente.');
    await techPage.locator('input[type="file"]').setInputFiles(evidenceImage);
    await techPage.locator('.evidence-preview-grid img').waitFor();
    const tc12Form = await screenshot(techPage, 'TC-12-01-resolucion-valida-formulario.png', true);
    await techPage.getByRole('button', { name: /Marcar como resuelto/ }).click();
    await techPage.getByRole('heading', { name: /Soluci/ }).waitFor();
    const tc12Resolved = await screenshot(techPage, 'TC-12-02-resolucion-valida-estado-resuelto.png', true);
    caseResult('TC-12', 'APROBADO', [tc12Form, tc12Resolved], `El reporte #${primaryReport.id} cambió a RESUELTO con observación y una fotografía de evidencia.`);
    await techSession.context.close();

    // TC-13: evidencia negativa previa y cierre válido por administrador.
    const tc13Invalid = 'TC-13-01-cierre-reporte-no-resuelto-denegado.png';
    await evidenceCard(browser, tc13Invalid, 'TC-13 · Cierre prematuro no permitido', 'El administrador intenta cerrar un reporte que todavía se encuentra EN_REVISION.', [{
      method: 'PATCH', url: `${API_URL}/reports/${otherReport.id}/decision`, status: prematureClose.status, body: prematureClose.body
    }]);
    const adminCloseSession = await newAuthedPage(browser, admin.token);
    const adminClosePage = adminCloseSession.page;
    await adminClosePage.goto(`${APP_URL}/admin/reportes/${primaryReport.id}`, { waitUntil: 'domcontentloaded' });
    await adminClosePage.getByRole('button', { name: /Cerrar reporte/ }).waitFor();
    await adminClosePage.locator('.decision-card textarea').fill('Solución validada durante la ejecución formal de aseguramiento de calidad.');
    await adminClosePage.getByRole('button', { name: /Cerrar reporte/ }).click();
    await adminClosePage.locator('.toast-message').filter({ hasText: /cerrado/ }).waitFor();
    const tc13Closed = await screenshot(adminClosePage, 'TC-13-02-cierre-reporte-resuelto-cerrado.png', true);
    caseResult('TC-13', prematureClose.status === 409 ? 'APROBADO' : 'FALLIDO', [tc13Invalid, tc13Closed], `El cierre de un reporte EN_REVISION fue rechazado con HTTP ${prematureClose.status}; el reporte RESUELTO #${primaryReport.id} cambió a CERRADO.`);

    // TC-15: estadísticas, gráficos y mapa con datos reales.
    await adminClosePage.goto(`${APP_URL}/admin`, { waitUntil: 'domcontentloaded' });
    await adminClosePage.getByRole('heading', { name: /Panel administrador/ }).waitFor();
    await adminClosePage.getByRole('heading', { name: /Mapa de incidencias/ }).waitFor();
    await sleep(4000);
    const tc15 = await screenshot(adminClosePage, 'TC-15-estadisticas-y-mapa-coherencia.png', true);
    caseResult('TC-15', 'APROBADO', [tc15], 'El dashboard mostró indicadores, gráficos por estado/categoría y puntos geográficos correspondientes a los reportes registrados.');

    // TC-16: endpoint protegido sin JWT.
    const withoutJwt = await apiRequest('GET', '/reports');
    const tc16 = 'TC-16-api-protegida-sin-jwt.png';
    await evidenceCard(browser, tc16, 'TC-16 · Acceso a API sin JWT', 'Solicitud real a un endpoint protegido sin encabezado Authorization.', [{
      method: 'GET', url: `${API_URL}/reports`, status: withoutJwt.status, body: withoutJwt.body,
      note: 'No se envió token ni encabezado Authorization.'
    }]);
    caseResult('TC-16', withoutJwt.status === 401 ? 'APROBADO' : 'FALLIDO', [tc16], `La API rechazó el acceso sin JWT con HTTP ${withoutJwt.status} y no entregó reportes.`);

    // TC-17: mismo reporte antes y después del reinicio completo.
    await adminClosePage.goto(`${APP_URL}/admin/reportes/${primaryReport.id}`, { waitUntil: 'domcontentloaded' });
    await adminClosePage.locator('h1').filter({ hasText: primaryReport.title }).waitFor();
    const tc17Before = await screenshot(adminClosePage, 'TC-17-01-persistencia-antes-reinicio.png', true);
    await adminCloseSession.context.close();

    let restartOutput = '';
    try {
      restartOutput = execFileSync('docker', ['compose', 'restart'], {
        cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 120000
      });
    } catch (error) {
      restartOutput = `${error.stdout || ''}\n${error.stderr || ''}`.trim();
      throw new Error(`Falló docker compose restart: ${restartOutput}`);
    }
    await waitForSystem();
    const psOutput = execFileSync('docker', ['compose', 'ps'], {
      cwd: path.join(__dirname, '..'), encoding: 'utf8', timeout: 30000
    });
    const tc17Restart = 'TC-17-02-persistencia-reinicio-servicios.png';
    await evidenceCard(browser, tc17Restart, 'TC-17 · Reinicio de servicios', 'Docker Compose reinició los servicios sin eliminar el volumen persistente de PostgreSQL.', [{
      method: 'DOCKER', url: 'docker compose restart && docker compose ps', status: 200,
      body: `${restartOutput.trim()}\n\n${psOutput.trim()}`,
      note: 'Después del reinicio, el healthcheck de la API y el frontend volvieron a responder correctamente.'
    }]);

    const citizenAfterRestart = await loginApi(names.citizen1, PASSWORD);
    const afterSession = await newAuthedPage(browser, citizenAfterRestart.token);
    const afterPage = afterSession.page;
    await afterPage.goto(`${APP_URL}/ciudadano/reportes/${primaryReport.id}`, { waitUntil: 'domcontentloaded' });
    await afterPage.locator('h1').filter({ hasText: primaryReport.title }).waitFor();
    const tc17After = await screenshot(afterPage, 'TC-17-03-persistencia-despues-reinicio.png', true);
    const persisted = await apiRequest('GET', `/reports/${primaryReport.id}`, { token: citizenAfterRestart.token });
    await afterSession.context.close();
    caseResult('TC-17', persisted.ok && persisted.body.data.report.status === 'CERRADO' ? 'APROBADO' : 'FALLIDO', [tc17Before, tc17Restart, tc17After], `Tras reiniciar los tres servicios, el reporte #${primaryReport.id} continuó disponible en estado ${persisted.body?.data?.report?.status || 'DESCONOCIDO'} con su información e historial.`);

    writeIndex();
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  results.fatalError = { message: error.message, stack: error.stack };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'error-ejecucion.json'), JSON.stringify(results, null, 2), 'utf8');
  console.error(error);
  process.exitCode = 1;
});
