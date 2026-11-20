import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useReports } from '../../context/ReportsContext.jsx';
import ReportTable from '../../components/reports/ReportTable.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Icon from '../../components/ui/Icon.jsx';

export default function DashboardCiudadano() {
  const { user } = useAuth();
  const { reports } = useReports();
  const ownReports = reports.filter((report) => Number(report.citizenId) === Number(user.id));
  const recentCitizenReports = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="page-stack">
      <section className="hero-card citizen-hero">
        <div>
          <span className="eyebrow">Panel ciudadano</span>
          <h1>Hola, {user.first_name}</h1>
          <p>Conoce lo que ocurre en la ciudad y reporta los problemas de tu zona.</p>
        </div>
        <Link className="button button-primary" to="/ciudadano/reportes/nuevo">
          <Icon name="add" size={18} /> Nuevo reporte
        </Link>
      </section>

      <section className="stats-grid stats-grid-4" aria-label="Resumen de reportes">
        <StatCard value={reports.length} label="Reportes ciudadanos" tone="blue" icon="users" />
        <StatCard value={ownReports.length} label="Mis reportes" tone="blue" icon="reports" />
        <StatCard value={ownReports.filter((report) => ['EN_REVISION', 'ASIGNADO', 'EN_PROCESO'].includes(report.status)).length} label="En seguimiento" tone="orange" icon="clock" />
        <StatCard value={ownReports.filter((report) => ['RESUELTO', 'CERRADO'].includes(report.status)).length} label="Terminados" tone="green" icon="check" />
      </section>

      <section className="surface-card">
        <PageHeader
          eyebrow="Actividad ciudadana"
          title="Reportes recientes de la comunidad"
          description="Consulta las incidencias registradas por otros ciudadanos y conoce su estado actual."
          action={<Link className="text-link" to="/ciudadano/reportes">Ver todos <Icon name="arrow" size={15} /></Link>}
        />
        <ReportTable
          reports={recentCitizenReports.slice(0, 6)}
          getViewPath={(report) => `/ciudadano/reportes/${report.id}`}
          emptyMessage="Todavía no existen reportes ciudadanos. Sé el primero en registrar uno."
        />
      </section>
    </div>
  );
}
