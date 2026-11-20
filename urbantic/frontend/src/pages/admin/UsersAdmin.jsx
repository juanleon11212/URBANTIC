import { useEffect, useMemo, useState } from 'react';
import * as usersApi from '../../api/users.api.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Icon from '../../components/ui/Icon.jsx';

const emptyForm = { name: '', email: '', role: 'TECNICO', password: '' };

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    usersApi.list()
      .then(setUsers)
      .catch((apiError) => setError(apiError.response?.data?.message || 'No se pudieron cargar los usuarios.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = role === 'TODOS' || user.roleCode === role;
      const matchesSearch = !term || `${user.name} ${user.email}`.toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [users, role, search]);

  async function toggleUser(user) {
    setError('');
    setMessage('');
    try {
      await usersApi.setStatus(user.id, !user.active);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, active: !item.active } : item));
      setMessage(`${user.name} ahora está ${user.active ? 'inactivo' : 'activo'}.`);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'No se pudo actualizar el usuario.');
    }
  }

  async function addUser(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const user = await usersApi.create(form);
      setUsers((current) => [...current, user]);
      setForm(emptyForm);
      setShowForm(false);
      setMessage(`${form.role === 'TECNICO' ? 'Técnico' : 'Usuario'} creado correctamente. Ya puede iniciar sesión con sus credenciales.`);
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'No se pudo crear el usuario.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="surface-card page-card">
      <PageHeader
        eyebrow="Administración"
        title="Usuarios y técnicos"
        description="Gestiona el acceso del equipo y crea credenciales seguras para técnicos especializados."
        action={<button className={`button ${showForm ? 'button-ghost' : 'button-primary'}`} type="button" onClick={() => setShowForm((value) => !value)}><Icon name={showForm ? 'close' : 'add'} size={17} /> {showForm ? 'Cancelar' : 'Crear técnico'}</button>}
      />

      {showForm && (
        <form className="technician-create-form" onSubmit={addUser}>
          <div className="form-section-heading">
            <span className="panel-icon"><Icon name="user" /></span>
            <div><span className="eyebrow">Nueva cuenta</span><h2>Datos de acceso</h2><p>El rol Técnico está seleccionado de forma predeterminada.</p></div>
          </div>
          <div className="technician-form-fields">
            <label>Nombre completo
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" placeholder="Nombre y apellido" minLength="3" required />
            </label>
            <label>Correo electrónico
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" placeholder="tecnico@correo.com" required />
            </label>
            <label>Contraseña temporal
              <input type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" placeholder="Mínimo 8 caracteres" required />
            </label>
            <label>Rol
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                <option value="TECNICO">Técnico especializado</option>
                <option value="CIUDADANO">Ciudadano</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
            </label>
          </div>
          <div className="form-actions"><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'Creando...' : form.role === 'TECNICO' ? 'Crear técnico' : 'Crear usuario'}</button></div>
        </form>
      )}

      {message && <p className="toast-message users-message"><Icon name="check" size={16} /> {message}</p>}
      {error && <p className="form-error table-message" role="alert">{error}</p>}

      <div className="filter-bar user-filters">
        <label>Rol
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="TODOS">Todos los roles</option>
            <option value="CIUDADANO">Ciudadanos</option>
            <option value="TECNICO">Técnicos</option>
            <option value="ADMINISTRADOR">Administradores</option>
          </select>
        </label>
        <label className="search-field">Buscar
          <span><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre o correo..." /></span>
        </label>
        <span className="result-count">{filteredUsers.length} usuario{filteredUsers.length === 1 ? '' : 's'}</span>
      </div>

      {loading && <div className="empty-state"><p>Cargando usuarios...</p></div>}
      {!loading && !filteredUsers.length && <div className="empty-state"><Icon name="users" size={32} /><p>No hay usuarios que coincidan con los filtros.</p></div>}

      {!loading && filteredUsers.length > 0 && <div className="table-wrap">
        <table className="report-table users-table">
          <thead><tr><th>#</th><th>Nombre</th><th>Rol</th><th>Correo</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={user.id}>
                <td data-label="#">{index + 1}</td>
                <td data-label="Nombre"><strong>{user.name}</strong></td>
                <td data-label="Rol"><span className="role-pill">{user.role}</span></td>
                <td data-label="Correo">{user.email}</td>
                <td data-label="Estado"><span className={`status-badge ${user.active ? 'status-success' : 'status-danger'}`}>{user.active ? 'Activo' : 'Inactivo'}</span></td>
                <td className="table-action" data-label="Acciones"><button className="button button-small button-light" type="button" onClick={() => toggleUser(user)}>{user.active ? 'Desactivar' : 'Activar'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>}
    </section>
  );
}
