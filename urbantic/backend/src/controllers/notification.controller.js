const notificationService = require('../services/notification.service');

async function list(req, res, next) {
  try {
    const data = await notificationService.list(req.user.sub);
    res.json({ success: true, message: 'Notificaciones obtenidas correctamente.', data });
  } catch (error) { next(error); }
}

async function markAsRead(req, res, next) {
  try {
    await notificationService.markAsRead(req.user.sub, req.params.id);
    res.json({ success: true, message: 'Notificación marcada como leída.', data: null });
  } catch (error) { next(error); }
}

async function markAllAsRead(req, res, next) {
  try {
    const updated = await notificationService.markAllAsRead(req.user.sub);
    res.json({ success: true, message: 'Notificaciones marcadas como leídas.', data: { updated } });
  } catch (error) { next(error); }
}

module.exports = { list, markAsRead, markAllAsRead };
