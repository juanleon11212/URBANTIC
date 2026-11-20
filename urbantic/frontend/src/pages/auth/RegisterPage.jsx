import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Icon from '../../components/ui/Icon.jsx';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, signUp, getDashboardPath } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '' });
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
      await signUp(form);
      navigate('/login', { replace: true, state: { registrationSuccess: true, email: form.email } });
    } catch (apiError) {
      setError(apiError.response?.data?.message || 'No se pudo crear la cuenta. Revisa los datos e inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-backdrop" aria-hidden="true"><span /><span /><span /></div>
      <section className="auth-panel auth-panel-wide">
        <div className="auth-brand"><span className="brand-mark"><Icon name="building" size={30} /></span><span>URBANTIC</span></div>
        <h1>Crea tu cuenta ciudadana</h1>
        <p className="auth-intro">Únete y ayuda a mejorar tu entorno urbano.</p>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <label>Nombre
              <input name="firstName" value={form.firstName} onChange={handleChange} autoComplete="given-name" minLength="2" required />
            </label>
            <label>Apellido
              <input name="lastName" value={form.lastName} onChange={handleChange} autoComplete="family-name" minLength="2" required />
            </label>
          </div>
          <label>Teléfono <span className="optional-label">Opcional</span>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} autoComplete="tel" placeholder="Ej. 70000000" />
          </label>
          <label>Correo electrónico
            <input name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" placeholder="tu@correo.com" required />
          </label>
          <label>Contraseña
            <input name="password" type="password" value={form.password} onChange={handleChange} autoComplete="new-password" minLength="8" placeholder="Mínimo 8 caracteres" required />
          </label>
          <p className="form-note"><Icon name="check" size={14} /> Tu cuenta se creará con el rol Ciudadano.</p>
          {error && <p className="form-error panel-error" role="alert">{error}</p>}
          <button className="button button-primary button-full" type="submit" disabled={submitting}>
            {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="auth-switch">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </section>
    </main>
  );
}
