import Icon from '../ui/Icon.jsx';
import ReportVisual from './ReportVisual.jsx';

function formatDate(value) {
  if (!value) return 'Pendiente';
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export default function ReportEvidence({ report }) {
  const evidenceImages = report.evidenceImages?.length
    ? report.evidenceImages
    : (report.evidence ? [report.evidence] : []);
  const isFinished = ['RESUELTO', 'CERRADO'].includes(report.status);

  return (
    <section className="evidence-comparison" aria-labelledby="evidence-title">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Evidencia fotográfica</span>
          <h2 id="evidence-title">Antes y después</h2>
        </div>
        {report.status === 'CERRADO' && <span className="closed-stamp"><Icon name="check" size={15} /> Reporte cerrado</span>}
      </div>

      <div className="comparison-grid">
        <article className="evidence-stage evidence-before">
          <header><span>Antes</span><small>Problema reportado</small></header>
          <div className="evidence-media"><ReportVisual report={report} large /></div>
          <p>{report.description}</p>
        </article>

        <article className={`evidence-stage evidence-after ${!evidenceImages.length ? 'is-pending' : ''}`}>
          <header><span>Después</span><small>{evidenceImages.length ? 'Solución realizada' : 'Evidencia pendiente'}</small></header>
          {evidenceImages.length ? (
            <div className="solution-gallery">
              {evidenceImages.map((image, index) => (
                <a href={image} target="_blank" rel="noreferrer" key={`${report.id}-solution-${index}`} title="Abrir imagen en tamaño completo">
                  <img src={image} alt={`Solución del reporte, fotografía ${index + 1}`} />
                  <span>Abrir imagen</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="evidence-placeholder"><Icon name="camera" size={30} /><span>{isFinished ? 'No hay una imagen disponible.' : 'Aparecerá cuando el técnico termine el trabajo.'}</span></div>
          )}
          {report.observations && <p><strong>Solución:</strong> {report.observations}</p>}
        </article>
      </div>

      {isFinished && (
        <dl className="resolution-meta">
          <div><dt>Técnico responsable</dt><dd>{report.technicianName || 'No disponible'}</dd></div>
          <div><dt>Fecha de solución</dt><dd>{formatDate(report.resolvedAt)}</dd></div>
          <div><dt>Estado final</dt><dd>{report.status === 'CERRADO' ? 'Cerrado' : 'Terminado'}</dd></div>
        </dl>
      )}
    </section>
  );
}
