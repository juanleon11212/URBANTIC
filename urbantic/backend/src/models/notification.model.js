const db = require('../config/database');

async function listForUser(userId) {
  const [notificationsResult, unreadResult] = await Promise.all([
    db.query(
      `
        SELECT
          id,
          report_id AS "reportId",
          type,
          title,
          message,
          is_read AS "isRead",
          created_at AS "createdAt",
          read_at AS "readAt"
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT 100
      `,
      [userId]
    ),
    db.query(
      'SELECT COUNT(*)::INTEGER AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    )
  ]);

  return {
    notifications: notificationsResult.rows,
    unreadCount: unreadResult.rows[0].count
  };
}

async function markAsRead(id, userId) {
  const result = await db.query(
    `
      UPDATE notifications
      SET is_read = TRUE, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `,
    [id, userId]
  );
  return result.rows[0] || null;
}

async function markAllAsRead(userId) {
  const result = await db.query(
    `
      UPDATE notifications
      SET is_read = TRUE, read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
      WHERE user_id = $1 AND is_read = FALSE
    `,
    [userId]
  );
  return result.rowCount;
}

module.exports = { listForUser, markAsRead, markAllAsRead };
