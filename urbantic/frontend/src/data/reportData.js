export const REPORT_TYPES = [
  { value: 'Bache', label: 'Bache', color: '#f59e0b' },
  { value: 'Luminaria', label: 'Luminaria', color: '#8b5cf6' },
  { value: 'Basura', label: 'Basura', color: '#10b981' },
  { value: 'Semáforo', label: 'Semáforo', color: '#ef4444' },
  { value: 'Agua', label: 'Fuga de agua', color: '#0ea5e9' }
];

export const REPORT_STATUSES = {
  CREADO: { label: 'Creado', tone: 'neutral' },
  EN_REVISION: { label: 'En revisión', tone: 'warning' },
  ASIGNADO: { label: 'Asignado', tone: 'info' },
  EN_PROCESO: { label: 'En proceso', tone: 'orange' },
  RESUELTO: { label: 'Terminado', tone: 'success' },
  CERRADO: { label: 'Cerrado', tone: 'neutral' },
  RECHAZADO: { label: 'Rechazado', tone: 'danger' }
};

export const REPORT_PRIORITIES = {
  BAJA: { label: 'Baja', tone: 'low' },
  MEDIA: { label: 'Media', tone: 'medium' },
  ALTA: { label: 'Alta', tone: 'high' },
  CRITICA: { label: 'Crítica', tone: 'critical' }
};

export function getStatus(status) {
  return REPORT_STATUSES[status] || REPORT_STATUSES.CREADO;
}

export function getPriority(priority) {
  return REPORT_PRIORITIES[priority] || REPORT_PRIORITIES.MEDIA;
}

const CITIZEN_STATUS_ORDER = {
  EN_PROCESO: 0,
  ASIGNADO: 1,
  EN_REVISION: 2,
  CREADO: 2,
  RESUELTO: 3,
  CERRADO: 4,
  RECHAZADO: 5
};
const PRIORITY_ORDER = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };

export function sortCitizenReports(reports) {
  return [...reports].sort((first, second) => {
    const statusDifference = (CITIZEN_STATUS_ORDER[first.status] ?? CITIZEN_STATUS_ORDER.EN_REVISION)
      - (CITIZEN_STATUS_ORDER[second.status] ?? CITIZEN_STATUS_ORDER.EN_REVISION);
    if (statusDifference !== 0) return statusDifference;

    const priorityDifference = (PRIORITY_ORDER[first.priority] ?? PRIORITY_ORDER.MEDIA)
      - (PRIORITY_ORDER[second.priority] ?? PRIORITY_ORDER.MEDIA);
    if (priorityDifference !== 0) return priorityDifference;

    const dateDifference = new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    if (dateDifference !== 0) return dateDifference;

    return Number(second.id) - Number(first.id);
  });
}
