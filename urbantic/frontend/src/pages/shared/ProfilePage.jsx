import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { getApiErrorMessage, isValidPersonName, isValidPhone, sanitizePersonName, sanitizePhone } from '../../utils/inputValidation.js';

export default function ProfilePage() {
  const { user, saveProfile } = useAuth();
  const [form, setForm] = useState({
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone || ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  function resetForm() {
    setForm({
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone || ''
    });
  }

  function startEditing() {
    resetForm();
    setMessage('');
    setError('');
    setIsEditing(true);
  }

  function cancelEditing() {
    resetForm();
    setMessage('');
    setError('');
    setIsEditing(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    const sanitizedValue = ['firstName', 'lastName'].includes(name)
      ? sanitizePersonName(value)
      : name === 'phone' ? sanitizePhone(value) : value;
    setForm((current) => ({
      ...current,
      [name]: sanitizedValue
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isEditing) return;
    setMessage('');
    setError('');

    if (!isValidPersonName(form.firstName) || !isValidPersonName(form.lastName)) {
      setError('Nombre y apellido deben contener solamente letras y tener al menos 2 caracteres.');
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError('Ingresa un teléfono válido de al menos 7 caracteres.');
      return;
    }
    setSubmitting(true);

    try {
      await saveProfile(form);
      setMessage('Perfil actualizado correctamente.');
      setIsEditing(false);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'No se pudo actualizar el perfil.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="surface-card page-card profile-page">
      <PageHeader
        eyebrow="Cuenta personal"
        title="Mi perfil"
        description="Consulta tus datos y habilita la edición solamente cuando necesites actualizarlos."
        action={isEditing ? (
          <button className="button button-ghost" type="button" onClick={cancelEditing} disabled={submitting}>
            <Icon name="close" size={16} /> Cancelar edición
          </button>
        ) : (
          <button className="button button-outline" type="button" onClick={startEditing}>
            <Icon name="edit" size={16} /> Editar perfil
          </button>
        )}
      />
      <div className="profile-layout">
        <aside className="profile-summary">
          <span className="profile-avatar">{user.first_name?.[0]}{user.last_name?.[0]}</span>
          <h2>{user.first_name} {user.last_name}</h2>
          <span>{user.role_name || user.role}</span>
          <small>{user.email}</small>
        </aside>
        <form onSubmit={handleSubmit} className={`form profile-form ${isEditing ? 'is-editing' : 'is-readonly'}`}>
          <div className="form-row">
            <label>Nombre<input name="firstName" value={form.firstName} onChange={handleChange} minLength="2" maxLength="100" placeholder="Solo letras" disabled={!isEditing} required /></label>
            <label>Apellido<input name="lastName" value={form.lastName} onChange={handleChange} minLength="2" maxLength="100" placeholder="Solo letras" disabled={!isEditing} required /></label>
          </div>
          <label>Teléfono<input name="phone" type="tel" value={form.phone} onChange={handleChange} inputMode="tel" minLength="7" maxLength="30" placeholder="Ej. 71234567" disabled={!isEditing} /></label>
          <label>Correo<input value={user.email} disabled /></label>
          {!isEditing && <p className="profile-lock-note"><Icon name="user" size={15} /> Pulsa “Editar perfil” para modificar tus datos.</p>}
          {message && <p className="form-success"><Icon name="check" size={16} /> {message}</p>}
          {error && <p className="form-error">{error}</p>}
          {isEditing && (
            <div className="form-actions">
              <button className="button button-ghost" type="button" onClick={cancelEditing} disabled={submitting}>Cancelar</button>
              <button className="button button-primary" type="submit" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
