const AppError = require('../utils/AppError');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const personNameRegex = /^\p{L}(?:[\p{L}' -]*\p{L})?$/u;
const phoneRegex = /^\+?[0-9](?:[0-9 ()-]*[0-9])?$/;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function validate(schema) {
  return (req, _res, next) => {
    const errors = [];

    Object.entries(schema).forEach(([field, rules]) => {
      const value = normalizeString(req.body[field]);
      req.body[field] = value;

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: 'Este campo es obligatorio.' });
        return;
      }

      if (value === undefined || value === null || value === '') {
        return;
      }

      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push({ field, message: 'Debe ser texto.' });
      }

      if (rules.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
        errors.push({ field, message: 'Debe ser un número válido.' });
      }

      if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push({ field, message: 'Debe ser verdadero o falso.' });
      }

      if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push({ field, message: 'Debe ser una lista.' });
      }

      if (Array.isArray(value) && rules.items === 'number' && value.some((item) => typeof item !== 'number' || !Number.isInteger(item))) {
        errors.push({ field, message: 'Todos los elementos deben ser identificadores numéricos válidos.' });
      }

      if (rules.type === 'array' && Array.isArray(value) && rules.items === 'number'
        && value.some((item) => typeof item !== 'number' || !Number.isInteger(item) || item <= 0)) {
        errors.push({ field, message: 'La lista contiene identificadores inválidos.' });
      }

      if (rules.email && !emailRegex.test(value)) {
        errors.push({ field, message: 'Debe ser un correo valido.' });
      }

      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push({ field, message: rules.patternMessage || 'El formato no es válido.' });
      }

      if (rules.min && value.length < rules.min) {
        errors.push({ field, message: `Debe tener al menos ${rules.min} caracteres.` });
      }

      if (rules.max && value.length > rules.max) {
        errors.push({ field, message: `Debe tener como maximo ${rules.max} caracteres.` });
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({ field, message: 'El valor seleccionado no es válido.' });
      }
    });

    if (errors.length > 0) {
      return next(new AppError('Datos de entrada invalidos.', 400, errors));
    }

    return next();
  };
}

const registerSchema = {
  email: { required: true, type: 'string', email: true, max: 180 },
  password: { required: true, type: 'string', min: 8, max: 100 },
  firstName: { required: true, type: 'string', min: 2, max: 100, pattern: personNameRegex, patternMessage: 'El nombre sólo puede contener letras, espacios, apóstrofes y guiones.' },
  lastName: { required: true, type: 'string', min: 2, max: 100, pattern: personNameRegex, patternMessage: 'El apellido sólo puede contener letras, espacios, apóstrofes y guiones.' },
  phone: { required: false, type: 'string', min: 7, max: 30, pattern: phoneRegex, patternMessage: 'El teléfono sólo puede contener números y los símbolos +, espacio, paréntesis o guion.' }
};

const loginSchema = {
  email: { required: true, type: 'string', email: true, max: 180 },
  password: { required: true, type: 'string', min: 1, max: 100 }
};

const passwordRecoveryIdentitySchema = {
  firstName: { required: true, type: 'string', min: 2, max: 100, pattern: personNameRegex, patternMessage: 'El nombre sólo puede contener letras, espacios, apóstrofes y guiones.' },
  lastName: { required: true, type: 'string', min: 2, max: 100, pattern: personNameRegex, patternMessage: 'El apellido sólo puede contener letras, espacios, apóstrofes y guiones.' },
  email: { required: true, type: 'string', email: true, max: 180 }
};

const passwordRecoveryResetSchema = {
  recoveryToken: { required: true, type: 'string', min: 20, max: 2000 },
  newPassword: { required: true, type: 'string', min: 8, max: 100 }
};

const profileSchema = {
  firstName: { required: false, type: 'string', min: 2, max: 100, pattern: personNameRegex, patternMessage: 'El nombre sólo puede contener letras, espacios, apóstrofes y guiones.' },
  lastName: { required: false, type: 'string', min: 2, max: 100, pattern: personNameRegex, patternMessage: 'El apellido sólo puede contener letras, espacios, apóstrofes y guiones.' },
  phone: { required: false, type: 'string', min: 7, max: 30, pattern: phoneRegex, patternMessage: 'El teléfono sólo puede contener números y los símbolos +, espacio, paréntesis o guion.' }
};

const reportSchema = {
  type: { required: true, type: 'string', min: 2, max: 80 },
  title: { required: true, type: 'string', min: 4, max: 80 },
  description: { required: true, type: 'string', min: 10, max: 2000 },
  location: { required: true, type: 'string', min: 3, max: 255 },
  zone: { required: false, type: 'string', max: 100 },
  latitude: { required: false, type: 'number' },
  longitude: { required: false, type: 'number' },
  image: { required: false, type: 'string', max: 7000000 }
};

const assignmentSchema = {
  technicianId: { required: true, type: 'number' }
};

const statusSchema = {
  status: {
    required: true,
    type: 'string',
    enum: ['EN_PROCESO', 'RESUELTO']
  },
  observations: { required: false, type: 'string', max: 3000 },
  evidenceImages: { required: false, type: 'array' }
};

const classificationSchema = {
  categoryId: { required: true, type: 'number' },
  priority: { required: true, type: 'string', enum: ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] }
};

const decisionSchema = {
  decision: { required: true, type: 'string', enum: ['CERRADO', 'RECHAZADO'] },
  reason: { required: false, type: 'string', max: 3000 }
};

const managedUserSchema = {
  name: { required: true, type: 'string', min: 3, max: 201, pattern: personNameRegex, patternMessage: 'El nombre sólo puede contener letras, espacios, apóstrofes y guiones.' },
  email: { required: true, type: 'string', email: true, max: 180 },
  password: { required: true, type: 'string', min: 8, max: 100 },
  phone: { required: true, type: 'string', min: 7, max: 30, pattern: phoneRegex, patternMessage: 'El teléfono no tiene un formato válido.' },
  categoryIds: { required: true, type: 'array', items: 'number', min: 1, max: 10 },
  active: { required: false, type: 'boolean' }
};

const userStatusSchema = {
  active: { required: true, type: 'boolean' }
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  passwordRecoveryIdentitySchema,
  passwordRecoveryResetSchema,
  profileSchema,
  reportSchema,
  assignmentSchema,
  statusSchema,
  classificationSchema,
  decisionSchema,
  managedUserSchema,
  userStatusSchema
};
