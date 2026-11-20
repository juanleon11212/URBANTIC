import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useReports } from '../../context/ReportsContext.jsx';
import ReportTable from '../../components/reports/ReportTable.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { getReportCreationDate, sortCitizenReports } from '../../data/reportData.js';

export default function ReportsCiudadano() {
  const { user } = useAuth();
  const { reports } = useReports();
  const [scope, setScope] = useState('TODOS');
  const [status, setStatus] = useState('TODOS');
  const [createdDate, setCreatedDate] = useState('');
  const [search, setSearch] = useState('');

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matchingReports = reports.filter((report) => {
      const matchesScope = scope === 'TODOS' || Number(report.citizenId) === Number(user.id);
      const matchesStatus = status === 'TODOS' || report.status === status;
      const matchesCreatedDate = !createdDate || getReportCreationDate(report) === createdDate;
      const matchesSearch = !term || `${report.id} ${report.title} ${report.type} ${report.location} ${report.zone || ''}`.toLowerCase().includes(term);
      return matchesScope && matchesStatus && matchesCreatedDate && matchesSearch;
    });
    return sortCitizenReports(matchingReports);
  }, [createdDate, reports, scope, search, status, user.id]);

  return (
    <section className="surface-card page-card">
      <PageHeader
        eyebrow="Participación ciudadana"
        title="Reportes ciudadanos"
        description="Los reportes se agrupan por su estado de atención y los finalizados quedan al final."
        action={(
          <Link className="button button-primary" to="/ciudadano/reportes/nuevo">
            <Icon name="add" size={17} /> Nuevo reporte
          </Link>
        )}
      />

      <div className="filter-bar citizen-report-filters">
        <label>
          Mostrar
          <select value={scope} onChange={(event) => setScope(event.target.value)}>
            <option value="TODOS">Todos los ciudadanos</option>
            <option value="MIOS">Sólo mis reportes</option>
          </select>
        </label>
        <label>
          Estado
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="TODOS">Todos los estados</option>
            <option value="EN_REVISION">En revisión</option>
            <option value="ASIGNADO">Asignado</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="RESUELTO">Terminado</option>
            <option value="CERRADO">Cerrado</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
        </label>
        <label>Fecha de creación
          <input type="date" value={createdDate} onChange={(event) => setCreatedDate(event.target.value)} />
        </label>
        <label className="search-field">Buscar
          <span><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Código, título o ubicación..." /></span>
        </label>
        <span className="result-count">{filteredReports.length} resultado{filteredReports.length === 1 ? '' : 's'}</span>
      </div>

      <ReportTable
        reports={filteredReports}
        getViewPath={(report) => `/ciudadano/reportes/${report.id}`}
        emptyMessage="No hay reportes que coincidan con los filtros seleccionados."
      />
    </section>
  );
}
