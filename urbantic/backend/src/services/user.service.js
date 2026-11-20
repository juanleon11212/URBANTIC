const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const categoryModel = require('../models/category.model');
const AppError = require('../utils/AppError');

async function list() {
  return userModel.listAll();
}

async function technicians(categoryId) {
  const parsedCategoryId = categoryId ? Number.parseInt(categoryId, 10) : null;
  if (categoryId && (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0)) {
    throw new AppError('La categoría indicada no es válida.', 400);
  }
  return userModel.listTechnicians(parsedCategoryId);
}

async function create(payload) {
  const existing = await userModel.findByEmail(payload.email);
  if (existing) throw new AppError('El correo ya está registrado.', 409);

  const categoryIds = [...new Set(payload.categoryIds.map(Number))];
  const categories = await categoryModel.findActiveByIds(categoryIds);
  if (categories.length !== categoryIds.length) {
    throw new AppError('Una o más especialidades seleccionadas no están disponibles.', 400);
  }

  const names = payload.name.trim().split(/\s+/);
  const firstName = names.shift();
  const lastName = names.join(' ') || 'Urbantic';
  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await userModel.createManaged({
    firstName,
    lastName,
    email: payload.email,
    passwordHash,
    phone: payload.phone,
    active: payload.active !== false,
    categoryIds
  });

  return {
    id: user.id,
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    role: user.role_name,
    roleCode: user.role,
    phone: user.phone,
    active: user.is_active,
    categoryIds,
    categoryNames: categories.map((category) => category.name)
  };
}

async function setStatus(actorId, rawId, active) {
  const id = Number.parseInt(rawId, 10);
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Identificador de usuario inválido.', 400);
  if (id === Number(actorId) && !active) throw new AppError('No puedes desactivar tu propio usuario.', 400);
  const user = await userModel.setActive(id, active);
  if (!user) throw new AppError('Usuario no encontrado.', 404);
  return user;
}

module.exports = { list, technicians, create, setStatus };
