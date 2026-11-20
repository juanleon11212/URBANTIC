import Icon from '../ui/Icon.jsx';

const steps = [
  { status: 'CREADO', label: 'Creado' },
  { status: 'EN_REVISION', label: 'En revisión' },
  { status: 'ASIGNADO', label: 'Asignado' },
  { status: 'EN_PROCESO', label: 'En proceso' },
  { status: 'RESUELTO', label: 'Terminado' },
  { status: 'CERRADO', label: 'Cerrado' }
];

function formatHistoryDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export default function ReportTimeline({ status, date, history = [] }) {
  if (status === 'RECHAZADO') {
    const rejectedEvent = [...history].reverse().find((event) => event.status === 'RECHAZADO');
    return (
      <section className="tracking-section rejected-tracking">
        <span className="timeline-dot rejected-dot"><Icon name="close" size={13} /></span>
        <div><span className="eyebrow">Proceso concluido</span><h2>Reporte rechazado</h2><p>{rejectedEvent?.observation || 'El administrador determinó que la incidencia no corresponde o es improcedente.'}</p></div>
      </section>
    );
  }

  const currentIndex = Math.max(steps.findIndex((step) => step.status === status), 0);
  const historyByStatus = history.reduce((result, event) => ({ ...result, [event.status]: event }), {});

  return (
    <section className="tracking-section">
      <div className="section-heading compact"><div><span className="eyebrow">Historial de estados</span><h2>Seguimiento del reporte</h2></div></div>
      <div className="timeline">
        {steps.map((step, index) => {
          const event = historyByStatus[step.status];
          return (
            <div className={`timeline-step ${index <= currentIndex ? 'complete' : ''} ${index === currentIndex ? 'current' : ''}`} key={step.status}>
              <span className="timeline-dot">{index < currentIndex ? <Icon name="check" size={12} /> : index + 1}</span>
              <span className="timeline-label">{step.label}</span>
              <small>{event ? formatHistoryDate(event.createdAt) : (index === 0 ? date : '')}</small>
              {event?.changedBy && <small className="timeline-actor">{event.changedBy}</small>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
