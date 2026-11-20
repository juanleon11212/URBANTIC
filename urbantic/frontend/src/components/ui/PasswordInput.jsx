import { useState } from 'react';
import Icon from './Icon.jsx';

export default function PasswordInput({ className = '', ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className={`password-field ${className}`.trim()}>
      <input {...inputProps} type={visible ? 'text' : 'password'} />
      <button
        className="password-toggle"
        type="button"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        <Icon name={visible ? 'eyeOff' : 'eye'} size={19} />
      </button>
    </span>
  );
}
