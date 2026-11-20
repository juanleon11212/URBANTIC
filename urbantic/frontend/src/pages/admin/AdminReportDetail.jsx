import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useReports } from '../../context/ReportsContext.jsx';
import { REPORT_PRIORITIES } from '../../data/reportData.js';
import * as usersApi from '../../api/users.api.js';
import * as categoriesApi from '../../api/categories.api.js';
import ReportSummary from '../../components/reports/ReportSummary.jsx';
import ReportEvidence from '../../components/reports/ReportEvidence.jsx';
import ReportTimeline from '../../components/reports/ReportTimeline.jsx';
import Icon from '../../components/ui/Icon.jsx';

export default function AdminReportDetail() {
  const { id } = useParams();
  const { getReport, fetchReport, assignReport, classifyReport, decideReport, loading } = useReports();
  const report = getReport(id);
  const [technician, setTechnician] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState('MEDIA');
  const [reason, setReason] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([usersApi.listTechnicians(), categoriesApi.list()])
      .then(([technicianList, categoryList]) => {
        setTechnicians(technicianList);
        setCategories(categoryList);
      })
      .catch(() => setError('No se pudieron cargar los datos de gestión.'));
    fetchReport(id).catch((apiError) => {
      setError(apiError.response?.data?.message || 'No se pudo actualizar el detalle del reporte.');
    });
  }, [id]);

  useEffect(() => {
    if (!report) return;
    setTechnician(report.assignedTo || '');
    setCategoryId(report.categoryId || '');
    setPriority(report.priority || 'MEDIA');
  }, [report?.id, report?.assignedTo, report?.categoryId, report?.priority]);

  if (loading && !report) return <div className="screen-message inline-screen">Cargando reporte...</div>;
  if (!report) return <Navigate to="/admin/reportes" replace />;

  const canClassify = ['CREADO', 'EN_REVISION'].includes(report.status);
  const canAssign = ['CREADO', 'EN_REVISION', 'ASIGNADO'].includes(report.status);
  const canReject = ['CREADO', 'EN_REVISION'].includes(report.status);
  const canClose = report.status === 'RESUELTO';
  const evidenceImages = report.evidenceImages?.length ? report.evidenceImages : (report.evidence ? [report.evidence] : []);
  const closeRequirementsMet = evidenceImages.length > 0 && Boolean(report.observations && report.technicianName && report.resolvedAt);

  function beginAction() {
    setSaving(true);
    setError('');
    setMessage('');
  }

  async function saveClassification() {
    if (!categoryId) return;
    beginAction();
    try {
      await classifyReport(report.id, { categoryId: Number(categoryId), priority });
      setMessage('Categoría y prioridad actualizadas. El reporte quedó en revisión.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'No se pudo clasificar el reporte.');
    } finally {
      setSaving(false);
    }
  }

  async function assignTechnician() {
    if (!technician) return;
    beginAction();
    try {
      const updated = await assignReport(report.id, technician);
      setMessage(`Reporte asignado a ${updated.technicianName}.`);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'No se pudo asignar el técnico.');
    } finally {
      setSaving(false);
    }
  }

  async function registerDecision(decision) {
    beginAction();
    try {
      await decideReport(report.id, { decision, reason });
      setReason('');
      setMessage(decision === 'CERRADO' ? 'Reporte cerrado correctamente.' : 'Reporte rechazado con el motivo indicado.');
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'No se pudo registrar la decisión.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <Link className="back-link" to="/admin/reportes">← Volver a reportes</Link>
      <div className="admin-detail-grid">
        <section className="surface-card detail-card">
          <ReportSummary report={report} />
          <ReportEvidence report={report} />
          <ReportTimeline status={report.status} date={report.date} history={report.history} />
        </section>

        <aside className="action-panel">
          <section className="surface-card compact-card">
            <span className="panel-icon"><Icon name="categories" /></span>
            <h2>Priorizar y clasificar</h2>
            <p>Confirma la categoría y define la urgencia antes de asignar.</p>
            <label>Categoría
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={!canClassify}>
                <option value="">Seleccionar categoría</option>
                {categories.filter((item) => item.active).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>Prioridad
              <select value={priority} onChange={(event) => setPriority(event.target.value)} disabled={!canClassify}>
                {Object.entries(REPORT_PRIORITIES).map(([value, item]) => <option value={value} key={value}>{item.label}</option>)}
              </select>
            </label>
            <button className="button button-primary button-full" type="button" onClick={saveClassification} disabled={!canClassify || !categoryId || saving}>Guardar clasificación</button>
            {!canClassify && <small className="locked-helper">La clasificación se bloquea después de asignar.</small>}
          </section>

          <section className="surface-card compact-card">
            <span className="panel-icon orange"><Icon name="user" /></span>
            <h2>Asignar técnico</h2>
            <p>La carga activa ayuda a distribuir el trabajo de forma equilibrada.</p>
            <label>Técnico
              <select value={technician} onChange={(event) => setTechnician(event.target.value)} disabled={!canAssign}>
                <option value="">Seleccionar técnico</option>
                {technicians.map((item) => (
                  <option value={item.id} key={item.id}>{item.name} · {item.workload} activa{item.workload === 1 ? '' : 's'}</option>
                ))}
              </select>
            </label>
            <button className="button button-dark button-full" type="button" onClick={assignTechnician} disabled={!canAssign || !technician || saving}>Asignar reporte</button>
          </section>

          {(canClose || canReject) && (
            <section className="surface-card compact-card decision-card">
              <span className="panel-icon decision-icon"><Icon name={canClose ? 'check' : 'alert'} /></span>
              <h2>{canClose ? 'Validar solución' : 'Revisar procedencia'}</h2>
              <p>{canClose ? 'Verifica la evidencia, descripción, fecha y técnico responsable antes de cerrar.' : 'Si el reporte es improcedente, registra un motivo claro.'}</p>
              <label>{canClose ? 'Nota de validación (opcional)' : 'Motivo del rechazo'}
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows="3" placeholder={canClose ? 'La solución fue verificada...' : 'Explica por qué no corresponde atenderlo...'} />
              </label>
              {canClose && !closeRequirementsMet && <p className="form-error">No se puede cerrar: falta evidencia, descripción, fecha o técnico responsable.</p>}
              {canClose && <button className="button button-success button-full" type="button" onClick={() => registerDecision('CERRADO')} disabled={saving || !closeRequirementsMet}><Icon name="check" size={17} /> Cerrar reporte</button>}
              {canReject && <button className="button button-danger button-full" type="button" onClick={() => registerDecision('RECHAZADO')} disabled={saving || reason.trim().length < 5}><Icon name="close" size={17} /> Rechazar reporte</button>}
            </section>
          )}

          {message && <p className="toast-message"><Icon name="check" size={16} /> {message}</p>}
          {error && <p className="form-error panel-error">{error}</p>}
        </aside>
      </div>
    </div>
  );
}
