import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationsContext.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Icon from '../../components/ui/Icon.jsx';

const notificationIcons = {
  REPORT_ASSIGNED: 'tasks',
  REPORT_RESOLVED: 'check',
  REPORT_CLOSED: 'check',
  REPORT_REJECTED: 'close'
};

function formatDate(value) {
  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function getReportPath(role, reportId) {
  if (!reportId) return '';
  if (role === 'ADMINISTRADOR') return `/admin/reportes/${reportId}`;
  if (role === 'TECNICO') return `/tecnico/tareas/${reportId}`;
  return `/ciudadano/reportes/${reportId}`;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, error, markAsRead, markAllAsRead } = useNotifications();

  return (
    <section className="surface-card page-card notifications-page">
      <PageHeader
        eyebrow="Actividad de tu cuenta"
        title="Notificaciones"
        description="Consulta asignaciones, avances y conclusiones relacionadas con los reportes."
        action={unreadCount > 0 ? (
          <button className="button button-outline" type="button" onClick={markAllAsRead}>
            <Icon name="check" size={16} /> Marcar todas como leídas
          </button>
        ) : null}
      />

      {error && <p className="form-error panel-error" role="alert">{error}</p>}
      {loading && notifications.length === 0 && <div className="empty-state"><p>Cargando notificaciones...</p></div>}
      {!loading && notifications.length === 0 && (
        <div className="empty-state notification-empty"><Icon name="bell" size={34} /><p>No tienes notificaciones todavía.</p></div>
      )}

      {notifications.length > 0 && (
        <div className="notification-list">
          {notifications.map((notification) => {
            const path = getReportPath(user.role, notification.reportId);
            const content = (
              <>
                <span className={`notification-icon notification-${notification.type.toLowerCase()}`}>
                  <Icon name={notificationIcons[notification.type] || 'bell'} size={20} />
                </span>
                <span className="notification-content">
                  <span className="notification-title-row">
                    <strong>{notification.title}</strong>
                    {!notification.isRead && <span className="unread-label">Nueva</span>}
                  </span>
                  <span>{notification.message}</span>
                  <small>{formatDate(notification.createdAt)}</small>
                </span>
                {path && <Icon name="arrow" size={17} className="notification-arrow" />}
              </>
            );

            return path ? (
              <Link
                className={`notification-item ${notification.isRead ? 'is-read' : 'is-unread'}`}
                to={path}
                key={notification.id}
                onClick={() => markAsRead(notification)}
              >
                {content}
              </Link>
            ) : (
              <article className={`notification-item ${notification.isRead ? 'is-read' : 'is-unread'}`} key={notification.id}>
                {content}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
