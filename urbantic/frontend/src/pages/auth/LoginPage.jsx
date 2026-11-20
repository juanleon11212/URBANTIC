import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Icon from '../../components/ui/Icon.jsx';
import PasswordInput from '../../components/ui/PasswordInput.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, signIn, getDashboardPath } = useAuth();
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const loggedUser = await signIn(form);
      navigate(getDashboardPath(loggedUser.role), { replace: true });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'No se pudo iniciar sesión. Revisa tus datos e inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-backdrop" aria-hidden="true"><span /><span /><span /></div>
      <section className="auth-panel">
        <div className="auth-brand"><span className="brand-mark"><Icon name="building" size={30} /></span><span>URBANTIC</span></div>
        <h1>Bienvenido de nuevo</h1>
        <p className="auth-intro">Ingresa para reportar y acompañar las mejoras de tu ciudad.</p>
        {location.state?.registrationSuccess && (
          <div className="auth-success" role="status">
            <Icon name="check" size={18} />
            <div>
              <strong>Cuenta creada correctamente</strong>
              <span>Usuario: <b>{location.state.email}</b></span>
              <span>Ingresa la misma contraseña que acabas de registrar.</span>
            </div>
          </div>
        )}
        {location.state?.passwordResetSuccess && (
          <div className="auth-success" role="status">
            <Icon name="check" size={18} />
            <div>
              <strong>Contraseña actualizada</strong>
              <span>Ya puedes ingresar con tu nueva contraseña.</span>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="form">
          <label>
            Correo electrónico
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="tu@correo.com" autoComplete="email" required />
          </label>
          <label>
            Contraseña
            <PasswordInput name="password" value={form.password} onChange={handleChange} placeholder="••••••••" autoComplete="current-password" required />
          </label>
          <Link className="forgot-password-link" to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
          {error && <p className="form-error panel-error" role="alert">{error}</p>}
          <button className="button button-primary button-full" type="submit" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <p className="auth-switch">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </section>
    </main>
  );
}
