const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/user.model');
const AppError = require('../utils/AppError');

const RECOVERY_TOKEN_PURPOSE = 'PASSWORD_RECOVERY';
const RECOVERY_TOKEN_DURATION = '10m';

function normalizeIdentityValue(value) {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-BO');
}

function getPasswordFingerprint(passwordHash) {
  return crypto.createHash('sha256').update(passwordHash).digest('hex');
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { password_hash, ...safeUser } = user;
  return safeUser;
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn
    }
  );
}

async function register(payload) {
  const existingUser = await userModel.findByEmail(payload.email);

  if (existingUser) {
    throw new AppError('El correo ya esta registrado.', 409, [
      { field: 'email', message: 'Ya existe un usuario con este correo.' }
    ]);
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await userModel.createCitizen({
    email: payload.email,
    passwordHash,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone
  });

  const token = signToken(user);

  return {
    user: sanitizeUser(user),
    token
  };
}

async function login({ email, password }) {
  const user = await userModel.findByEmail(email);

  if (!user) {
    throw new AppError('Credenciales invalidas.', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw new AppError('Credenciales invalidas.', 401);
  }

  if (!user.is_active) {
    throw new AppError('Usuario inactivo.', 403);
  }

  return {
    user: sanitizeUser(user),
    token: signToken(user)
  };
}

async function verifyPasswordRecoveryIdentity({ firstName, lastName, email }) {
  const user = await userModel.findByEmail(email);
  const identityMatches = user
    && user.is_active
    && normalizeIdentityValue(user.first_name) === normalizeIdentityValue(firstName)
    && normalizeIdentityValue(user.last_name) === normalizeIdentityValue(lastName);

  if (!identityMatches) {
    throw new AppError('No pudimos validar los datos ingresados.', 400);
  }

  const recoveryToken = jwt.sign(
    {
      sub: user.id,
      purpose: RECOVERY_TOKEN_PURPOSE,
      passwordFingerprint: getPasswordFingerprint(user.password_hash)
    },
    env.jwtSecret,
    { expiresIn: RECOVERY_TOKEN_DURATION }
  );

  return {
    recoveryToken,
    expiresInMinutes: 10
  };
}

async function resetPassword({ recoveryToken, newPassword }) {
  let recoveryData;

  try {
    recoveryData = jwt.verify(recoveryToken, env.jwtSecret);
  } catch (_error) {
    throw new AppError('La validación venció o ya no es válida. Verifica tus datos nuevamente.', 400);
  }

  if (recoveryData.purpose !== RECOVERY_TOKEN_PURPOSE || !recoveryData.sub) {
    throw new AppError('La validación de recuperación no es válida.', 400);
  }

  const user = await userModel.findByIdWithPassword(recoveryData.sub);
  const tokenIsCurrent = user
    && user.is_active
    && recoveryData.passwordFingerprint === getPasswordFingerprint(user.password_hash);

  if (!tokenIsCurrent) {
    throw new AppError('La validación venció o ya fue utilizada. Verifica tus datos nuevamente.', 400);
  }

  if (await bcrypt.compare(newPassword, user.password_hash)) {
    throw new AppError('La nueva contraseña debe ser diferente de la anterior.', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const updated = await userModel.updatePassword(user.id, passwordHash);

  if (!updated) {
    throw new AppError('No se pudo actualizar la contraseña.', 400);
  }
}

async function getMe(userId) {
  const user = await userModel.findById(userId);

  if (!user || !user.is_active) {
    throw new AppError('Usuario no autorizado.', 401);
  }

  return sanitizeUser(user);
}

async function updateProfile(userId, payload) {
  const allowedFields = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: Object.prototype.hasOwnProperty.call(payload, 'phone') ? payload.phone : undefined
  };

  const user = await userModel.updateProfile(userId, allowedFields);

  if (!user) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  return sanitizeUser(user);
}

module.exports = {
  register,
  login,
  verifyPasswordRecoveryIdentity,
  resetPassword,
  getMe,
  updateProfile
};
