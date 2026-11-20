const notificationModel = require('../models/notification.model');
const AppError = require('../utils/AppError');

function parseId(value) {
  const id = Number.parseInt(value, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador de notificación inválido.', 400);
  }
  return id;
}

function list(userId) {
  return notificationModel.listForUser(Number(userId));
}

async function markAsRead(userId, rawId) {
  const notification = await notificationModel.markAsRead(parseId(rawId), Number(userId));
  if (!notification) throw new AppError('Notificación no encontrada.', 404);
  return notification;
}

function markAllAsRead(userId) {
  return notificationModel.markAllAsRead(Number(userId));
}

module.exports = { list, markAsRead, markAllAsRead };
