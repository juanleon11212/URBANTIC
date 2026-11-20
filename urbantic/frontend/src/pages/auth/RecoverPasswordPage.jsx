import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import * as authApi from '../../api/auth.api.js';
import Icon from '../../components/ui/Icon.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { getApiErrorMessage, isValidPersonName, sanitizePersonName } from '../../utils/inputValidation.js';

const emptyIdentity = { firstName: '', lastName: '', email: '' };

export default function RecoverPasswordPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, getDashboardPath } = useAuth();
  const [identity, setIdentity] = useState(emptyIdentity);
  const [passwords, setPasswords] = useState({ newPassword: '', confirmation: '' });
  const [recoveryToken, setRecoveryToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  function handleIdentityChange(event) {
    const { name, value } = event.target;
    setIdentity((current) => ({
      ...current,
      [name]: ['firstName', 'lastName'].includes(name) ? sanitizePersonName(value) : value
    }));
  }

  async function verifyIdentity(event) {
    event.preventDefault();
    setError('');

    if (!isValidPersonName(identity.firstName) || !isValidPersonName(identity.lastName)) {
      setError('Nombre y apellido deben contener solamente letras y tener al menos 2 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await authApi.verifyPasswordRecoveryIdentity(identity);
      setRecoveryToken(response.data.recoveryToken);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'No pudimos validar los datos ingresados.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setError('');

    if (passwords.newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword({ recoveryToken, newPassword: passwords.newPassword });
      navigate('/login', {
        replace: true,
        state: { passwordResetSuccess: true, email: identity.email }
      });
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, 'No se pudo actualizar la contraseña.'));
    } finally {
      setSubmitting(false);
    }
  }

  function restartVerification() {
    setRecoveryToken('');
    setPasswords({ newPassword: '', confirmation: '' });
    setError('');
  }

  return (
    <main className="auth-shell">
      <div className="auth-backdrop" aria-hidden="true"><span /><span /><span /></div>
      <section className="auth-panel auth-panel-wide">
        <div className="auth-brand"><span className="brand-mark"><Icon name="building" size={30} /></span><span>URBANTIC</span></div>
        <span className="recovery-step">Paso {recoveryToken ? '2 de 2' : '1 de 2'}</span>
        <h1>Recuperar contraseña</h1>
        <p className="auth-intro">
          {recoveryToken
            ? 'Tus datos fueron validados. Ahora crea una contraseña nueva.'
            : 'Escribe los mismos datos que registraste en tu cuenta.'}
        </p>

        {!recoveryToken ? (
          <form onSubmit={verifyIdentity} className="form">
            <div className="form-row">
              <label>Nombre
                <input name="firstName" value={identity.firstName} onChange={handleIdentityChange} autoComplete="given-name" minLength="2" maxLength="100" placeholder="Ej. Carlos" required />
              </label>
              <label>Apellido
                <input name="lastName" value={identity.lastName} onChange={handleIdentityChange} autoComplete="family-name" minLength="2" maxLength="100" placeholder="Ej. Rojas" required />
              </label>
            </div>
            <label>Correo electrónico
              <input name="email" type="email" value={identity.email} onChange={handleIdentityChange} autoComplete="email" placeholder="tu@correo.com" required />
            </label>
            {error && <p className="form-error panel-error" role="alert">{error}</p>}
            <button className="button button-primary button-full" type="submit" disabled={submitting}>
              {submitting ? 'Validando...' : 'Validar mis datos'}
            </button>
          </form>
        ) : (
          <form onSubmit={changePassword} className="form">
            <div className="verified-identity"><Icon name="check" size={17} /><span>Identidad validada para <strong>{identity.email}</strong></span></div>
            <label>Nueva contraseña
              <PasswordInput value={passwords.newPassword} onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))} autoComplete="new-password" minLength="8" placeholder="Mínimo 8 caracteres" required />
            </label>
            <label>Confirmar nueva contraseña
              <PasswordInput value={passwords.confirmation} onChange={(event) => setPasswords((current) => ({ ...current, confirmation: event.target.value }))} autoComplete="new-password" minLength="8" placeholder="Repite la contraseña" required />
            </label>
            {error && <p className="form-error panel-error" role="alert">{error}</p>}
            <button className="button button-primary button-full" type="submit" disabled={submitting}>
              {submitting ? 'Actualizando...' : 'Cambiar contraseña'}
            </button>
            <button className="button button-ghost button-full" type="button" onClick={restartVerification} disabled={submitting}>Volver a validar datos</button>
          </form>
        )}

        <p className="auth-switch"><Link to="/login">Volver al inicio de sesión</Link></p>
      </section>
    </main>
  );
}
