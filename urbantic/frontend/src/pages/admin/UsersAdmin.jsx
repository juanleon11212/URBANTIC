import { useEffect, useMemo, useState } from 'react';
import * as usersApi from '../../api/users.api.js';
import * as categoriesApi from '../../api/categories.api.js';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Icon from '../../components/ui/Icon.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import { getApiErrorMessage, isValidPersonName, isValidPhone, sanitizePersonName, sanitizePhone } from '../../utils/inputValidation.js';

const emptyForm = { name: '', email: '', password: '', phone: '', categoryIds: [], active: true };

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [credentialsCopied, setCredentialsCopied] = useState(false);
  const [credentialPasswordVisible, setCredentialPasswordVisible] = useState(false);

  useEffect(() => {
    Promise.all([usersApi.list(), categoriesApi.list()])
      .then(([userList, categoryList]) => {
        setUsers(userList);
        setCategories(categoryList.filter((category) => category.active));
      })
      .catch((apiError) => setError(getApiErrorMessage(apiError, 'No se pudieron cargar los usuarios y especialidades.')))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = role === 'TODOS' || user.roleCode === role;
      const matchesSearch = !term || `${user.name} ${user.email} ${(user.categoryNames || []).join(' ')}`.toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [users, role, search]);

  function toggleCategory(categoryId) {
    setForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId]
    }));
  }

  async function toggleUser(user) {
    setError('');
    setMessage('');
    try {
      await usersApi.setStatus(user.id, !user.active);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, active: !item.active } : item));
      setMessage(`${user.name} ahora está ${user.active ? 'inactivo' : 'activo'}.`);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'No se pudo actualizar el usuario.'));
    }
  }

  async function addTechnician(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setCreatedCredentials(null);
    setCredentialsCopied(false);
    setCredentialPasswordVisible(false);

    if (!isValidPersonName(form.name, 3)) {
      setError('El nombre debe tener al menos 3 caracteres y contener solamente letras.');
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError('Ingresa un teléfono válido de al menos 7 caracteres.');
      return;
    }
    if (form.categoryIds.length === 0) {
      setError('Selecciona al menos una especialidad para el técnico.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await usersApi.create(form);
      setUsers((current) => [...current, user]);
      setCreatedCredentials({
        name: user.name,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: 'Técnico especializado',
        specialties: user.categoryNames
      });
      setForm(emptyForm);
      setShowForm(false);
      setMessage('Técnico creado correctamente. Ya puede iniciar sesión con sus credenciales.');
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'No se pudo crear el técnico.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function copyCredentials() {
    if (!createdCredentials) return;
    const text = `URBANTIC\nUsuario: ${createdCredentials.email}\nContraseña: ${createdCredentials.password}\nRol: ${createdCredentials.role}\nEspecialidades: ${createdCredentials.specialties.join(', ')}`;
    try {
      await navigator.clipboard.writeText(text);
      setCredentialsCopied(true);
    } catch {
      setError('No se pudieron copiar automáticamente. Selecciona las credenciales manualmente.');
    }
  }

  return (
    <section className="surface-card page-card">
      <PageHeader
        eyebrow="Administración"
        title="Usuarios y técnicos"
        description="Gestiona accesos y crea técnicos con especialidades compatibles con los reportes."
        action={<button className={`button ${showForm ? 'button-ghost' : 'button-primary'}`} type="button" onClick={() => setShowForm((value) => !value)}><Icon name={showForm ? 'close' : 'add'} size={17} /> {showForm ? 'Cancelar' : 'Crear técnico'}</button>}
      />

      {showForm && (
        <form className="technician-create-form" onSubmit={addTechnician}>
          <div className="form-section-heading">
            <span className="panel-icon"><Icon name="user" /></span>
            <div><span className="eyebrow">Nueva cuenta técnica</span><h2>Datos de acceso y especialidades</h2><p>Esta operación siempre crea una cuenta con rol Técnico.</p></div>
          </div>
          <div className="technician-form-fields">
            <label>Nombre completo
              <input value={form.name} onChange={(event) => setForm({ ...form, name: sanitizePersonName(event.target.value) })} autoComplete="name" placeholder="Nombre y apellido" minLength="3" maxLength="201" required />
            </label>
            <label>Correo electrónico
              <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" placeholder="nombre@urbantic.bo" required />
            </label>
            <label>Teléfono
              <input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: sanitizePhone(event.target.value) })} inputMode="tel" minLength="7" maxLength="30" placeholder="Ej. 71400105" required />
            </label>
            <label>Contraseña temporal
              <PasswordInput minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" placeholder="Mínimo 8 caracteres" required />
            </label>
          </div>

          <fieldset className="specialty-selector">
            <legend>Especialidades <span>Selecciona una o varias</span></legend>
            <div className="specialty-options">
              {categories.map((category) => (
                <label className={form.categoryIds.includes(category.id) ? 'is-selected' : ''} key={category.id}>
                  <input type="checkbox" checked={form.categoryIds.includes(category.id)} onChange={() => toggleCategory(category.id)} />
                  <span style={{ '--specialty-color': category.color }}><Icon name="categories" size={17} /></span>
                  <strong>{category.name}</strong>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="status-switch">
            <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
            <span><strong>Cuenta activa</strong><small>El técnico podrá iniciar sesión inmediatamente.</small></span>
          </label>

          {error && <p className="form-error panel-error" role="alert">{error}</p>}
          <div className="form-actions"><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? 'Creando...' : 'Crear técnico'}</button></div>
        </form>
      )}

      {message && <p className="toast-message users-message"><Icon name="check" size={16} /> {message}</p>}
      {createdCredentials && (
        <section className="credentials-card" aria-live="polite">
          <div className="credentials-heading">
            <span className="panel-icon success-icon"><Icon name="check" size={18} /></span>
            <div><span className="eyebrow">Cuenta creada</span><h2>Credenciales de acceso</h2><p>Guárdalas ahora. La contraseña no volverá a mostrarse al recargar.</p></div>
          </div>
          <dl>
            <div><dt>Nombre</dt><dd>{createdCredentials.name}</dd></div>
            <div><dt>Correo</dt><dd>{createdCredentials.email}</dd></div>
            <div>
              <dt>Contraseña temporal</dt>
              <dd className="credential-secret">
                <span className="credential-password">{credentialPasswordVisible ? createdCredentials.password : '••••••••••••'}</span>
                <button
                  className="credential-toggle"
                  type="button"
                  aria-label={credentialPasswordVisible ? 'Ocultar contraseña temporal' : 'Mostrar contraseña temporal'}
                  title={credentialPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={credentialPasswordVisible}
                  onClick={() => setCredentialPasswordVisible((visible) => !visible)}
                >
                  <Icon name={credentialPasswordVisible ? 'eyeOff' : 'eye'} size={17} />
                </button>
              </dd>
            </div>
            <div><dt>Especialidades</dt><dd>{createdCredentials.specialties.join(', ')}</dd></div>
          </dl>
          <button className="button button-outline" type="button" onClick={copyCredentials}>
            <Icon name={credentialsCopied ? 'check' : 'reports'} size={16} /> {credentialsCopied ? 'Credenciales copiadas' : 'Copiar credenciales'}
          </button>
        </section>
      )}
      {!showForm && error && <p className="form-error table-message" role="alert">{error}</p>}

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
          <span><Icon name="search" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, correo o especialidad..." /></span>
        </label>
        <span className="result-count">{filteredUsers.length} usuario{filteredUsers.length === 1 ? '' : 's'}</span>
      </div>

      {loading && <div className="empty-state"><p>Cargando usuarios...</p></div>}
      {!loading && !filteredUsers.length && <div className="empty-state"><Icon name="users" size={32} /><p>No hay usuarios que coincidan con los filtros.</p></div>}

      {!loading && filteredUsers.length > 0 && <div className="table-wrap">
        <table className="report-table users-table">
          <thead><tr><th>#</th><th>Nombre</th><th>Rol</th><th>Contacto</th><th>Especialidades</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {filteredUsers.map((user, index) => (
              <tr key={user.id}>
                <td data-label="#">{index + 1}</td>
                <td data-label="Nombre"><strong>{user.name}</strong></td>
                <td data-label="Rol"><span className="role-pill">{user.role}</span></td>
                <td data-label="Contacto"><span className="user-contact">{user.email}<small>{user.phone || 'Sin teléfono'}</small></span></td>
                <td data-label="Especialidades"><span className="specialty-list">{user.categoryNames?.length ? user.categoryNames.join(', ') : 'No aplica'}</span></td>
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
