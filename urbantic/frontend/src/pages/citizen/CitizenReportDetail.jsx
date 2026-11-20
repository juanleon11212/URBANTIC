import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useReports } from '../../context/ReportsContext.jsx';
import ReportSummary from '../../components/reports/ReportSummary.jsx';
import ReportEvidence from '../../components/reports/ReportEvidence.jsx';
import ReportTimeline from '../../components/reports/ReportTimeline.jsx';
import Icon from '../../components/ui/Icon.jsx';

export default function CitizenReportDetail() {
  const { id } = useParams();
  const { getReport, fetchReport, loading } = useReports();
  const report = getReport(id);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    fetchReport(id).catch((apiError) => {
      setDetailError(apiError.response?.data?.message || 'No se pudo actualizar el detalle del reporte.');
    });
  }, [id]);

  if (loading && !report) return <div className="screen-message inline-screen">Cargando reporte...</div>;
  if (!report) return <Navigate to="/ciudadano/reportes" replace />;

  return (
    <div className="page-stack">
      <Link className="back-link" to="/ciudadano/reportes">← Volver a reportes ciudadanos</Link>
      {detailError && <p className="form-error panel-error">{detailError}</p>}
      <section className="surface-card detail-card">
        <ReportSummary report={report} />
        <ReportEvidence report={report} />
        <ReportTimeline status={report.status} date={report.date} history={report.history} />
        {report.observations && !['RESUELTO', 'CERRADO'].includes(report.status) && (
          <div className="observation-card"><Icon name="reports" /><div><strong>Última actualización</strong><p>{report.observations}</p></div></div>
        )}
      </section>
    </div>
  );
}
